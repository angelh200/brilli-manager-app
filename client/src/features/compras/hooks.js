import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { comprasApi } from '@/api/compras';
import { proveedoresApi } from '@/api/proveedores';

export const useCompras = (filtros) =>
  useQuery({
    queryKey: ['compras', 'lista', filtros],
    queryFn: () => comprasApi.listar(filtros),
    placeholderData: keepPreviousData,
  });

export const useProveedores = (activo = 'true') =>
  useQuery({
    queryKey: ['proveedores', activo],
    queryFn: async () => (await proveedoresApi.listar({ activo })).proveedores,
  });

// Una compra cambia el stock y el costo de los productos
const CLAVES_COMPRA = [['compras'], ['productos']];

export function useRegistrarCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => comprasApi.registrar(datos),
    onSuccess: () => CLAVES_COMPRA.forEach((queryKey) => queryClient.invalidateQueries({ queryKey })),
    onError: (error) => toast.error(error.message),
  });
}

export function useAnularCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) => comprasApi.anular(id, motivo),
    onSuccess: () => {
      CLAVES_COMPRA.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success('Compra anulada');
    },
    onError: (error) => toast.error(error.message),
  });
}

function useMutacionProveedor(funcion, mensaje) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: funcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      toast.success(mensaje);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useCrearProveedor = () =>
  useMutacionProveedor((datos) => proveedoresApi.crear(datos), 'Proveedor creado');

export const useActualizarProveedor = () =>
  useMutacionProveedor(({ id, datos }) => proveedoresApi.actualizar(id, datos), 'Proveedor actualizado');