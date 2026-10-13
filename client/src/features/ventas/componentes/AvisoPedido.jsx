import MontoSoles from '@/components/comunes/MontoSoles';
import { usePedidoAbierto } from '../hooks';

export default function AvisoPedido({ clienteId }) {
  const { data: pedido, isLoading } = usePedidoAbierto(clienteId);

  if (isLoading) return <div className="h-12 animate-pulse rounded-lg bg-gray-100" />;

  if (!pedido) {
    return (
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
        Este cliente no tiene un pedido abierto: se creará uno nuevo.
      </p>
    );
  }

  return (
    <p className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-800">
      Se agregará al <strong>pedido #{pedido.id}</strong> ({pedido.cantidadVentas}{' '}
      {pedido.cantidadVentas === 1 ? 'venta' : 'ventas'} · {pedido.cantidadProductos} productos ·{' '}
      <MontoSoles valor={pedido.totalPagado} /> cobrados).
    </p>
  );
}