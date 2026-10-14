import { prisma } from '../../lib/prisma.js';
import { ErrorHttp } from '../../lib/errores.js';
import { rangoDia } from '../../lib/fechas.js';
import { redondear2 } from '../../services/utilidades.js';

const OPCIONES_TX = { maxWait: 10000, timeout: 20000 };
const redondear4 = (n) => Math.round(n * 10000) / 10000;

export const INCLUDE_COMPRA = {
  proveedor: true,
  cuenta: true,
  creadoPor: true,
  items: { include: { producto: true } },
};

export function serializarCompra(c) {
  return {
    id: c.id,
    fecha: c.fecha,
    notas: c.notas,
    anulada: c.anulada,
    anuladaEn: c.anuladaEn,
    motivoAnulacion: c.motivoAnulacion,
    proveedor: c.proveedor ? { id: c.proveedor.id, nombre: c.proveedor.nombre } : null,
    cuenta: c.cuenta ? { id: c.cuenta.id, nombre: c.cuenta.nombre } : null,
    creadoPor: c.creadoPor?.nombre ?? null,
    subtotalProductos: redondear2(c.items.reduce((s, i) => s + i.cantidad * Number(i.costoUnitario), 0)),
    gastosAdicionales: Number(c.gastosAdicionales),
    total: Number(c.total),
    cantidadProductos: c.items.reduce((s, i) => s + i.cantidad, 0),
    items: c.items.map((i) => ({
      productoId: i.productoId,
      nombre: i.producto.nombre,
      sku: i.producto.sku,
      cantidad: i.cantidad,
      costoUnitario: Number(i.costoUnitario),
      costoUnitarioFinal: Number(i.costoUnitarioFinal),
      subtotal: redondear2(i.cantidad * Number(i.costoUnitario)),
    })),
  };
}

// Reparte los gastos adicionales entre las líneas, proporcional al valor de cada una
function calcularLineas(items, gastos) {
  const subtotales = items.map((i) => i.cantidad * i.costoUnitario);
  const base = subtotales.reduce((a, b) => a + b, 0);
  return items.map((item, indice) => {
    const parteGastos = base > 0 ? gastos * (subtotales[indice] / base) : 0;
    return { ...item, costoUnitarioFinal: redondear4(item.costoUnitario + parteGastos / item.cantidad) };
  });
}

export async function obtenerCompra(id) {
  const compra = await prisma.compra.findUnique({ where: { id }, include: INCLUDE_COMPRA });
  if (!compra) throw new ErrorHttp(404, 'Compra no encontrada');
  return serializarCompra(compra);
}

export async function listarCompras(filtros) {
  const where = {};
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = rangoDia(filtros.desde).gte;
    if (filtros.hasta) where.fecha.lt = rangoDia(filtros.hasta).lt;
  }
  if (filtros.proveedorId) where.proveedorId = filtros.proveedorId;
  if (filtros.incluirAnuladas === 'false') where.anulada = false;

  const [compras, total, vigentes] = await Promise.all([
    prisma.compra.findMany({
      where,
      include: INCLUDE_COMPRA,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
    }),
    prisma.compra.count({ where }),
    // Los totales excluyen las compras anuladas
    prisma.compra.findMany({ where: { ...where, anulada: false }, select: { total: true } }),
  ]);

  return {
    compras: compras.map(serializarCompra),
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totales: {
      cantidadCompras: vigentes.length,
      totalComprado: redondear2(vigentes.reduce((s, c) => s + Number(c.total), 0)),
    },
  };
}

