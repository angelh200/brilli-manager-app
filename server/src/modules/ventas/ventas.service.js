import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { hoyLima, rangoDia } from '../../lib/fechas.js';
import { costoDeItems, redondear2, utilidadDeVenta } from '../../services/utilidades.js';

// Margen de tiempo extra: la primera consulta a Neon tras un rato de inactividad puede tardar
const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };

export const INCLUDE_VENTA = {
  cliente: true,
  pedido: true,
  cuenta: true,
  creadoPor: true,
  items: { include: { producto: true } },
};

const nombreEstado = (estado) => estado.replace('_', ' ');

// Lista blanca: el costo y la utilidad SOLO se incluyen para admin
export function serializarVenta(v, rol) {
  const venta = {
    id: v.id,
    fecha: v.fecha,
    montoPagado: Number(v.montoPagado),
    notas: v.notas,
    anulada: v.anulada,
    anuladaEn: v.anuladaEn,
    motivoAnulacion: v.motivoAnulacion,
    cliente: { id: v.cliente.id, nombre: v.cliente.nombre, usuarioTiktok: v.cliente.usuarioTiktok },
    pedido: v.pedido ? { id: v.pedido.id, estado: v.pedido.estado } : null,
    cuenta: v.cuenta ? { id: v.cuenta.id, nombre: v.cuenta.nombre } : null,
    creadoPor: v.creadoPor?.nombre ?? null,
    cantidadProductos: v.items.reduce((suma, i) => suma + i.cantidad, 0),
    items: v.items.map((i) => {
      const item = {
        productoId: i.productoId,
        nombre: i.producto.nombre,
        sku: i.producto.sku,
        cantidad: i.cantidad,
      };
      if (rol === 'admin') {
        item.costoUnitario = Number(i.costoUnitarioSnapshot);
        item.costoTotal = redondear2(i.cantidad * Number(i.costoUnitarioSnapshot));
      }
      return item;
    }),
  };

  if (rol === 'admin') {
    const { costoTotal, utilidad } = utilidadDeVenta(v);
    venta.costoTotal = costoTotal;
    venta.utilidad = utilidad;
  }
  return venta;
}

