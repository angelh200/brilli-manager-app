import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ventasApi } from '@/api/ventas';
import { pedidosApi } from '@/api/pedidos';
import { cuentasApi } from '@/api/cuentas';

export const useVentas = (filtros) =>
  useQuery({
    queryKey: ['ventas', 'lista', filtros],
    queryFn: () => ventasApi.listar(filtros),
    placeholderData: keepPreviousData,
  });

export const useCuentas = () =>
  useQuery({
    queryKey: ['cuentas'],
    queryFn: async () => (await cuentasApi.listar()).cuentas,
    staleTime: 5 * 60 * 1000,
  });

// Pedido "acumulando" del cliente (o null si no tiene)
export const usePedidoAbierto = (clienteId) =>
  useQuery({
    queryKey: ['pedidos', 'abierto', clienteId],
    queryFn: async () => (await pedidosApi.abierto(clienteId)).pedido,
    enabled: Boolean(clienteId),
  });

// Una venta cambia el stock, los pedidos y el listado de ventas
const CLAVES_AFECTADAS = [['ventas'], ['productos'], ['pedidos']];

export function useRegistrarVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => ventasApi.registrar(datos),
    onSuccess: () => {
      CLAVES_AFECTADAS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useAnularVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) => ventasApi.anular(id, motivo),
    onSuccess: () => {
      CLAVES_AFECTADAS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success('Venta anulada');
    },
    onError: (error) => toast.error(error.message),
  });
}