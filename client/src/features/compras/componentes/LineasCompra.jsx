import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { formatearCosto, formatearSoles } from '@/lib/formato';

export default function LineasCompra({ detalle, onCambiar, onQuitar }) {
  if (detalle.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
        Aún no agregaste productos.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {detalle.map((d) => {
        const p = d.producto;
        return (
          <li key={p.id} className="space-y-3 px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{p.nombre}</p>
                <p className="text-xs text-gray-500">
                  Stock actual {p.stockActual} · Costo promedio actual {formatearCosto(p.costoPromedio ?? 0)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-gray-400 hover:text-red-600"
                onClick={() => onQuitar(p.id)}
                aria-label="Quitar producto"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CampoFormulario etiqueta="Cantidad" htmlFor={`cantidad-${p.id}`}>
                <Input
                  id={`cantidad-${p.id}`}
                  inputMode="numeric"
                  className="h-11"
                  value={d.cantidad}
                  onChange={(e) => onCambiar(p.id, { cantidad: e.target.value })}
                />
              </CampoFormulario>
              <CampoFormulario etiqueta="Costo unitario (S/)" htmlFor={`costo-${p.id}`}>
                <Input
                  id={`costo-${p.id}`}
                  inputMode="decimal"
                  className="h-11"
                  placeholder={p.costoPromedio ? `Actual: ${p.costoPromedio}` : '0.00'}
                  value={d.costo}
                  onChange={(e) => onCambiar(p.id, { costo: e.target.value })}
                />
              </CampoFormulario>
            </div>

            {d.valida ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Subtotal {formatearSoles(d.subtotal)} · Costo final por unidad (con gastos){' '}
                <strong>{formatearCosto(d.costoFinal)}</strong> · El costo promedio pasará de{' '}
                {formatearCosto(p.costoPromedio ?? 0)} a <strong>{formatearCosto(d.nuevoCosto)}</strong> y el stock de{' '}
                {p.stockActual} a {d.nuevoStock}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Completa una cantidad entera y un costo mayor que 0.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}