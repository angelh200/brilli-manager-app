import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientesApi } from '@/api/clientes';

export const useClientes = (filtros) =>
  useQuery({
    queryKey: ['clientes', 'lista', filtros],
    queryFn: () => clientesApi.listar(filtros),
    placeholderData: keepPreviousData,
  });

export const useCliente = (id) =>
  useQuery({
    queryKey: ['clientes', 'detalle', id],
    queryFn: async () => (await clientesApi.obtener(id)).cliente,
  });

function useMutacion(funcion, mensaje) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: funcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(mensaje);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useCrearCliente = () => useMutacion((datos) => clientesApi.crear(datos), 'Cliente creado');

export const useActualizarCliente = () =>
  useMutacion(({ id, datos }) => clientesApi.actualizar(id, datos), 'Cliente actualizado');