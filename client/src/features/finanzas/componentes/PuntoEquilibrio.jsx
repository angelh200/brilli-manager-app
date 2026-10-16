import { formatearSoles } from '@/lib/formato';

export default function PuntoEquilibrio({ resumen }) {
  const { equilibrio: e, ventas } = resumen;

  if (e.puntoEquilibrio === null) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Punto de equilibrio</h2>
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
          {ventas.total === 0
            ? 'Aún no hay ventas este mes: se calcula cuando haya ventas con margen positivo.'
            : 'Este mes el margen de contribución es cero o negativo: cada venta cuesta más de lo que deja.'}
        </p>
      </section>
    );
  }

  const porcentaje = Math.min(100, Math.round((e.avance ?? 0) * 100));
  const faltan = Math.max(0, e.puntoEquilibrio - ventas.total);
  const ventasFaltantes = e.ventasNecesarias ? Math.max(0, e.ventasNecesarias - ventas.cobradas) : null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Punto de equilibrio</h2>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          Para cubrir tus costos fijos de <strong>{formatearSoles(e.costosFijos)}</strong> necesitas vender{' '}
          <strong>{formatearSoles(e.puntoEquilibrio)}</strong> al mes
          {e.ventasNecesarias && (
            <>
              {' '}
              (unas <strong>{e.ventasNecesarias}</strong> ventas con tu ticket promedio de {formatearSoles(e.ticketPromedio)})
            </>
          )}
          .
        </p>

        <div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${e.alcanzado ? 'bg-green-500' : 'bg-pink-500'}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Llevas {formatearSoles(ventas.total)}</span>
            <span>{porcentaje}%</span>
          </div>
        </div>

        {e.alcanzado ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Ya superaste el punto de equilibrio: desde aquí cada venta suma a tu utilidad.
          </p>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Te faltan {formatearSoles(faltan)}
            {ventasFaltantes !== null && ` (unas ${ventasFaltantes} ventas más)`} para cubrir tus costos fijos.
          </p>
        )}

        <p className="text-xs text-gray-500">
          Por cada S/ 1 vendido te quedan S/ {(e.ratioMargen ?? 0).toFixed(2)} después de costos de productos, empaque y
          gastos variables.
        </p>
      </div>
    </section>
  );
}