import { Badge } from '@/components/ui/badge';
import { formatearHora, formatearSoles } from '@/lib/formato';

export default function ListaVentas({ ventas, onSeleccionar }) {
  return (
    <ul className="space-y-2">
      {ventas.map((v) => {
        const sinCobro = v.montoPagado === 0;
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(v)}
              className={`flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-pink-300 ${
                v.anulada ? 'opacity-60' : ''
              }`}
            >
              <div className="w-12 shrink-0 text-sm text-gray-500">{formatearHora(v.fecha)}</div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{v.cliente.nombre}</p>
                <p className="truncate text-xs text-gray-500">
                  {v.cantidadProductos} {v.cantidadProductos === 1 ? 'producto' : 'productos'}
                  {v.pedido && ` · Pedido #${v.pedido.id}`}
                  {v.cuenta && ` · ${v.cuenta.nombre}`}
                </p>
                {v.notas && <p className="truncate text-xs text-gray-400">{v.notas}</p>}
              </div>

              <div className="flex flex-col items-end gap-1">
                {v.anulada ? (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                    Anulada
                  </Badge>
                ) : sinCobro ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    Sin cobro
                  </Badge>
                ) : null}
                <span className={`font-semibold text-gray-800 ${v.anulada ? 'line-through' : ''}`}>
                  {formatearSoles(v.montoPagado)}
                </span>
                {v.utilidad !== undefined && !v.anulada && (
                  <span className={`text-xs ${v.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Utilidad {formatearSoles(v.utilidad)}
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}