import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { etiquetaMes } from '@/lib/finanzas';
import { formatearSoles } from '@/lib/formato';

export default function PendientesLista({ pendientes, onRegistrar, onRegistrarTodos, registrando }) {
  if (pendientes.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-amber-900">
          <BellRing size={18} /> Pagos pendientes ({pendientes.length})
        </h2>
        {pendientes.length > 1 && (
          <Button size="sm" onClick={onRegistrarTodos} disabled={registrando}>
            Registrar todos
          </Button>
        )}
      </div>

      <ul className="divide-y divide-amber-100 rounded-lg bg-white">
        {pendientes.map((p) => (
          <li key={`${p.recurrenteId}-${p.periodo}`} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-800">{p.nombre}</p>
              <p className="truncate text-xs text-gray-500">
                {etiquetaMes(p.periodo)} · {p.vencido ? 'vencido el' : 'vence hoy,'} {p.fechaPrevista}
              </p>
            </div>
            <span className="shrink-0 font-semibold text-gray-800">{formatearSoles(p.monto)}</span>
            <Button size="sm" variant="outline" onClick={() => onRegistrar(p)} disabled={registrando}>
              Registrar
            </Button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-amber-800">
        "Registrar todos" usa el monto de cada pago. Para cambiar un monto, regístralo de a uno.
      </p>
    </section>
  );
}