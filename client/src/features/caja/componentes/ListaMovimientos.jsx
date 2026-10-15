import { Badge } from '@/components/ui/badge';
import { formatearFechaCorta, formatearHora, formatearSoles } from '@/lib/formato';
import { etiquetaMovimiento } from '@/lib/caja';

export default function ListaMovimientos({ movimientos, onSeleccionar }) {
  return (
    <ul className="space-y-2">
      {movimientos.map((m) => {
        const detalle =
          m.tipo === 'transferencia' ? `${m.cuenta.nombre} → ${m.cuentaDestino?.nombre ?? '?'}` : m.cuenta.nombre;
        const color = m.anulado ? 'text-gray-400' : m.signo > 0 ? 'text-green-600' : m.signo < 0 ? 'text-red-600' : 'text-gray-700';
        const signo = m.signo > 0 ? '+' : m.signo < 0 ? '−' : '';

        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(m)}
              className={`flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-pink-300 ${
                m.anulado ? 'opacity-60' : ''
              }`}
            >
              <div className="w-14 shrink-0 text-xs text-gray-500">
                <div className="font-medium text-gray-700">{formatearFechaCorta(m.fecha)}</div>
                <div>{formatearHora(m.fecha)}</div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{etiquetaMovimiento(m)}</p>
                <p className="truncate text-xs text-gray-500">{detalle}</p>
                {m.descripcion && <p className="truncate text-xs text-gray-400">{m.descripcion}</p>}
              </div>

              <div className="flex flex-col items-end gap-1">
                {m.anulado && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                    Anulado
                  </Badge>
                )}
                <span className={`font-semibold ${color} ${m.anulado ? 'line-through' : ''}`}>
                  {signo}
                  {formatearSoles(m.monto)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}