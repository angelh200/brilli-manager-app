import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { formatearSoles, hoyLima } from '@/lib/formato';
import { useCompras, useProveedores } from '@/features/compras/hooks';
import CompraDetalleDialog from '@/features/compras/componentes/CompraDetalleDialog';
import ListaCompras from '@/features/compras/componentes/ListaCompras';
import ProveedoresDialog from '@/features/compras/componentes/ProveedoresDialog';

const LIMITE = 20;

export default function ComprasPage() {
  const hoy = hoyLima();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [proveedorId, setProveedorId] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);
  const [proveedoresAbierto, setProveedoresAbierto] = useState(false);

  const { data: proveedores = [] } = useProveedores('todos');
  const { data, isLoading, isError, error, refetch } = useCompras({
    desde: desde || undefined,
    hasta: hasta || undefined,
    proveedorId: proveedorId === 'todos' ? undefined : proveedorId,
    pagina,
    limite: LIMITE,
  });

  const hayFiltros = Boolean(desde || hasta || proveedorId !== 'todos');

  function limpiar() {
    setDesde('');
    setHasta('');
    setProveedorId('todos');
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 flex-1 md:flex-none" onClick={() => setProveedoresAbierto(true)}>
            <Store size={16} /> Proveedores
          </Button>
          <Button asChild className="h-11 flex-1 md:flex-none">
            <Link to="/compras/nueva">
              <Plus size={16} /> Nueva compra
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Compras</p>
          <p className="mt-1 text-xl font-bold text-gray-800 md:text-2xl">{data?.totales.cantidadCompras ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total comprado</p>
          <p className="mt-1 text-xl font-bold text-gray-800 md:text-2xl">
            {data ? formatearSoles(data.totales.totalComprado) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input
            id="desde"
            type="date"
            max={hoy}
            className="h-11"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input
            id="hasta"
            type="date"
            max={hoy}
            className="h-11"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <div className="col-span-2 space-y-1.5 md:col-span-1">
          <Label htmlFor="filtro-proveedor">Proveedor</Label>
          <Select
            value={proveedorId}
            onValueChange={(v) => {
              setProveedorId(v);
              setPagina(1);
            }}
          >
            <SelectTrigger id="filtro-proveedor" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {hayFiltros && (
        <button onClick={limpiar} className="text-sm text-gray-600 underline hover:text-pink-600">
          Limpiar filtros
        </button>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
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
      ) : data.compras.length === 0 ? (
        <EstadoVacio
          icono={PackagePlus}
          titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay compras'}
          descripcion={
            hayFiltros
              ? 'Ninguna compra coincide con los filtros.'
              : 'Registra tu primera compra para reponer el stock y calcular el costo promedio.'
          }
        >
          {!hayFiltros && (
            <Button asChild>
              <Link to="/compras/nueva">
                <Plus size={16} /> Nueva compra
              </Link>
            </Button>
          )}
        </EstadoVacio>
      ) : (
        <>
          <ListaCompras compras={data.compras} onSeleccionar={setSeleccionada} />
          <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
        </>
      )}

      {seleccionada && <CompraDetalleDialog compra={seleccionada} onCerrar={() => setSeleccionada(null)} />}
      <ProveedoresDialog abierto={proveedoresAbierto} onCerrar={() => setProveedoresAbierto(false)} />
    </div>
  );
}