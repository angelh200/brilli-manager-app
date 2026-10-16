import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { periodoActual, rangoDia } from '../../lib/fechas.js';
import { redondear2 } from '../../services/utilidades.js';
import { calcularResultadoMes } from '../../services/resultados.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };

// ---------- Resumen del mes ----------

export const obtenerResumen = (periodo) => calcularResultadoMes(periodo ?? periodoActual());

// ---------- Categorías ----------

const serializarCategoria = (c, cantidadGastos) => ({
  id: c.id,
  nombre: c.nombre,
  tipo: c.tipo,
  presupuestoMensual: c.presupuestoMensual === null ? null : Number(c.presupuestoMensual),
  activa: c.activa,
  ...(cantidadGastos !== undefined && { cantidadGastos }),
});

async function verificarNombreLibre(nombre, excluirId) {
  const where = { nombre: { equals: nombre, mode: 'insensitive' } };
  if (excluirId) where.NOT = { id: excluirId };
  const existente = await prisma.categoriaGasto.findFirst({ where });
  if (existente) throw new ErrorHttp(409, 'Ya existe una categoría con ese nombre');
}

export async function listarCategorias() {
  const categorias = await prisma.categoriaGasto.findMany({
    orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
    include: { _count: { select: { gastos: true } } },
  });
  return categorias.map((c) => serializarCategoria(c, c._count.gastos));
}

export async function crearCategoria(datos, usuario) {
  await verificarNombreLibre(datos.nombre);
  const categoria = await prisma.$transaction(async (tx) => {
    const creada = await tx.categoriaGasto.create({
      data: {
        nombre: datos.nombre,
        tipo: datos.tipo,
        presupuestoMensual: datos.presupuestoMensual ?? null,
      },
    });
    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'CategoriaGasto',
        entidadId: creada.id,
        accion: 'crear',
        datosDespues: { nombre: creada.nombre, tipo: creada.tipo },
      },
    });
    return creada;
  }, OPCIONES_TX);
  return serializarCategoria(categoria, 0);
}

export async function actualizarCategoria(id, datos, usuario) {
  const existe = await prisma.categoriaGasto.findUnique({ where: { id } });
  if (!existe) throw new ErrorHttp(404, 'Categoría no encontrada');
  if (datos.nombre) await verificarNombreLibre(datos.nombre, id);

  const categoria = await prisma.$transaction(async (tx) => {
    const despues = await tx.categoriaGasto.update({ where: { id }, data: datos });
    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'CategoriaGasto',
        entidadId: id,
        accion: 'editar',
        datosAntes: { nombre: existe.nombre, tipo: existe.tipo, activa: existe.activa },
        datosDespues: { nombre: despues.nombre, tipo: despues.tipo, activa: despues.activa },
      },
    });
    return despues;
  }, OPCIONES_TX);
  return serializarCategoria(categoria);
}

// ---------- Gastos ----------

const INCLUDE_GASTO = { categoria: true, cuenta: true, empleado: true, creadoPor: true };

function serializarGasto(g) {
  return {
    id: g.id,
    fecha: g.fecha,
    tipo: g.tipo,
    monto: Number(g.monto),
    descripcion: g.descripcion,
    categoria: { id: g.categoria.id, nombre: g.categoria.nombre },
    cuenta: { id: g.cuenta.id, nombre: g.cuenta.nombre },
    empleado: g.empleado ? { id: g.empleado.id, nombre: g.empleado.nombre } : null,
    recurrenteId: g.recurrenteId,
    periodo: g.periodo,
    creadoPor: g.creadoPor?.nombre ?? null,
    anulado: g.anulado,
    anuladoEn: g.anuladoEn,
    motivoAnulacion: g.motivoAnulacion,
  };
}

export async function obtenerGasto(id) {
  const gasto = await prisma.gasto.findUnique({ where: { id }, include: INCLUDE_GASTO });
  if (!gasto) throw new ErrorHttp(404, 'Gasto no encontrado');
  return serializarGasto(gasto);
}

