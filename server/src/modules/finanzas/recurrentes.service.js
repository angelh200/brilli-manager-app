import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { fechaDePeriodo, hoyLima, periodoActual, sumarMeses } from '../../lib/fechas.js';
import { redondear2 } from '../../services/utilidades.js';
import { registrarGasto } from './finanzas.service.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };
const MESES_ATRAS = 6; // hasta cuántos meses hacia atrás se muestran los pendientes
const INCLUDE = { categoria: true, cuenta: true, empleado: true };

const serializarRecurrente = (r) => ({
  id: r.id,
  nombre: r.nombre,
  monto: Number(r.monto),
  diaDelMes: r.diaDelMes,
  desdePeriodo: r.desdePeriodo,
  activo: r.activo,
  categoria: { id: r.categoria.id, nombre: r.categoria.nombre, tipo: r.categoria.tipo },
  cuenta: { id: r.cuenta.id, nombre: r.cuenta.nombre },
  empleado: r.empleado ? { id: r.empleado.id, nombre: r.empleado.nombre } : null,
});

const datosAuditoria = (r) => ({
  nombre: r.nombre,
  categoriaId: r.categoriaId,
  cuentaId: r.cuentaId,
  empleadoId: r.empleadoId,
  monto: Number(r.monto),
  diaDelMes: r.diaDelMes,
  desdePeriodo: r.desdePeriodo,
  activo: r.activo,
});

async function validarReferencias(tx, { categoriaId, cuentaId, empleadoId }) {
  if (categoriaId) {
    const categoria = await tx.categoriaGasto.findUnique({ where: { id: categoriaId } });
    if (!categoria || !categoria.activa) throw new ErrorHttp(400, 'La categoría no existe o está inactiva');
  }
  if (cuentaId) {
    const cuenta = await tx.cuenta.findUnique({ where: { id: cuentaId } });
    if (!cuenta || !cuenta.activa) throw new ErrorHttp(400, 'La cuenta no existe o está inactiva');
  }
  if (empleadoId) {
    const empleado = await tx.empleado.findUnique({ where: { id: empleadoId } });
    if (!empleado || !empleado.activo) throw new ErrorHttp(400, 'El empleado no existe o está inactivo');
  }
}

export async function listarRecurrentes({ activo }) {
  const where = {};
  if (activo !== 'todos') where.activo = activo === 'true';

  const recurrentes = await prisma.gastoRecurrente.findMany({
    where,
    include: INCLUDE,
    orderBy: [{ activo: 'desc' }, { diaDelMes: 'asc' }, { nombre: 'asc' }],
  });
  return recurrentes.map(serializarRecurrente);
}

export async function crearRecurrente(datos, usuario) {
  return prisma.$transaction(async (tx) => {
    await validarReferencias(tx, datos);

    const creado = await tx.gastoRecurrente.create({
      data: {
        nombre: datos.nombre,
        categoriaId: datos.categoriaId,
        cuentaId: datos.cuentaId,
        empleadoId: datos.empleadoId ?? null,
        monto: redondear2(datos.monto),
        diaDelMes: datos.diaDelMes,
        desdePeriodo: datos.desdePeriodo,
      },
      include: INCLUDE,
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'GastoRecurrente',
        entidadId: creado.id,
        accion: 'crear',
        datosDespues: datosAuditoria(creado),
      },
    });

    return serializarRecurrente(creado);
  }, OPCIONES_TX);
}

export async function actualizarRecurrente(id, datos, usuario) {
  return prisma.$transaction(async (tx) => {
    const antes = await tx.gastoRecurrente.findUnique({ where: { id } });
    if (!antes) throw new ErrorHttp(404, 'Pago recurrente no encontrado');

    await validarReferencias(tx, datos);

    const data = { ...datos };
    if (data.monto !== undefined) data.monto = redondear2(data.monto);

    const despues = await tx.gastoRecurrente.update({ where: { id }, data, include: INCLUDE });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'GastoRecurrente',
        entidadId: id,
        accion: 'editar',
        datosAntes: datosAuditoria(antes),
        datosDespues: datosAuditoria(despues),
      },
    });

    return serializarRecurrente(despues);
  }, OPCIONES_TX);
}

// Pagos cuyo día ya llegó y todavía no tienen gasto registrado
export async function listarPendientes() {
  const actual = periodoActual();
  const hoy = hoyLima();

  const recurrentes = await prisma.gastoRecurrente.findMany({ where: { activo: true }, include: INCLUDE });
  if (recurrentes.length === 0) return [];

  const registrados = await prisma.gasto.findMany({
    where: { recurrenteId: { in: recurrentes.map((r) => r.id) }, anulado: false, periodo: { not: null } },
    select: { recurrenteId: true, periodo: true },
  });
  const hechos = new Set(registrados.map((g) => `${g.recurrenteId}:${g.periodo}`));

  const limiteInferior = sumarMeses(actual, -MESES_ATRAS);
  const pendientes = [];

  for (const r of recurrentes) {
    let periodo = r.desdePeriodo > limiteInferior ? r.desdePeriodo : limiteInferior;
    while (periodo <= actual) {
      const fechaPrevista = fechaDePeriodo(periodo, r.diaDelMes);
      if (fechaPrevista <= hoy && !hechos.has(`${r.id}:${periodo}`)) {
        pendientes.push({
          recurrenteId: r.id,
          nombre: r.nombre,
          periodo,
          fechaPrevista,
          monto: Number(r.monto),
          vencido: fechaPrevista < hoy,
          categoria: { id: r.categoria.id, nombre: r.categoria.nombre, tipo: r.categoria.tipo },
          cuenta: { id: r.cuenta.id, nombre: r.cuenta.nombre },
          empleado: r.empleado ? { id: r.empleado.id, nombre: r.empleado.nombre } : null,
        });
      }
      periodo = sumarMeses(periodo, 1);
    }
  }

  return pendientes.sort((a, b) => a.fechaPrevista.localeCompare(b.fechaPrevista));
}

export async function registrarPendiente({ recurrenteId, periodo, monto }, usuario) {
  const recurrente = await prisma.gastoRecurrente.findUnique({ where: { id: recurrenteId } });
  if (!recurrente) throw new ErrorHttp(404, 'Pago recurrente no encontrado');
  if (!recurrente.activo) throw new ErrorHttp(409, 'El pago recurrente está inactivo');

  const hoy = hoyLima();
  if (periodo < recurrente.desdePeriodo || periodo > periodoActual()) {
    throw new ErrorHttp(400, 'Ese periodo no corresponde a este pago');
  }

  const fechaPrevista = fechaDePeriodo(periodo, recurrente.diaDelMes);
  if (fechaPrevista > hoy) {
    throw new ErrorHttp(400, `Aún no corresponde: este pago es el ${fechaPrevista}`);
  }

  try {
    // El gasto lleva la fecha programada, así cuenta en el mes al que pertenece
    return await registrarGasto(
      {
        categoriaId: recurrente.categoriaId,
        cuentaId: recurrente.cuentaId,
        monto: monto ?? Number(recurrente.monto),
        fecha: fechaPrevista === hoy ? undefined : `${fechaPrevista}T12:00:00-05:00`,
        descripcion: `${recurrente.nombre} · ${periodo}`,
        empleadoId: recurrente.empleadoId,
      },
      usuario,
      { recurrenteId: recurrente.id, periodo }
    );
  } catch (error) {
    // El índice único frenó un segundo registro del mismo pago y mes
    if (error?.code === 'P2002') throw new ErrorHttp(409, 'Ese pago ya fue registrado este mes');
    throw error;
  }
}