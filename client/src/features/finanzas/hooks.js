import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { finanzasApi } from '@/api/finanzas';

export const useResumenFinanzas = (periodo) =>
  useQuery({
    queryKey: ['finanzas', 'resumen', periodo],
    queryFn: () => finanzasApi.resumen(periodo),
    placeholderData: keepPreviousData,
  });

export const useCategoriasGasto = () =>
  useQuery({
    queryKey: ['finanzas', 'categorias'],
    queryFn: async () => (await finanzasApi.categorias()).categorias,
  });

export const useGastos = (filtros) =>
  useQuery({
    queryKey: ['finanzas', 'gastos', filtros],
    queryFn: () => finanzasApi.gastos(filtros),
    placeholderData: keepPreviousData,
  });

// Un gasto cambia el resultado del mes y el saldo de la cuenta
function useMutacionFinanzas(funcion, mensaje) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: funcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['caja'] });
      toast.success(mensaje);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useCrearCategoriaGasto = () =>
  useMutacionFinanzas((datos) => finanzasApi.crearCategoria(datos), 'Categoría creada');

export const useActualizarCategoriaGasto = () =>
  useMutacionFinanzas(({ id, datos }) => finanzasApi.actualizarCategoria(id, datos), 'Categoría actualizada');

export const useRegistrarGasto = () =>
  useMutacionFinanzas((datos) => finanzasApi.registrarGasto(datos), 'Gasto registrado');

export const useAnularGasto = () =>
  useMutacionFinanzas(({ id, motivo }) => finanzasApi.anularGasto(id, motivo), 'Gasto anulado');