export async function listarGastos(filtros) {
  const where = {};
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = rangoDia(filtros.desde).gte;
    if (filtros.hasta) where.fecha.lt = rangoDia(filtros.hasta).lt;
  }
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
  if (filtros.incluirAnulados === 'false') where.anulado = false;

  const [gastos, total, sumas] = await Promise.all([
    prisma.gasto.findMany({
      where,
      include: INCLUDE_GASTO,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.gasto.count({ where }),
    // Los totales excluyen los gastos anulados
    prisma.gasto.groupBy({ by: ['tipo'], where: { ...where, anulado: false }, _sum: { monto: true } }),
  ]);

  const suma = (tipo) => redondear2(Number(sumas.find((s) => s.tipo === tipo)?._sum.monto ?? 0));
  const totales = { fijo: suma('fijo'), variable: suma('variable'), sueldo: suma('sueldo'), otro: suma('otro') };
  totales.total = redondear2(totales.fijo + totales.variable + totales.sueldo + totales.otro);

  return {
    gastos: gastos.map(serializarGasto),
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totales,
  };
}

// `extra` lo usarán los gastos recurrentes: { recurrenteId, periodo }
export async function registrarGasto(datos, usuario, extra = {}) {
  const monto = redondear2(datos.monto);

  const gastoId = await prisma.$transaction(async (tx) => {
    const categoria = await tx.categoriaGasto.findUnique({ where: { id: datos.categoriaId } });
    if (!categoria || !categoria.activa) throw new ErrorHttp(400, 'La categoría no existe o está inactiva');

    const cuenta = await tx.cuenta.findUnique({ where: { id: datos.cuentaId } });
    if (!cuenta || !cuenta.activa) throw new ErrorHttp(400, 'La cuenta seleccionada no existe o está inactiva');

    if (datos.empleadoId) {
      const empleado = await tx.empleado.findUnique({ where: { id: datos.empleadoId } });
      if (!empleado || !empleado.activo) throw new ErrorHttp(400, 'El empleado no existe o está inactivo');
    }

    const fecha = datos.fecha ? new Date(datos.fecha) : new Date();

    const gasto = await tx.gasto.create({
      data: {
        categoriaId: categoria.id,
        tipo: categoria.tipo, // se copia: si luego reclasificas la categoría, este gasto no cambia
        cuentaId: cuenta.id,
        empleadoId: datos.empleadoId ?? null,
        recurrenteId: extra.recurrenteId ?? null,
        periodo: extra.periodo ?? null,
        creadoPorId: usuario.id,
        monto,
        fecha,
        descripcion: datos.descripcion ?? null,
      },
    });

    // Cada gasto es un egreso de la cuenta
    await tx.movimientoCaja.create({
      data: {
        cuentaId: cuenta.id,
        tipo: 'egreso',
        monto,
        categoria: 'gasto',
        descripcion: [categoria.nombre, datos.descripcion].filter(Boolean).join(': '),
        gastoId: gasto.id,
        fecha,
      },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Gasto',
        entidadId: gasto.id,
        accion: 'crear',
        datosDespues: {
          categoriaId: categoria.id,
          tipo: categoria.tipo,
          cuentaId: cuenta.id,
          monto,
          empleadoId: datos.empleadoId ?? null,
          recurrenteId: extra.recurrenteId ?? null,
          periodo: extra.periodo ?? null,
        },
      },
    });

    return gasto.id;
  }, OPCIONES_TX);

  return obtenerGasto(gastoId);
}

export async function anularGasto(id, { motivo }, usuario) {
  await prisma.$transaction(async (tx) => {
    const gasto = await tx.gasto.findUnique({ where: { id } });
    if (!gasto) throw new ErrorHttp(404, 'Gasto no encontrado');
    if (gasto.anulado) throw new ErrorHttp(409, 'El gasto ya está anulado');

    const marcado = await tx.gasto.updateMany({
      where: { id, anulado: false },
      data: { anulado: true, anuladoEn: new Date(), motivoAnulacion: motivo },
    });
    if (marcado.count === 0) throw new ErrorHttp(409, 'El gasto ya está anulado');

    // El egreso en caja se marca anulado: el dinero vuelve a la cuenta
    await tx.movimientoCaja.updateMany({
      where: { gastoId: id, anulado: false },
      data: { anulado: true, anuladoEn: new Date(), motivoAnulacion: `Gasto anulado: ${motivo}` },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Gasto',
        entidadId: id,
        accion: 'anular',
        datosAntes: { anulado: false },
        datosDespues: { anulado: true, motivo },
      },
    });
  }, OPCIONES_TX);

  return obtenerGasto(id);
}