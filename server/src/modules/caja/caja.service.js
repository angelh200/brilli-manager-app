import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { rangoDia } from '../../lib/fechas.js';
import { redondear2 } from '../../services/utilidades.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };

// Movimientos que se crean a mano desde Caja. Los demás nacen de ventas, compras y, más adelante, gastos.
export const CATEGORIAS_MANUALES = ['transferencia', 'retiro_socio', 'aporte_socio', 'ajuste_saldo'];

const soles = (n) => `S/ ${n.toFixed(2)}`;

// Saldo = inicial + ingresos − egresos − retiros − transferencias salientes + transferencias entrantes
async function calcularSaldos(db, cuentas) {
  const [propios, entrantes] = await Promise.all([
    db.movimientoCaja.groupBy({
      by: ['cuentaId', 'tipo'],
      where: { anulado: false },
      _sum: { monto: true },
    }),
    db.movimientoCaja.groupBy({
      by: ['cuentaDestinoId'],
      where: { anulado: false, tipo: 'transferencia', cuentaDestinoId: { not: null } },
      _sum: { monto: true },
    }),
  ]);

  const saldos = new Map(cuentas.map((c) => [c.id, Number(c.saldoInicial)]));

  for (const fila of propios) {
    if (!saldos.has(fila.cuentaId)) continue;
    const monto = Number(fila._sum.monto ?? 0);
    // Solo el ingreso suma; egreso, retiro de socio y transferencia (saliente) restan
    saldos.set(fila.cuentaId, saldos.get(fila.cuentaId) + (fila.tipo === 'ingreso' ? monto : -monto));
  }
  for (const fila of entrantes) {
    if (!saldos.has(fila.cuentaDestinoId)) continue;
    saldos.set(fila.cuentaDestinoId, saldos.get(fila.cuentaDestinoId) + Number(fila._sum.monto ?? 0));
  }

  return new Map([...saldos].map(([id, saldo]) => [id, redondear2(saldo)]));
}

async function saldoDeCuenta(db, cuenta) {
  return (await calcularSaldos(db, [cuenta])).get(cuenta.id);
}

// Bloquea las cuentas (en orden) para que dos operaciones simultáneas no las dejen en negativo
async function bloquearCuentas(tx, ids) {
  for (const id of [...new Set(ids)].sort((a, b) => a - b)) {
    await tx.$queryRaw`SELECT "id" FROM "Cuenta" WHERE "id" = ${id} FOR UPDATE`;
  }
}

const serializarCuenta = (c, saldo) => ({
  id: c.id,
  nombre: c.nombre,
  saldoInicial: Number(c.saldoInicial),
  activa: c.activa,
  saldo,
});

async function verificarNombreLibre(db, nombre, excluirId) {
  const where = { nombre: { equals: nombre, mode: 'insensitive' } };
  if (excluirId) where.NOT = { id: excluirId };
  const existente = await db.cuenta.findFirst({ where });
  if (existente) throw new ErrorHttp(409, 'Ya existe una cuenta con ese nombre');
}

// ---------- Cuentas ----------

export async function obtenerResumen() {
  const cuentas = await prisma.cuenta.findMany({ orderBy: { id: 'asc' } });
  const saldos = await calcularSaldos(prisma, cuentas);
  const lista = cuentas.map((c) => serializarCuenta(c, saldos.get(c.id)));
  const saldoTotal = redondear2(lista.filter((c) => c.activa).reduce((suma, c) => suma + c.saldo, 0));
  return { cuentas: lista, saldoTotal };
}

export async function crearCuenta(datos, usuario) {
  return prisma.$transaction(async (tx) => {
    await verificarNombreLibre(tx, datos.nombre);

    const cuenta = await tx.cuenta.create({
      data: { nombre: datos.nombre, saldoInicial: redondear2(datos.saldoInicial) },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Cuenta',
        entidadId: cuenta.id,
        accion: 'crear',
        datosDespues: { nombre: cuenta.nombre, saldoInicial: Number(cuenta.saldoInicial) },
      },
    });

    return serializarCuenta(cuenta, Number(cuenta.saldoInicial));
  }, OPCIONES_TX);
}

