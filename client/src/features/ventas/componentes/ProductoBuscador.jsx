import { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductos } from '@/features/inventario/hooks';

export default function ProductoBuscador({ onAgregar, cantidadesEnVenta }) {
  const [texto, setTexto] = useState('');
  const buscar = useDebounce(texto.trim(), 250);
  const { data: productos = [], isLoading } = useProductos({ buscar: buscar || undefined });

  const visibles = productos.slice(0, buscar ? 20 : 8);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar producto por nombre, marca o SKU"
          className="h-11 pl-10"
          autoComplete="off"
        />
      </div>

      {!buscar && <p className="text-xs text-gray-500">Escribe para buscar. Mientras tanto se muestran algunos productos.</p>}

      <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {visibles.map((p) => {
          const agotado = p.stockActual <= 0;
          const enVenta = cantidadesEnVenta.get(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={agotado}
                onClick={() => {
                  onAgregar(p);
                  setTexto('');
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-800">{p.nombre}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[p.categoria?.nombre, p.marca].filter(Boolean).join(' · ') || 'Sin categoría'}
                  </p>
                </div>
                {enVenta && <span className="text-sm font-semibold text-pink-600">×{enVenta}</span>}
                {agotado ? (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                    Agotado
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">Stock {p.stockActual}</span>
                )}
              </button>
            </li>
          );
        })}
        {visibles.length === 0 && (
          <li className="px-3 py-3 text-sm text-gray-500">
            {isLoading ? 'Cargando...' : 'No se encontraron productos.'}
          </li>
        )}
      </ul>
    </div>
  );
}