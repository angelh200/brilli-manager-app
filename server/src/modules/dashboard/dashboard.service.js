import { prisma } from '../../lib/prisma.js';
import { diaLima, hoyLima, periodoActual, rangoDia, sumarDias, sumarMeses } from '../../lib/fechas.js';
import { costoDeItems, redondear2 } from '../../services/utilidades.js';
import { calcularResultadoMes } from '../../services/resultados.js';
import { obtenerResumen as resumenCaja } from '../caja/caja.service.js';
import { listarProductos, obtenerResumen as resumenInventario } from '../productos/productos.service.js';
import { listarPendientes } from '../finanzas/recurrentes.service.js';

const DIAS_SERIE = 14;
const DIAS_PEDIDO_ANTIGUO = 7;

// Ventas por día de los últimos 14 días (incluye hoy), con ceros en los días sin ventas
async function calcularSerie() {
  const hoy = hoyLima();
  const desde = sumarDias(hoy, -(DIAS_SERIE - 1));

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: rangoDia(desde).gte }, anulada: false },
    select: {
      fecha: true,
      montoPagado: true,
      items: { select: { cantidad: true, costoUnitarioSnapshot: true } },
    },
  });

  const porDia = new Map();
  for (let i = DIAS_SERIE - 1; i >= 0; i--) {
    porDia.set(sumarDias(hoy, -i), { cantidad: 0, total: 0, costo: 0 });
  }
  for (const venta of ventas) {
    const fila = porDia.get(diaLima(venta.fecha));
    if (!fila) continue;
    fila.cantidad += 1;
    fila.total += Number(venta.montoPagado);
    fila.costo += costoDeItems(venta.items);
  }

  return [...porDia].map(([fecha, f]) => ({
    fecha,
    cantidad: f.cantidad,
    total: redondear2(f.total),
    margen: redondear2(f.total - f.costo),
  }));
}

// Pedidos en curso (solo los que tienen ventas activas)
async function calcularPedidos() {
  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: { in: ['acumulando', 'empaquetado', 'en_agencia'] },
      ventas: { some: { anulada: false } },
    },
    select: { estado: true, creadoEn: true, codigoSeguimiento: true },
  });

  const limite = Date.now() - DIAS_PEDIDO_ANTIGUO * 24 * 60 * 60 * 1000;
  return {
    acumulando: pedidos.filter((p) => p.estado === 'acumulando').length,
    empaquetado: pedidos.filter((p) => p.estado === 'empaquetado').length,
    enAgencia: pedidos.filter((p) => p.estado === 'en_agencia').length,
    antiguos: pedidos.filter((p) => p.estado === 'acumulando' && p.creadoEn.getTime() < limite).length,
    sinSeguimiento: pedidos.filter((p) => p.estado === 'en_agencia' && !p.codigoSeguimiento).length,
  };
}

async function calcularInventario() {
  const [resumen, enAlerta] = await Promise.all([
    resumenInventario('admin'),
    listarProductos({ estado: 'alerta', activo: 'true' }, 'admin'),
  ]);

  const alertas = enAlerta
    .sort((a, b) => a.stockActual - b.stockActual)
    .slice(0, 5)
    .map((p) => ({ id: p.id, nombre: p.nombre, stockActual: p.stockActual, stockMinimo: p.stockMinimo, estadoStock: p.estadoStock }));

  return { ...resumen, alertas };
}

export async function obtenerDashboard() {
  const periodo = periodoActual();
  const anterior = sumarMeses(periodo, -1);

  const [serie, pedidos, inventario, caja, pendientes, mes, mesAnterior] = await Promise.all([
    calcularSerie(),
    calcularPedidos(),
    calcularInventario(),
    resumenCaja(),
    listarPendientes(),
    calcularResultadoMes(periodo),
    calcularResultadoMes(anterior),
  ]);

  return {
    hoy: hoyLima(),
    serie,
    pedidos,
    inventario,
    caja: {
      saldoTotal: caja.saldoTotal,
      cuentas: caja.cuentas.map((c) => ({ id: c.id, nombre: c.nombre, saldo: c.saldo, activa: c.activa })),
    },
    pendientes: {
      cantidad: pendientes.length,
      monto: redondear2(pendientes.reduce((suma, p) => suma + p.monto, 0)),
    },
    mes: {
      periodo,
      ventas: mes.ventas.total,
      utilidadNeta: mes.utilidadNeta,
      costosFijos: mes.costosFijos,
      equilibrio: {
        puntoEquilibrio: mes.equilibrio.puntoEquilibrio,
        avance: mes.equilibrio.avance,
        alcanzado: mes.equilibrio.alcanzado,
        ventasNecesarias: mes.equilibrio.ventasNecesarias,
      },
      anterior: { periodo: anterior, ventas: mesAnterior.ventas.total, utilidadNeta: mesAnterior.utilidadNeta },
    },
  };
}