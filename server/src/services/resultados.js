import { prisma } from '../lib/prisma.js';
import { rangoMes } from '../lib/fechas.js';
import { costoDeItems, redondear2 } from './utilidades.js';

export async function calcularResultadoMes(periodo) {
  const rango = rangoMes(periodo);

  const [ventas, pedidos, gastosAgrupados, categorias] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: rango, anulada: false },
      select: {
        montoPagado: true,
        items: { select: { cantidad: true, costoUnitarioSnapshot: true } },
      },
    }),
    // El empaque se asigna al mes en que se creó el pedido (solo pedidos con ventas activas)
    prisma.pedido.findMany({
      where: {
        creadoEn: rango,
        estado: { not: 'cancelado' },
        ventas: { some: { anulada: false } },
      },
      select: { costoEmpaque: true },
    }),
    prisma.gasto.groupBy({
      by: ['categoriaId', 'tipo'],
      where: { fecha: rango, anulado: false },
      _sum: { monto: true },
    }),
    prisma.categoriaGasto.findMany({ orderBy: { nombre: 'asc' } }),
  ]);

  // ----- Ventas y costos directos -----
  const cobradas = ventas.filter((v) => Number(v.montoPagado) > 0);
  const totalVentas = redondear2(ventas.reduce((s, v) => s + Number(v.montoPagado), 0));
  const costoProductos = redondear2(ventas.reduce((s, v) => s + costoDeItems(v.items), 0));
  const costoEmpaque = redondear2(pedidos.reduce((s, p) => s + Number(p.costoEmpaque), 0));

  // ----- Gastos -----
  const porTipo = { fijo: 0, variable: 0, sueldo: 0, otro: 0 };
  const realPorCategoria = new Map();
  for (const fila of gastosAgrupados) {
    const monto = Number(fila._sum.monto ?? 0);
    porTipo[fila.tipo] += monto;
    realPorCategoria.set(fila.categoriaId, (realPorCategoria.get(fila.categoriaId) ?? 0) + monto);
  }
  const gastos = {
    variable: redondear2(porTipo.variable),
    fijo: redondear2(porTipo.fijo),
    sueldo: redondear2(porTipo.sueldo),
    otro: redondear2(porTipo.otro),
  };
  gastos.total = redondear2(gastos.variable + gastos.fijo + gastos.sueldo + gastos.otro);

  // ----- Estado de resultados -----
  const utilidadBruta = redondear2(totalVentas - costoProductos - costoEmpaque);
  const margenContribucion = redondear2(utilidadBruta - gastos.variable);
  const costosFijos = redondear2(gastos.fijo + gastos.sueldo + gastos.otro);
  const utilidadNeta = redondear2(margenContribucion - costosFijos);

  // ----- Punto de equilibrio -----
  // Cuánto hay que vender para que el margen de contribución cubra los costos fijos
  const ratioMargen = totalVentas > 0 ? margenContribucion / totalVentas : null;
  const ticketPromedio = cobradas.length > 0 ? redondear2(totalVentas / cobradas.length) : null;
  let puntoEquilibrio = null;
  let ventasNecesarias = null;
  if (ratioMargen !== null && ratioMargen > 0) {
    puntoEquilibrio = redondear2(costosFijos / ratioMargen);
    if (ticketPromedio) ventasNecesarias = Math.ceil(puntoEquilibrio / ticketPromedio);
  }

  // ----- Presupuesto vs real por categoría -----
  const detalleCategorias = categorias
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      activa: c.activa,
      presupuesto: c.presupuestoMensual === null ? null : Number(c.presupuestoMensual),
      real: redondear2(realPorCategoria.get(c.id) ?? 0),
    }))
    .filter((c) => c.real > 0 || (c.activa && c.presupuesto !== null))
    .sort((a, b) => b.real - a.real);

  return {
    periodo,
    ventas: {
      total: totalVentas,
      cantidad: ventas.length,
      cobradas: cobradas.length,
      ticketPromedio,
    },
    costoProductos,
    costoEmpaque,
    utilidadBruta,
    gastos,
    margenContribucion,
    costosFijos,
    utilidadNeta,
    equilibrio: {
      costosFijos,
      ratioMargen: ratioMargen === null ? null : Math.round(ratioMargen * 10000) / 10000,
      puntoEquilibrio,
      ventasNecesarias,
      ticketPromedio,
      avance: puntoEquilibrio && puntoEquilibrio > 0 ? totalVentas / puntoEquilibrio : null,
      alcanzado: puntoEquilibrio !== null && totalVentas >= puntoEquilibrio,
    },
    categorias: detalleCategorias,
  };
}