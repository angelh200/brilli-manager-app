import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useClientes } from '@/features/clientes/hooks';
import ClienteFormDialog from '@/features/clientes/componentes/ClienteFormDialog';

export default function ClienteSelector({ cliente, onSeleccionar }) {
  const [texto, setTexto] = useState('');
  const [creando, setCreando] = useState(false);
  const buscar = useDebounce(texto.trim(), 250);
  const { data, isFetching } = useClientes({ buscar: buscar || undefined, limite: 6 });

  if (cliente) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-600">
          {cliente.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-800">{cliente.nombre}</p>
          <p className="truncate text-sm text-gray-500">
            {cliente.usuarioTiktok ? `@${cliente.usuarioTiktok}` : 'Sin usuario de TikTok'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onSeleccionar(null)}>
          Cambiar
        </Button>
      </div>
    );
  }

  const resultados = buscar ? (data?.clientes ?? []) : [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar cliente por nombre, @usuario o teléfono"
          className="h-11 pl-10"
          autoComplete="off"
        />
      </div>

      {buscar && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSeleccionar(c)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-pink-50"
              >
                <span className="font-medium text-gray-800">{c.nombre}</span>
                <span className="text-sm text-gray-500">{c.usuarioTiktok ? `@${c.usuarioTiktok}` : ''}</span>
              </button>
            </li>
          ))}
          {resultados.length === 0 && (
            <li className="px-3 py-3 text-sm text-gray-500">
              {isFetching ? 'Buscando...' : `Ningún cliente coincide con "${buscar}".`}
            </li>
          )}
        </ul>
      )}

      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setCreando(true)}>
        <UserPlus size={16} /> Crear cliente rápido
      </Button>

      <ClienteFormDialog
        abierto={creando}
        onCerrar={() => setCreando(false)}
        rapido
        onCreado={(nuevo) => onSeleccionar(nuevo)}
      />
    </div>
  );
}