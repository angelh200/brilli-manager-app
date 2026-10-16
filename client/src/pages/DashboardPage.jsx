import { useAuth } from '@/context/AuthContext';
import { formatearDia } from '@/lib/formato';
import { useDashboard } from '@/features/dashboard/hooks';
import Alertas from '@/features/dashboard/componentes/Alertas';
import EstadoPedidos from '@/features/dashboard/componentes/EstadoPedidos';
import GraficoVentas from '@/features/dashboard/componentes/GraficoVentas';
import ResumenCaja from '@/features/dashboard/componentes/ResumenCaja';
import ResumenMes from '@/features/dashboard/componentes/ResumenMes';
import VentasHoy from '@/features/dashboard/componentes/VentasHoy';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hola, {usuario.nombre}</h1>
        {data && <p className="text-sm capitalize text-gray-500">{formatearDia(data.hoy)}</p>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-xl bg-gray-200 md:col-span-2" />
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <VentasHoy serie={data.serie} />
          <Alertas datos={data} />
          <EstadoPedidos pedidos={data.pedidos} />
          <ResumenMes mes={data.mes} />
          <ResumenCaja caja={data.caja} />
          <GraficoVentas serie={data.serie} />
        </div>
      )}
    </div>
  );
}