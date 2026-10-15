import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pedidosApi } from '@/api/pedidos';

export const usePedidos = (filtros) =>
  useQuery({
    queryKey: ['pedidos', 'lista', filtros],
    queryFn: async () => (await pedidosApi.listar(filtros)).pedidos,
    placeholderData: keepPreviousData,
  });

export const usePedido = (id) =>
  useQuery({
    queryKey: ['pedidos', 'detalle', id],
    queryFn: async () => (await pedidosApi.obtener(id)).pedido,
  });

// El estado del pedido también se muestra en las ventas, por eso se refrescan ambas
function useMutacionPedido(funcion, mensaje) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: funcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      toast.success(mensaje);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useActualizarPedido = () =>
  useMutacionPedido(({ id, datos }) => pedidosApi.actualizar(id, datos), 'Datos del pedido actualizados');

export const useCambiarEstadoPedido = () =>
  useMutacionPedido(({ id, estado }) => pedidosApi.cambiarEstado(id, estado), 'Estado del pedido actualizado');