import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { redondear2 } from '../../services/utilidades.js';
import { INCLUDE_VENTA, serializarVenta } from '../ventas/ventas.service.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 15000 };

// Transiciones permitidas. Se puede retroceder un paso para corregir errores.
const TRANSICIONES = {
  acumulando: ['empaquetado', 'cancelado'],
  empaquetado: ['en_agencia', 'acumulando', 'cancelado'],
  en_agencia: ['recibido', 'empaquetado'],
  recibido: ['en_agencia'],
  cancelado: [],
};

const nombreEstado = (estado) => estado.replace('_', ' ');

// Para listas y resumen: solo se cuentan las ventas no anuladas
const INCLUDE_LISTA = {
  cliente: true,
  ventas: {
    where: { anulada: false },
    select: {
      montoPagado: true,
      items: { select: { cantidad: true, costoUnitarioSnapshot: true } },
    },
  },
};

function resumenPedido(p, rol) {
  let totalPagado = 0;
  let productos = 0;
  let costo = 0;
  for (const v of p.ventas) {
    totalPagado += Number(v.montoPagado);
    for (const i of v.items) {
      productos += i.cantidad;
      costo += i.cantidad * Number(i.costoUnitarioSnapshot);
    }
  }

  const resumen = {
    id: p.id,
    estado: p.estado,
    cliente: { id: p.cliente.id, nombre: p.cliente.nombre, usuarioTiktok: p.cliente.usuarioTiktok },
    agencia: p.agencia,
    codigoSeguimiento: p.codigoSeguimiento,
    notas: p.notas,
    fechaEnvio: p.fechaEnvio,
    fechaRecepcion: p.fechaRecepcion,
    creadoEn: p.creadoEn,
    cantidadVentas: p.ventas.length,
    cantidadProductos: productos,
    totalPagado: redondear2(totalPagado),
    transicionesPermitidas: TRANSICIONES[p.estado],
  };

  if (rol === 'admin') {
    const empaque = Number(p.costoEmpaque);
    resumen.costoEmpaque = empaque;
    resumen.costoProductos = redondear2(costo);
    // Un pedido sin ventas activas no genera utilidad (ni pérdida)
    resumen.utilidad = p.ventas.length === 0 ? 0 : redondear2(totalPagado - costo - empaque);
  }
  return resumen;
}

export async function listarPedidos(filtros, rol) {
  const where = {};
  // Por defecto, el tablero muestra solo los pedidos en curso
  where.estado = filtros.estado ?? { in: ['acumulando', 'empaquetado', 'en_agencia'] };
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.buscar) {
    const termino = filtros.buscar.replace(/^@+/, '');
    where.cliente = {
      OR: [
        { nombre: { contains: termino, mode: 'insensitive' } },
        { usuarioTiktok: { contains: termino, mode: 'insensitive' } },
      ],
    };
  }

  const cerrados = filtros.estado === 'recibido' || filtros.estado === 'cancelado';
  const pedidos = await prisma.pedido.findMany({
    where,
    include: INCLUDE_LISTA,
    orderBy: [{ creadoEn: cerrados ? 'desc' : 'asc' }, { id: 'asc' }],
    take: filtros.limite,
  });

  return { pedidos: pedidos.map((p) => resumenPedido(p, rol)) };
}

export async function obtenerPedidoAbierto(clienteId, rol) {
  const pedido = await prisma.pedido.findFirst({
    where: { clienteId, estado: 'acumulando' },
    include: INCLUDE_LISTA,
  });
  return { pedido: pedido ? resumenPedido(pedido, rol) : null };
}

