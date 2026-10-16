import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { periodoActual, rangoMes } from '../../lib/fechas.js';
import { redondear2 } from '../../services/utilidades.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };

function serializarEmpleado(e, pagos = {}) {
  return {
    id: e.id,
    nombre: e.nombre,
    cargo: e.cargo,
    sueldoBase: Number(e.sueldoBase),
    activo: e.activo,
    pagadoMes: pagos.pagadoMes ?? 0,
    ultimoPago: pagos.ultimoPago ?? null,
  };
}

const datosAuditoria = (e) => ({
  nombre: e.nombre,
  cargo: e.cargo,
  sueldoBase: Number(e.sueldoBase),
  activo: e.activo,
});

export async function listarEmpleados({ activo }) {
  const where = {};
  if (activo !== 'todos') where.activo = activo === 'true';

  const [empleados, delMes, ultimos] = await Promise.all([
    prisma.empleado.findMany({ where, orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] }),
    // Lo pagado a cada empleado en el mes actual
    prisma.gasto.groupBy({
      by: ['empleadoId'],
      where: { empleadoId: { not: null }, anulado: false, fecha: rangoMes(periodoActual()) },
      _sum: { monto: true },
    }),
    // Su último pago, de cualquier mes
    prisma.gasto.groupBy({
      by: ['empleadoId'],
      where: { empleadoId: { not: null }, anulado: false },
      _max: { fecha: true },
    }),
  ]);

  const pagadoMes = new Map(delMes.map((f) => [f.empleadoId, redondear2(Number(f._sum.monto ?? 0))]));
  const ultimoPago = new Map(ultimos.map((f) => [f.empleadoId, f._max.fecha]));

  return empleados.map((e) =>
    serializarEmpleado(e, { pagadoMes: pagadoMes.get(e.id) ?? 0, ultimoPago: ultimoPago.get(e.id) ?? null })
  );
}

export async function crearEmpleado(datos, usuario) {
  return prisma.$transaction(async (tx) => {
    const empleado = await tx.empleado.create({
      data: {
        nombre: datos.nombre,
        cargo: datos.cargo ?? null,
        sueldoBase: redondear2(datos.sueldoBase),
      },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Empleado',
        entidadId: empleado.id,
        accion: 'crear',
        datosDespues: datosAuditoria(empleado),
      },
    });

    return serializarEmpleado(empleado);
  }, OPCIONES_TX);
}

export async function actualizarEmpleado(id, datos, usuario) {
  return prisma.$transaction(async (tx) => {
    const antes = await tx.empleado.findUnique({ where: { id } });
    if (!antes) throw new ErrorHttp(404, 'Empleado no encontrado');

    // Un empleado con pagos recurrentes activos no puede desactivarse: esos pagos fallarían cada mes
    if (datos.activo === false && antes.activo) {
      const recurrentes = await tx.gastoRecurrente.count({ where: { empleadoId: id, activo: true } });
      if (recurrentes > 0) {
        throw new ErrorHttp(
          409,
          `No se puede desactivar: tiene ${recurrentes} pago(s) recurrente(s) activo(s). Desactívalos primero.`
        );
      }
    }

    const data = { ...datos };
    if (data.sueldoBase !== undefined) data.sueldoBase = redondear2(data.sueldoBase);

    const despues = await tx.empleado.update({ where: { id }, data });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Empleado',
        entidadId: id,
        accion: 'editar',
        datosAntes: datosAuditoria(antes),
        datosDespues: datosAuditoria(despues),
      },
    });

    return serializarEmpleado(despues);
  }, OPCIONES_TX);
}