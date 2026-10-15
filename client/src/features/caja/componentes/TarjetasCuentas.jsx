import { Pencil, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatearSoles } from '@/lib/formato';

export default function TarjetasCuentas({ resumen, cargando, cuentaFiltro, onFiltrar, onAjustar, onEditar }) {
  if (cargando || !resumen) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-pink-500 p-5 text-white">
        <p className="text-sm text-pink-100">Saldo total</p>
        <p className="mt-1 text-3xl font-bold">{formatearSoles(resumen.saldoTotal)}</p>
        <p className="mt-1 text-xs text-pink-100">Suma de las cuentas activas</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resumen.cuentas.map((c) => {
          const seleccionada = cuentaFiltro === String(c.id);
          return (
            <div
              key={c.id}
              className={`rounded-xl border bg-white p-4 ${seleccionada ? 'border-pink-400' : 'border-gray-200'} ${
                c.activa ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => onFiltrar(c.id)} className="min-w-0 text-left">
                  <p className="truncate font-medium text-gray-800">{c.nombre}</p>
                  <p className={`text-2xl font-bold ${c.saldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatearSoles(c.saldo)}
                  </p>
                </button>
                {!c.activa && <Badge variant="outline">Inactiva</Badge>}
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" disabled={!c.activa} onClick={() => onAjustar(c)}>
                  <Scale size={14} /> Ajustar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEditar(c)}>
                  <Pencil size={14} /> Editar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">Toca una cuenta para ver solo sus movimientos.</p>
    </div>
  );
}