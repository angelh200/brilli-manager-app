import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 15000 };

export function serializarCliente(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    apellido: c.apellido,
    usuarioTiktok: c.usuarioTiktok,
    celular: c.celular,
    dni: c.dni,
    departamento: c.departamento,
    ciudad: c.ciudad,
    provincia: c.provincia,
    agenciaDestino: c.agenciaDestino,
    notas: c.notas,
    activo: c.activo,
    creadoEn: c.creadoEn,
  };
}

function datosAuditoria(c) {
  return {
    nombre: c.nombre,
    apellido: c.apellido,
    usuarioTiktok: c.usuarioTiktok,
    celular: c.celular,
    dni: c.dni,
    departamento: c.departamento,
    ciudad: c.ciudad,
    provincia: c.provincia,
    agenciaDestino: c.agenciaDestino,
    notas: c.notas,
    activo: c.activo,
  };
}

function traducirErrorPrisma(error) {
  if (error?.code === 'P2002') {
    throw new ErrorHttp(409, 'Ya existe un cliente con ese usuario de TikTok');
  }
  throw error;
}

export async function listarClientes({ buscar, activo, pagina, limite }, rol) {
  const where = {};

  // El ayudante solo ve clientes activos
  const filtroActivo = rol === 'admin' ? activo : 'true';
  if (filtroActivo !== 'todos') where.activo = filtroActivo === 'true';

  if (buscar) {
    const termino = buscar.replace(/^@+/, '');
    if (termino) {
      where.OR = [
        { nombre: { contains: termino, mode: 'insensitive' } },
        { usuarioTiktok: { contains: termino, mode: 'insensitive' } },
        { celular: { contains: termino } },
        { dni: { contains: termino, mode: 'insensitive' } },
      ];
    }
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }], // el id desempata para que la paginación sea estable
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.cliente.count({ where }),
  ]);

  return { clientes: clientes.map(serializarCliente), total, pagina, limite };
}

export async function obtenerCliente(id) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new ErrorHttp(404, 'Cliente no encontrado');
  return serializarCliente(cliente);
}

export async function crearCliente(datos, usuario) {
  try {
    return await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido ?? null,
          usuarioTiktok: datos.usuarioTiktok ?? null,
          celular: datos.celular ?? null,
          dni: datos.dni ?? null,
          departamento: datos.departamento ?? null,
          ciudad: datos.ciudad ?? null,
          provincia: datos.provincia ?? null,
          agenciaDestino: datos.agenciaDestino ?? null,
          notas: datos.notas ?? null,
        },
      });

      await tx.auditoria.create({
        data: {
          usuarioId: usuario.id,
          entidad: 'Cliente',
          entidadId: cliente.id,
          accion: 'crear',
          datosDespues: datosAuditoria(cliente),
        },
      });

      return serializarCliente(cliente);
    }, OPCIONES_TX);
  } catch (error) {
    traducirErrorPrisma(error);
  }
}

export async function actualizarCliente(id, datos, usuario) {
  try {
    return await prisma.$transaction(async (tx) => {
      const antes = await tx.cliente.findUnique({ where: { id } });
      if (!antes) throw new ErrorHttp(404, 'Cliente no encontrado');

      const despues = await tx.cliente.update({ where: { id }, data: datos });

      let accion = 'editar';
      if (datos.activo !== undefined && datos.activo !== antes.activo) {
        accion = datos.activo ? 'activar' : 'desactivar';
      }

      await tx.auditoria.create({
        data: {
          usuarioId: usuario.id,
          entidad: 'Cliente',
          entidadId: id,
          accion,
          datosAntes: datosAuditoria(antes),
          datosDespues: datosAuditoria(despues),
        },
      });

      return serializarCliente(despues);
    }, OPCIONES_TX);
  } catch (error) {
    traducirErrorPrisma(error);
  }
}