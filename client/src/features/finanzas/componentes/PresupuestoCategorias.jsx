import { Badge } from '@/components/ui/badge';
import { ESTILOS_TIPO_GASTO, ETIQUETAS_TIPO_GASTO } from '@/lib/finanzas';
import { formatearSoles } from '@/lib/formato';

export default function PresupuestoCategorias({ categorias }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Gasto por categoría</h2>

      {categorias.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
          Aún no hay gastos este mes.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {categorias.map((c) => {
            const tienePresupuesto = c.presupuesto !== null && c.presupuesto > 0;
            const uso = tienePresupuesto ? c.real / c.presupuesto : 0;
            const excedido = tienePresupuesto && uso > 1;

            return (
              <li key={c.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-gray-800">{c.nombre}</span>
                    <Badge variant="secondary" className={ESTILOS_TIPO_GASTO[c.tipo]}>
                      {ETIQUETAS_TIPO_GASTO[c.tipo]}
                    </Badge>
                  </div>
                  <span className={`shrink-0 font-semibold ${excedido ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatearSoles(c.real)}
                  </span>
                </div>

                {tienePresupuesto ? (
                  <>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${excedido ? 'bg-red-500' : 'bg-pink-500'}`}
                        style={{ width: `${Math.min(100, Math.round(uso * 100))}%` }}
                      />
                    </div>
                    <p className={`text-xs ${excedido ? 'text-red-600' : 'text-gray-500'}`}>
                      {excedido
                        ? `Te pasaste ${formatearSoles(c.real - c.presupuesto)} del presupuesto de ${formatearSoles(c.presupuesto)}`
                        : `${Math.round(uso * 100)}% del presupuesto de ${formatearSoles(c.presupuesto)}`}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Sin presupuesto</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}