export async function obtenerPedido(id, rol) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      ventas: {
        orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
        include: INCLUDE_VENTA,
      },
    },
  });
  if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado');

  const activas = pedido.ventas.filter((v) => !v.anulada);

  // Lista de empaque: todos los productos del pedido, consolidados
  const consolidado = new Map();
  for (const venta of activas) {
    for (const item of venta.items) {
      const actual = consolidado.get(item.productoId) ?? {
        productoId: item.productoId,
        nombre: item.producto.nombre,
        sku: item.producto.sku,
        cantidad: 0,
      };
      actual.cantidad += item.cantidad;
      consolidado.set(item.productoId, actual);
    }
  }
  const listaEmpaque = [...consolidado.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const resumen = resumenPedido(
    {
      ...pedido,
      ventas: activas.map((v) => ({ montoPagado: v.montoPagado, items: v.items })),
    },
    rol
  );

  return {
    pedido: {
      ...resumen,
      cliente: {
        id: pedido.cliente.id,
        nombre: pedido.cliente.nombre,
        usuarioTiktok: pedido.cliente.usuarioTiktok,
        telefono: pedido.cliente.telefono,
        dni: pedido.cliente.dni,
        ciudad: pedido.cliente.ciudad,
        agenciaDestino: pedido.cliente.agenciaDestino,
      },
      ventas: pedido.ventas.map((v) => serializarVenta(v, rol)),
      listaEmpaque,
      totalUnidades: listaEmpaque.reduce((suma, p) => suma + p.cantidad, 0),
    },
  };
}

export async function actualizarPedido(id, datos, usuario) {
  if (datos.costoEmpaque !== undefined && usuario.rol !== 'admin') {
    throw new ErrorHttp(403, 'Solo un administrador puede cambiar el costo de empaque');
  }

  await prisma.$transaction(async (tx) => {
    const antes = await tx.pedido.findUnique({ where: { id } });
    if (!antes) throw new ErrorHttp(404, 'Pedido no encontrado');

    const despues = await tx.pedido.update({ where: { id }, data: datos });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Pedido',
        entidadId: id,
        accion: 'editar',
        datosAntes: {
          agencia: antes.agencia,
          codigoSeguimiento: antes.codigoSeguimiento,
          notas: antes.notas,
          costoEmpaque: Number(antes.costoEmpaque),
        },
        datosDespues: {
          agencia: despues.agencia,
          codigoSeguimiento: despues.codigoSeguimiento,
          notas: despues.notas,
          costoEmpaque: Number(despues.costoEmpaque),
        },
      },
    });
  }, OPCIONES_TX);

  return obtenerPedido(id, usuario.rol);
}

export async function cambiarEstado(id, nuevoEstado, usuario) {
  try {
    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: { ventas: { where: { anulada: false }, select: { id: true } } },
      });
      if (!pedido) throw new ErrorHttp(404, 'Pedido no encontrado');

      if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
        throw new ErrorHttp(
          409,
          `No se puede pasar un pedido de "${nombreEstado(pedido.estado)}" a "${nombreEstado(nuevoEstado)}"`
        );
      }

      const ventasActivas = pedido.ventas.length;
      if (nuevoEstado === 'cancelado' && ventasActivas > 0) {
        throw new ErrorHttp(409, 'Para cancelar el pedido primero anula sus ventas');
      }
      if (['empaquetado', 'en_agencia', 'recibido'].includes(nuevoEstado) && ventasActivas === 0) {
        throw new ErrorHttp(409, 'El pedido no tiene ventas activas');
      }

      const data = { estado: nuevoEstado };
      if (nuevoEstado === 'en_agencia') {
        data.fechaEnvio = pedido.fechaEnvio ?? new Date();
        data.fechaRecepcion = null;
      } else if (nuevoEstado === 'recibido') {
        data.fechaRecepcion = new Date();
      } else {
        // Al volver a "empaquetado" o "acumulando" se limpian las fechas de envío y recepción
        data.fechaEnvio = null;
        data.fechaRecepcion = null;
      }

      await tx.pedido.update({ where: { id }, data });

      await tx.auditoria.create({
        data: {
          usuarioId: usuario.id,
          entidad: 'Pedido',
          entidadId: id,
          accion: 'cambiar_estado',
          datosAntes: { estado: pedido.estado },
          datosDespues: { estado: nuevoEstado },
        },
      });
    }, OPCIONES_TX);
  } catch (error) {
    // El índice único impide dos pedidos "acumulando" para el mismo cliente
    if (error?.code === 'P2002') {
      throw new ErrorHttp(409, 'Este cliente ya tiene otro pedido acumulando. Empácalo o cancélalo primero.');
    }
    throw error;
  }

  return obtenerPedido(id, usuario.rol);
}