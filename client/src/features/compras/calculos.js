import { aNumero } from '@/features/inventario/schemas';

const r2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;

// lineas: [{ producto, cantidad: '10', costo: '4.5' }]  (los campos son texto)
export function calcularCompra(lineas, gastosTexto) {
  const gastos = aNumero(gastosTexto);
  const gastosOk = Number.isFinite(gastos) && gastos >= 0 ? gastos : 0;

  const filas = lineas.map((l) => ({
    ...l,
    cant: aNumero(l.cantidad),
    costoNum: aNumero(l.costo),
  }));
  const esValida = (f) =>
    Number.isInteger(f.cant) && f.cant >= 1 && Number.isFinite(f.costoNum) && f.costoNum > 0;

  const base = filas.filter(esValida).reduce((s, f) => s + f.cant * f.costoNum, 0);

  const detalle = filas.map((f) => {
    if (!esValida(f)) return { ...f, valida: false };

    const parteGastos = base > 0 ? gastosOk * ((f.cant * f.costoNum) / base) : 0;
    const costoFinal = r4(f.costoNum + parteGastos / f.cant);
    const stock = f.producto.stockActual;
    const costoActual = f.producto.costoPromedio ?? 0;

    return {
      ...f,
      valida: true,
      subtotal: r2(f.cant * f.costoNum),
      costoFinal,
      nuevoCosto: r4((stock * costoActual + f.cant * costoFinal) / (stock + f.cant)),
      nuevoStock: stock + f.cant,
    };
  });

  const subtotal = r2(base);
  return {
    detalle,
    subtotal,
    gastos: gastosOk,
    total: r2(subtotal + gastosOk),
    todasValidas: detalle.length > 0 && detalle.every((d) => d.valida),
  };
}