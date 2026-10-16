import { Badge } from '@/components/ui/badge';
import { ESTILOS_TIPO_GASTO, ETIQUETAS_TIPO_GASTO } from '@/lib/finanzas';
import { formatearFechaCorta, formatearSoles } from '@/lib/formato';

export default function ListaGastos({ gastos, onSeleccionar }) {
  return (
    <ul className="space-y-2">
      {gastos.map((g) => (
        <li key={g.id}>
          <button
            type="button"
            onClick={() => onSeleccionar(g)}
            className={`flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-pink-300 ${
              g.anulado ? 'opacity-60' : ''
            }`}
          >
            <div className="w-12 shrink-0 text-sm font-medium text-gray-700">{formatearFechaCorta(g.fecha)}</div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-gray-800">{g.categoria.nombre}</p>
                <Badge variant="secondary" className={ESTILOS_TIPO_GASTO[g.tipo]}>
                  {ETIQUETAS_TIPO_GASTO[g.tipo]}
                </Badge>
              </div>
              <p className="truncate text-xs text-gray-500">
                {[g.empleado?.nombre, g.descripcion, g.cuenta.nombre].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {g.anulado && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                  Anulado
                </Badge>
              )}
              <span className={`font-semibold text-gray-800 ${g.anulado ? 'line-through' : ''}`}>
                {formatearSoles(g.monto)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}