async function leerCostoEmpaque(tx) {
  const config = await tx.configuracion.findUnique({ where: { clave: 'costo_empaque_por_paquete' } });
  const valor = Number(config?.valor);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

export async function obtenerVenta(id, rol) {
  const venta = await prisma.venta.findUnique({ where: { id }, include: INCLUDE_VENTA });
  if (!venta) throw new ErrorHttp(404, 'Venta no encontrada');
  return serializarVenta(venta, rol);
}

export async function listarVentas(filtros, rol) {
  const where = {};

  if (filtros.fecha) {
    where.fecha = rangoDia(filtros.fecha);
  } else if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = rangoDia(filtros.desde).gte;
    if (filtros.hasta) where.fecha.lt = rangoDia(filtros.hasta).lt;
  } else if (!filtros.clienteId && !filtros.pedidoId) {
    where.fecha = rangoDia(hoyLima()); // sin filtros: las ventas de hoy
  }

  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.pedidoId) where.pedidoId = filtros.pedidoId;
  if (filtros.incluirAnuladas === 'false') where.anulada = false;

  const [ventas, total, vigentes] = await Promise.all([
    prisma.venta.findMany({
      where,
      include: INCLUDE_VENTA,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.venta.count({ where }),
    // Los totales excluyen las ventas anuladas
    prisma.venta.findMany({
      where: { ...where, anulada: false },
      select: {
        montoPagado: true,
        items: { select: { cantidad: true, costoUnitarioSnapshot: true } },
      },
    }),
  ]);

  const totalVendido = redondear2(vigentes.reduce((s, v) => s + Number(v.montoPagado), 0));
  const totales = { cantidadVentas: vigentes.length, totalVendido };
  if (rol === 'admin') {
    const costo = redondear2(vigentes.reduce((s, v) => s + costoDeItems(v.items), 0));
    totales.costoTotal = costo;
    totales.utilidad = redondear2(totalVendido - costo);
  }

  return {
    ventas: ventas.map((v) => serializarVenta(v, rol)),
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totales,
  };
}

export async function registrarVenta(datos, usuario) {
  // Une líneas repetidas del mismo producto y las ordena por id: así dos ventas
  // simultáneas toman los productos en el mismo orden y no se bloquean entre sí
  const cantidades = new Map();
  for (const { productoId, cantidad } of datos.items) {
    cantidades.set(productoId, (cantidades.get(productoId) ?? 0) + cantidad);
  }
  const lineas = [...cantidades.entries()]
    .map(([productoId, cantidad]) => ({ productoId, cantidad }))
    .sort((a, b) => a.productoId - b.productoId);

  const monto = redondear2(datos.montoPagado);

  const ejecutar = () =>
    prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({ where: { id: datos.clienteId } });
      if (!cliente || !cliente.activo) {
        throw new ErrorHttp(400, 'El cliente no existe o está inactivo');
      }

      if (monto > 0) {
        const cuenta = await tx.cuenta.findUnique({ where: { id: datos.cuentaId } });
        if (!cuenta || !cuenta.activa) {
          throw new ErrorHttp(400, 'La cuenta seleccionada no existe o está inactiva');
        }
      }

      const productos = await tx.producto.findMany({
        where: { id: { in: lineas.map((l) => l.productoId) } },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));
      for (const l of lineas) {
        const p = porId.get(l.productoId);
        if (!p) throw new ErrorHttp(400, 'Uno de los productos no existe');
        if (!p.activo) throw new ErrorHttp(400, `El producto "${p.nombre}" está inactivo`);
      }

      // Pedido abierto del cliente; si no tiene, se crea uno
      let pedido = await tx.pedido.findFirst({
        where: { clienteId: cliente.id, estado: 'acumulando' },
      });
      const pedidoNuevo = !pedido;
      if (!pedido) {
        pedido = await tx.pedido.create({
          data: {
            clienteId: cliente.id,
            estado: 'acumulando',
            agencia: cliente.agenciaDestino,
            costoEmpaque: await leerCostoEmpaque(tx),
          },
        });
      }

      const venta = await tx.venta.create({
        data: {
          clienteId: cliente.id,
          pedidoId: pedido.id,
          cuentaId: monto > 0 ? datos.cuentaId : null,
          creadoPorId: usuario.id,
          fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
          montoPagado: monto,
          notas: datos.notas ?? null,
          items: {
            create: lineas.map((l) => ({
              productoId: l.productoId,
              cantidad: l.cantidad,
              // Costo del producto EN ESTE MOMENTO: la utilidad histórica no cambia después
              costoUnitarioSnapshot: porId.get(l.productoId).costoPromedio,
            })),
          },
        },
      });

      for (const l of lineas) {
        // Descuento atómico: solo se aplica si alcanza el stock
        const resultado = await tx.producto.updateMany({
          where: { id: l.productoId, stockActual: { gte: l.cantidad } },
          data: { stockActual: { decrement: l.cantidad } },
        });
        const actual = await tx.producto.findUnique({
          where: { id: l.productoId },
          select: { stockActual: true },
        });
        if (resultado.count === 0) {
          const nombre = porId.get(l.productoId).nombre;
          throw new ErrorHttp(
            400,
            `Stock insuficiente de "${nombre}": hay ${actual.stockActual} y pides ${l.cantidad}`
          );
        }
        await tx.movimientoStock.create({
          data: {
            productoId: l.productoId,
            tipo: 'venta',
            cantidad: -l.cantidad,
            stockResultante: actual.stockActual,
            ventaId: venta.id,
          },
        });
      }

      if (monto > 0) {
        await tx.movimientoCaja.create({
          data: {
            cuentaId: datos.cuentaId,
            tipo: 'ingreso',
            monto,
            categoria: 'venta',
            descripcion: `Venta #${venta.id}`,
            ventaId: venta.id,
          },
        });
      }

      await tx.auditoria.create({
        data: {
          usuarioId: usuario.id,
          entidad: 'Venta',
          entidadId: venta.id,
          accion: 'crear',
          datosDespues: {
            clienteId: cliente.id,
            pedidoId: pedido.id,
            montoPagado: monto,
            items: lineas,
          },
        },
      });

      return { ventaId: venta.id, pedidoNuevo };
    }, OPCIONES_TX);

  let resultado;
  try {
    resultado = await ejecutar();
  } catch (error) {
    // Dos ventas simultáneas del mismo cliente intentaron crear su pedido a la vez:
    // el índice único frenó a una; se repite y ahora encuentra el pedido ya creado
    if (error?.code === 'P2002') resultado = await ejecutar();
    else throw error;
  }

  const venta = await obtenerVenta(resultado.ventaId, usuario.rol);
  return { venta, pedidoNuevo: resultado.pedidoNuevo };
}

export async function anularVenta(id, { motivo }, usuario) {
  await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { id },
      include: { items: true, pedido: true },
    });
    if (!venta) throw new ErrorHttp(404, 'Venta no encontrada');
    if (venta.anulada) throw new ErrorHttp(409, 'La venta ya está anulada');

    if (venta.pedido && !['acumulando', 'empaquetado'].includes(venta.pedido.estado)) {
      throw new ErrorHttp(
        409,
        `No se puede anular: el pedido #${venta.pedido.id} ya está ${nombreEstado(venta.pedido.estado)}`
      );
    }

    // Marca atómica: si dos personas anulan a la vez, solo una lo logra
    const marcada = await tx.venta.updateMany({
      where: { id, anulada: false },
      data: { anulada: true, anuladaEn: new Date(), motivoAnulacion: motivo },
    });
    if (marcada.count === 0) throw new ErrorHttp(409, 'La venta ya está anulada');

    const items = [...venta.items].sort((a, b) => a.productoId - b.productoId);
    for (const item of items) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stockActual: { increment: item.cantidad } },
      });
      const actual = await tx.producto.findUnique({
        where: { id: item.productoId },
        select: { stockActual: true },
      });
      await tx.movimientoStock.create({
        data: {
          productoId: item.productoId,
          tipo: 'anulacion',
          cantidad: item.cantidad,
          stockResultante: actual.stockActual,
          ventaId: id,
          motivo: `Anulación de venta #${id}`,
        },
      });
    }

    if (Number(venta.montoPagado) > 0 && venta.cuentaId) {
      await tx.movimientoCaja.create({
        data: {
          cuentaId: venta.cuentaId,
          tipo: 'egreso',
          monto: venta.montoPagado,
          categoria: 'anulacion_venta',
          descripcion: `Anulación de venta #${id}`,
          ventaId: id,
        },
      });
    }

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Venta',
        entidadId: id,
        accion: 'anular',
        datosAntes: { anulada: false },
        datosDespues: { anulada: true, motivo },
      },
    });
  }, OPCIONES_TX);

  return obtenerVenta(id, usuario.rol);
}