export async function registrarCompra(datos, usuario) {
  // Se procesan ordenadas por id: así dos operaciones simultáneas toman los productos en el mismo orden
  const ordenadas = [...datos.items].sort((a, b) => a.productoId - b.productoId);
  const gastos = redondear2(datos.gastosAdicionales);
  const lineas = calcularLineas(ordenadas, gastos);
  const subtotal = redondear2(lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0));
  const total = redondear2(subtotal + gastos);

  const compraId = await prisma.$transaction(async (tx) => {
    if (datos.proveedorId) {
      const proveedor = await tx.proveedor.findUnique({ where: { id: datos.proveedorId } });
      if (!proveedor || !proveedor.activo) throw new ErrorHttp(400, 'El proveedor no existe o está inactivo');
    }

    const cuenta = await tx.cuenta.findUnique({ where: { id: datos.cuentaId } });
    if (!cuenta || !cuenta.activa) throw new ErrorHttp(400, 'La cuenta seleccionada no existe o está inactiva');

    const productos = await tx.producto.findMany({
      where: { id: { in: lineas.map((l) => l.productoId) } },
    });
    const porId = new Map(productos.map((p) => [p.id, p]));
    for (const l of lineas) {
      const p = porId.get(l.productoId);
      if (!p) throw new ErrorHttp(400, 'Uno de los productos no existe');
      if (!p.activo) throw new ErrorHttp(400, `El producto "${p.nombre}" está inactivo`);
    }

    const compra = await tx.compra.create({
      data: {
        proveedorId: datos.proveedorId ?? null,
        cuentaId: datos.cuentaId,
        creadoPorId: usuario.id,
        fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
        gastosAdicionales: gastos,
        total,
        notas: datos.notas ?? null,
        items: {
          create: lineas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            costoUnitario: redondear4(l.costoUnitario),
            costoUnitarioFinal: l.costoUnitarioFinal,
          })),
        },
      },
    });

    for (const l of lineas) {
      // Se bloquea la fila: nadie puede vender ni ajustar este producto mientras se recalcula su costo
      const [fila] = await tx.$queryRaw`
        SELECT "stockActual", "costoPromedio" FROM "Producto" WHERE "id" = ${l.productoId} FOR UPDATE`;
      const stock = Number(fila.stockActual);
      const costo = Number(fila.costoPromedio);

      const nuevoStock = stock + l.cantidad;
      // Costo promedio ponderado (con el costo final, que ya incluye los gastos adicionales)
      const nuevoCosto = redondear4((stock * costo + l.cantidad * l.costoUnitarioFinal) / nuevoStock);

      await tx.producto.update({
        where: { id: l.productoId },
        data: { stockActual: { increment: l.cantidad }, costoPromedio: nuevoCosto },
      });

      await tx.movimientoStock.create({
        data: {
          productoId: l.productoId,
          tipo: 'compra',
          cantidad: l.cantidad,
          stockResultante: nuevoStock,
          compraId: compra.id,
        },
      });
    }

    await tx.movimientoCaja.create({
      data: {
        cuentaId: datos.cuentaId,
        tipo: 'egreso',
        monto: total,
        categoria: 'compra',
        descripcion: `Compra #${compra.id}`,
        compraId: compra.id,
      },
    });

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Compra',
        entidadId: compra.id,
        accion: 'crear',
        datosDespues: {
          proveedorId: datos.proveedorId ?? null,
          cuentaId: datos.cuentaId,
          gastosAdicionales: gastos,
          total,
          items: lineas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            costoUnitario: l.costoUnitario,
            costoUnitarioFinal: l.costoUnitarioFinal,
          })),
        },
      },
    });

    return compra.id;
  }, OPCIONES_TX);

  return obtenerCompra(compraId);
}

export async function anularCompra(id, { motivo }, usuario) {
  await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.findUnique({ where: { id }, include: { items: true } });
    if (!compra) throw new ErrorHttp(404, 'Compra no encontrada');
    if (compra.anulada) throw new ErrorHttp(409, 'La compra ya está anulada');

    // Marca atómica: si dos personas anulan a la vez, solo una lo logra
    const marcada = await tx.compra.updateMany({
      where: { id, anulada: false },
      data: { anulada: true, anuladaEn: new Date(), motivoAnulacion: motivo },
    });
    if (marcada.count === 0) throw new ErrorHttp(409, 'La compra ya está anulada');

    const items = [...compra.items].sort((a, b) => a.productoId - b.productoId);
    for (const item of items) {
      const [fila] = await tx.$queryRaw`
        SELECT "stockActual", "costoPromedio" FROM "Producto" WHERE "id" = ${item.productoId} FOR UPDATE`;
      const stock = Number(fila.stockActual);
      const costo = Number(fila.costoPromedio);

      if (stock < item.cantidad) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
          select: { nombre: true },
        });
        throw new ErrorHttp(
          409,
          `No se puede anular: ya se vendieron unidades de "${producto.nombre}" (stock actual ${stock}, la compra trajo ${item.cantidad})`
        );
      }

      // Se retira el lote del promedio: (valor total − valor del lote) / unidades restantes
      const restante = stock - item.cantidad;
      const valorRestante = stock * costo - item.cantidad * Number(item.costoUnitarioFinal);
      const nuevoCosto = restante > 0 ? redondear4(Math.max(0, valorRestante / restante)) : costo;

      await tx.producto.update({
        where: { id: item.productoId },
        data: { stockActual: { decrement: item.cantidad }, costoPromedio: nuevoCosto },
      });

      await tx.movimientoStock.create({
        data: {
          productoId: item.productoId,
          tipo: 'anulacion',
          cantidad: -item.cantidad,
          stockResultante: restante,
          compraId: id,
          motivo: `Anulación de compra #${id}`,
        },
      });
    }

    if (compra.cuentaId) {
      await tx.movimientoCaja.create({
        data: {
          cuentaId: compra.cuentaId,
          tipo: 'ingreso',
          monto: compra.total,
          categoria: 'anulacion_compra',
          descripcion: `Anulación de compra #${id}`,
          compraId: id,
        },
      });
    }

    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id,
        entidad: 'Compra',
        entidadId: id,
        accion: 'anular',
        datosAntes: { anulada: false },
        datosDespues: { anulada: true, motivo },
      },
    });
  }, OPCIONES_TX);

  return obtenerCompra(id);
}