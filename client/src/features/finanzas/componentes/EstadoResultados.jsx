import { formatearSoles } from '@/lib/formato';

function Fila({ etiqueta, valor, resta = false, subtotal = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        subtotal ? 'bg-gray-50 font-semibold text-gray-800' : 'text-gray-600'
      }`}
    >
      <span>
        {resta && <span className="mr-1 text-gray-400">−</span>}
        {etiqueta}
      </span>
      <span>{formatearSoles(valor)}</span>
    </div>
  );
}

export default function EstadoResultados({ resumen }) {
  const r = resumen;
  const positiva = r.utilidadNeta >= 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Estado de resultados</h2>

      <div className={`rounded-xl p-5 text-white ${positiva ? 'bg-green-600' : 'bg-red-600'}`}>
        <p className="text-sm opacity-80">Utilidad neta del mes</p>
        <p className="mt-1 text-3xl font-bold">{formatearSoles(r.utilidadNeta)}</p>
        <p className="mt-1 text-xs opacity-80">
          {r.ventas.cantidad} {r.ventas.cantidad === 1 ? 'venta' : 'ventas'} · {formatearSoles(r.ventas.total)} cobrados
        </p>
      </div>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Fila etiqueta="Ventas cobradas" valor={r.ventas.total} subtotal />
        <Fila etiqueta="Costo de productos entregados" valor={r.costoProductos} resta />
        <Fila etiqueta="Empaque de pedidos" valor={r.costoEmpaque} resta />
        <Fila etiqueta="Utilidad bruta" valor={r.utilidadBruta} subtotal />
        <Fila etiqueta="Gastos variables" valor={r.gastos.variable} resta />
        <Fila etiqueta="Margen de contribución" valor={r.margenContribucion} subtotal />
        <Fila etiqueta="Gastos fijos" valor={r.gastos.fijo} resta />
        <Fila etiqueta="Sueldos" valor={r.gastos.sueldo} resta />
        <Fila etiqueta="Otros gastos" valor={r.gastos.otro} resta />
        <Fila etiqueta="Utilidad neta" valor={r.utilidadNeta} subtotal />
      </div>

      <p className="text-xs text-gray-500">
        El costo de productos incluye los premios y regalos. Los retiros de socios no son gastos y no aparecen aquí.
      </p>
    </section>
  );
}