export async function actualizarCuenta(id, datos, usuario) {
  const cuenta = await prisma.$transaction(async (tx) => {
    const antes = await tx.cuenta.findUnique({ where: { id } });
    if (!antes) throw new ErrorHttp(404, 'Cuenta no encontrada');

    if (datos.nombre) await verificarNombreLibre(tx, datos.nombre, id);

    // Una cuenta solo se desactiva si no tiene dinero
    if (datos.activa === false && antes.activa) {
      await bloquearCuentas(tx, [id]);
      const saldo = await saldoDeCuenta(tx, antes);
      if (saldo !== 0) {
        throw new ErrorHttp(
          409,
          `No se puede desactivar: la cuenta tiene un saldo de ${soles(saldo)}. Transfiere el dinero a otra cuenta primero.`
        );
      }
    }

    const data = { ...datos };
    if (data.saldoInicial !== undefined) data.saldoInicial = redondear2(data.saldoInicial);

    const despues = await tx.cuenta.update({ where: { id }, data });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Cuenta',
        entidadId: id,
        accion: 'editar',
        datosAntes: { nombre: antes.nombre, saldoInicial: Number(antes.saldoInicial), activa: antes.activa },
        datosDespues: { nombre: despues.nombre, saldoInicial: Number(despues.saldoInicial), activa: despues.activa },
      },
    });

    return despues;
  }, OPCIONES_TX);

  return serializarCuenta(cuenta, await saldoDeCuenta(prisma, cuenta));
}

// Cuadra la cuenta con el dinero real: crea un ingreso o egreso por la diferencia
export async function ajustarSaldo(id, { saldoReal, motivo }, usuario) {
  const cuenta = await prisma.$transaction(async (tx) => {
    await bloquearCuentas(tx, [id]);

    const cuentaActual = await tx.cuenta.findUnique({ where: { id } });
    if (!cuentaActual) throw new ErrorHttp(404, 'Cuenta no encontrada');
    if (!cuentaActual.activa) throw new ErrorHttp(400, 'La cuenta está inactiva');

    const saldoAntes = await saldoDeCuenta(tx, cuentaActual);
    const diferencia = redondear2(redondear2(saldoReal) - saldoAntes);
    if (diferencia === 0) throw new ErrorHttp(400, 'El saldo ya coincide con el que indicas');

    const movimiento = await tx.movimientoCaja.create({
      data: {
        cuentaId: id,
        tipo: diferencia > 0 ? 'ingreso' : 'egreso',
        monto: Math.abs(diferencia),
        categoria: 'ajuste_saldo',
        descripcion: motivo,
      },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Cuenta',
        entidadId: id,
        accion: 'ajuste_saldo',
        datosAntes: { saldo: saldoAntes },
        datosDespues: { saldo: redondear2(saldoReal), movimientoId: movimiento.id, motivo },
      },
    });

    return cuentaActual;
  }, OPCIONES_TX);

  return serializarCuenta(cuenta, await saldoDeCuenta(prisma, cuenta));
}

// ---------- Movimientos ----------

const origenDe = (m) => (m.ventaId ? 'venta' : m.compraId ? 'compra' : 'manual');

// Efecto sobre el saldo: +1 suma, −1 resta, 0 neutro (transferencia vista sin filtrar por cuenta)
function signoDe(m, cuentaFiltroId) {
  if (m.tipo === 'ingreso') return 1;
  if (m.tipo === 'egreso' || m.tipo === 'retiro_socio') return -1;
  if (cuentaFiltroId && m.cuentaDestinoId === cuentaFiltroId) return 1;
  if (cuentaFiltroId && m.cuentaId === cuentaFiltroId) return -1;
  return 0;
}

function serializarMovimiento(m, cuentaFiltroId) {
  const origen = origenDe(m);
  return {
    id: m.id,
    fecha: m.fecha,
    tipo: m.tipo,
    monto: Number(m.monto),
    signo: signoDe(m, cuentaFiltroId),
    categoria: m.categoria,
    descripcion: m.descripcion,
    origen,
    ventaId: m.ventaId,
    compraId: m.compraId,
    cuenta: { id: m.cuenta.id, nombre: m.cuenta.nombre },
    cuentaDestino: m.cuentaDestino ? { id: m.cuentaDestino.id, nombre: m.cuentaDestino.nombre } : null,
    anulado: m.anulado,
    anuladoEn: m.anuladoEn,
    motivoAnulacion: m.motivoAnulacion,
    anulable: !m.anulado && origen === 'manual' && CATEGORIAS_MANUALES.includes(m.categoria),
  };
}

export async function listarMovimientos(filtros) {
  const where = {};
  if (filtros.cuentaId) {
    where.OR = [{ cuentaId: filtros.cuentaId }, { cuentaDestinoId: filtros.cuentaId }];
  }
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = rangoDia(filtros.desde).gte;
    if (filtros.hasta) where.fecha.lt = rangoDia(filtros.hasta).lt;
  }
  if (filtros.incluirAnulados === 'false') where.anulado = false;

  const [movimientos, total, sumas] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where,
      include: { cuenta: true, cuentaDestino: true },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.movimientoCaja.count({ where }),
    // Totales del filtro, sin anulados ni transferencias (mover dinero no es ganar ni gastar)
    prisma.movimientoCaja.groupBy({
      by: ['tipo'],
      where: { ...where, anulado: false, tipo: filtros.tipo ?? { in: ['ingreso', 'egreso', 'retiro_socio'] } },
      _sum: { monto: true },
    }),
  ]);

  const suma = (tipo) => Number(sumas.find((s) => s.tipo === tipo)?._sum.monto ?? 0);

  return {
    movimientos: movimientos.map((m) => serializarMovimiento(m, filtros.cuentaId)),
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totales: {
      ingresos: redondear2(suma('ingreso')),
      egresos: redondear2(suma('egreso') + suma('retiro_socio')),
    },
  };
}

