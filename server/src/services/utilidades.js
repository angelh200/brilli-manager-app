export const redondear2 = (n) => Math.round(n * 100) / 100;

// Costo de lo entregado = suma de cantidad × costo guardado en la venta
export function costoDeItems(items) {
  return redondear2(items.reduce((suma, i) => suma + i.cantidad * Number(i.costoUnitarioSnapshot), 0));
}

// Utilidad de una venta = monto pagado − costo de todos los productos entregados
export function utilidadDeVenta(venta) {
  const costoTotal = costoDeItems(venta.items);
  return { costoTotal, utilidad: redondear2(Number(venta.montoPagado) - costoTotal) };
}