import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import { useDebounce } from '@/hooks/useDebounce';
import { usePedidos } from '@/features/pedidos/hooks';
import TableroPedidos from '@/features/pedidos/componentes/TableroPedidos';
import TarjetaPedido from '@/features/pedidos/componentes/TarjetaPedido';

const VACIOS = {
  curso: 'No hay pedidos en curso. Se crean solos al registrar una venta.',
  recibido: 'Aún no hay pedidos recibidos.',
  cancelado: 'No hay pedidos cancelados.',
};

export default function PedidosPage() {
  const [vista, setVista] = useState('curso');
  const [buscarTexto, setBuscarTexto] = useState('');
  const buscar = useDebounce(buscarTexto.trim(), 300);

  const { data: pedidos, isLoading, isError, error, refetch } = usePedidos({
    estado: vista === 'curso' ? undefined : vista,
    buscar: buscar || undefined,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <Button asChild className="h-11">
          <Link to="/ventas/nueva">
            <Plus size={16} /> Nueva venta
          </Link>
        </Button>
      </div>

      <Tabs value={vista} onValueChange={setVista}>
        <TabsList className="grid w-full grid-cols-3 md:w-96">
          <TabsTrigger value="curso">En curso</TabsTrigger>
          <TabsTrigger value="recibido">Recibidos</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          value={buscarTexto}
          onChange={(e) => setBuscarTexto(e.target.value)}
          placeholder="Buscar por nombre o @usuario del cliente"
          className="h-11 pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : vista === 'curso' ? (
        pedidos.length === 0 && !buscar ? (
          <EstadoVacio icono={Truck} titulo="Sin pedidos en curso" descripcion={VACIOS.curso}>
            <Button asChild>
              <Link to="/ventas/nueva">
                <Plus size={16} /> Registrar venta
              </Link>
            </Button>
          </EstadoVacio>
        ) : (
          <TableroPedidos pedidos={pedidos} />
        )
      ) : pedidos.length === 0 ? (
        <EstadoVacio
          icono={Truck}
          titulo="Sin resultados"
          descripcion={buscar ? `Ningún pedido coincide con "${buscar}".` : VACIOS[vista]}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} />
          ))}
        </div>
      )}
    </div>
  );
}