export async function registrarMovimiento(datos, usuario) {
  const esTransferencia = datos.operacion === 'transferencia';
  const monto = redondear2(datos.monto);
  const ids = esTransferencia ? [datos.cuentaId, datos.cuentaDestinoId] : [datos.cuentaId];

  const movimiento = await prisma.$transaction(async (tx) => {
    const cuentas = await tx.cuenta.findMany({ where: { id: { in: ids } } });
    if (cuentas.length !== ids.length || cuentas.some((c) => !c.activa)) {
      throw new ErrorHttp(400, 'Una de las cuentas no existe o está inactiva');
    }

    await bloquearCuentas(tx, ids);

    // Retiros y transferencias no pueden dejar la cuenta de origen en negativo
    if (datos.operacion !== 'aporte_socio') {
      const origen = cuentas.find((c) => c.id === datos.cuentaId);
      const saldo = await saldoDeCuenta(tx, origen);
      if (saldo < monto) {
        throw new ErrorHttp(400, `Saldo insuficiente en "${origen.nombre}": tiene ${soles(saldo)}`);
      }
    }

    const creado = await tx.movimientoCaja.create({
      data: {
        cuentaId: datos.cuentaId,
        cuentaDestinoId: esTransferencia ? datos.cuentaDestinoId : null,
        tipo: datos.operacion === 'aporte_socio' ? 'ingreso' : datos.operacion,
        monto,
        categoria: datos.operacion,
        descripcion: datos.descripcion ?? null,
        fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
      },
      include: { cuenta: true, cuentaDestino: true },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'MovimientoCaja',
        entidadId: creado.id,
        accion: 'crear',
        datosDespues: {
          operacion: datos.operacion,
          cuentaId: datos.cuentaId,
          cuentaDestinoId: esTransferencia ? datos.cuentaDestinoId : null,
          monto,
          descripcion: datos.descripcion ?? null,
        },
      },
    });

    return creado;
  }, OPCIONES_TX);

  return serializarMovimiento(movimiento);
}

export async function anularMovimiento(id, { motivo }, usuario) {
  const movimiento = await prisma.$transaction(async (tx) => {
    const mov = await tx.movimientoCaja.findUnique({
      where: { id },
      include: { cuenta: true, cuentaDestino: true },
    });
    if (!mov) throw new ErrorHttp(404, 'Movimiento no encontrado');
    if (mov.anulado) throw new ErrorHttp(409, 'El movimiento ya está anulado');

    if (origenDe(mov) !== 'manual' || !CATEGORIAS_MANUALES.includes(mov.categoria)) {
      throw new ErrorHttp(409, 'Este movimiento nace de una venta, compra o gasto: anula esa operación desde su módulo');
    }

    const involucradas = [mov.cuentaId, mov.cuentaDestinoId].filter(Boolean);
    await bloquearCuentas(tx, involucradas);

    // Al anular, la cuenta que había recibido el dinero lo pierde: no puede quedar en negativo
    const pierde = mov.tipo === 'ingreso' ? mov.cuenta : mov.tipo === 'transferencia' ? mov.cuentaDestino : null;
    if (pierde) {
      const saldo = await saldoDeCuenta(tx, pierde);
      if (saldo - Number(mov.monto) < 0) {
        throw new ErrorHttp(
          409,
          `No se puede anular: la cuenta "${pierde.nombre}" quedaría con saldo negativo (tiene ${soles(saldo)})`
        );
      }
    }

    const marcado = await tx.movimientoCaja.updateMany({
      where: { id, anulado: false },
      data: { anulado: true, anuladoEn: new Date(), motivoAnulacion: motivo },
    });
    if (marcado.count === 0) throw new ErrorHttp(409, 'El movimiento ya está anulado');

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'MovimientoCaja',
        entidadId: id,
        accion: 'anular',
        datosAntes: { anulado: false },
        datosDespues: { anulado: true, motivo },
      },
    });

    return tx.movimientoCaja.findUnique({ where: { id }, include: { cuenta: true, cuentaDestino: true } });
  }, OPCIONES_TX);

  return serializarMovimiento(movimiento);
}