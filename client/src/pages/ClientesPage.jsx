import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useClientes } from '@/features/clientes/hooks';
import ClienteFormDialog from '@/features/clientes/componentes/ClienteFormDialog';
import ListaClientes from '@/features/clientes/componentes/ListaClientes';

const LIMITE = 20;

export default function ClientesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const [buscarTexto, setBuscarTexto] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [formAbierto, setFormAbierto] = useState(false);

  const buscar = useDebounce(buscarTexto.trim(), 300);

  const { data, isLoading, isError, error, refetch } = useClientes({
    buscar: buscar || undefined,
    activo: esAdmin && verInactivos ? 'todos' : undefined,
    pagina,
    limite: LIMITE,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          {data && (
            <p className="text-sm text-gray-500">
              {data.total} {data.total === 1 ? 'cliente' : 'clientes'}
            </p>
          )}
        </div>
        <Button className="h-11" onClick={() => setFormAbierto(true)}>
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={buscarTexto}
            onChange={(e) => {
              setBuscarTexto(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre, usuario de TikTok, teléfono o DNI"
            className="h-11 pl-10"
          />
        </div>

        {esAdmin && (
          <div className="flex items-center gap-2">
            <Switch
              id="ver-inactivos"
              checked={verInactivos}
              onCheckedChange={(v) => {
                setVerInactivos(v);
                setPagina(1);
              }}
            />
            <Label htmlFor="ver-inactivos">Ver inactivos</Label>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : data.clientes.length === 0 ? (
        buscar ? (
          <EstadoVacio icono={Users} titulo="Sin resultados" descripcion={`Ningún cliente coincide con "${buscar}".`}>
            <Button variant="outline" onClick={() => setBuscarTexto('')}>
              Limpiar búsqueda
            </Button>
          </EstadoVacio>
        ) : (
          <EstadoVacio icono={Users} titulo="Aún no hay clientes" descripcion="Crea tu primer cliente para empezar a registrar sus compras.">
            <Button onClick={() => setFormAbierto(true)}>
              <Plus size={16} /> Nuevo cliente
            </Button>
          </EstadoVacio>
        )
      ) : (
        <>
          <ListaClientes clientes={data.clientes} />
          <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
        </>
      )}

      <ClienteFormDialog abierto={formAbierto} onCerrar={() => setFormAbierto(false)} />
    </div>
  );
}