import { Badge } from '@/components/ui/badge';
import { formatearFechaCorta, formatearHora, formatearSoles } from '@/lib/formato';

export default function ListaCompras({ compras, onSeleccionar }) {
  return (
    <ul className="space-y-2">
      {compras.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSeleccionar(c)}
            className={`flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-pink-300 ${
              c.anulada ? 'opacity-60' : ''
            }`}
          >
            <div className="w-14 shrink-0 text-xs text-gray-500">
              <div className="font-medium text-gray-700">{formatearFechaCorta(c.fecha)}</div>
              <div>{formatearHora(c.fecha)}</div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-800">{c.proveedor?.nombre ?? 'Sin proveedor'}</p>
              <p className="truncate text-xs text-gray-500">
                {c.cantidadProductos} {c.cantidadProductos === 1 ? 'unidad' : 'unidades'} · {c.items.length}{' '}
                {c.items.length === 1 ? 'producto' : 'productos'}
                {c.cuenta && ` · ${c.cuenta.nombre}`}
              </p>
              {c.notas && <p className="truncate text-xs text-gray-400">{c.notas}</p>}
            </div>

            <div className="flex flex-col items-end gap-1">
              {c.anulada && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                  Anulada
                </Badge>
              )}
              <span className={`font-semibold text-gray-800 ${c.anulada ? 'line-through' : ''}`}>
                {formatearSoles(c.total)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}