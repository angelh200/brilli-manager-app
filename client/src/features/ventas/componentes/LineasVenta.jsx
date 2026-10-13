import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LineasVenta({ lineas, onCambiar, onQuitar }) {
  if (lineas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
        Aún no agregaste productos.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {lineas.map(({ producto, cantidad }) => {
        const excede = cantidad > producto.stockActual;
        return (
          <li key={producto.id} className="flex items-center gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-800">{producto.nombre}</p>
              <p className={`text-xs ${excede ? 'text-red-600' : 'text-gray-500'}`}>
                {excede ? `Solo hay ${producto.stockActual} en stock` : `Stock disponible: ${producto.stockActual}`}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10"
                disabled={cantidad <= 1}
                onClick={() => onCambiar(producto.id, cantidad - 1)}
                aria-label="Restar una unidad"
              >
                <Minus size={16} />
              </Button>
              <Input
                inputMode="numeric"
                value={cantidad}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  onCambiar(producto.id, Number.isNaN(n) ? 1 : n);
                }}
                className="h-10 w-14 text-center"
                aria-label="Cantidad"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10"
                disabled={cantidad >= producto.stockActual}
                onClick={() => onCambiar(producto.id, cantidad + 1)}
                aria-label="Sumar una unidad"
              >
                <Plus size={16} />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 text-gray-400 hover:text-red-600"
              onClick={() => onQuitar(producto.id)}
              aria-label="Quitar producto"
            >
              <Trash2 size={16} />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}