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

export const useEmpleados = (activo = 'true') =>
  useQuery({
    queryKey: ['finanzas', 'empleados', activo],
    queryFn: async () => (await finanzasApi.empleados(activo)).empleados,
  });

export const useRecurrentes = (activo = 'true') =>
  useQuery({
    queryKey: ['finanzas', 'recurrentes', activo],
    queryFn: async () => (await finanzasApi.recurrentes(activo)).recurrentes,
  });

export const usePendientes = () =>
  useQuery({
    queryKey: ['finanzas', 'pendientes'],
    queryFn: async () => (await finanzasApi.pendientes()).pendientes,
  });

export const useCrearEmpleado = () =>
  useMutacionFinanzas((datos) => finanzasApi.crearEmpleado(datos), 'Empleado creado');

export const useActualizarEmpleado = () =>
  useMutacionFinanzas(({ id, datos }) => finanzasApi.actualizarEmpleado(id, datos), 'Empleado actualizado');

export const useCrearRecurrente = () =>
  useMutacionFinanzas((datos) => finanzasApi.crearRecurrente(datos), 'Pago recurrente creado');

export const useActualizarRecurrente = () =>
  useMutacionFinanzas(({ id, datos }) => finanzasApi.actualizarRecurrente(id, datos), 'Pago recurrente actualizado');

// Registra uno o varios pendientes; cada uno es independiente: si uno falla, los demás siguen
export function useRegistrarPendientes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      let registrados = 0;
      const errores = [];
      for (const item of items) {
        try {
          await finanzasApi.registrarPendiente({
            recurrenteId: item.recurrenteId,
            periodo: item.periodo,
            ...(item.monto ? { monto: item.monto } : {}),
          });
          registrados++;
        } catch (error) {
          errores.push(error.message);
        }
      }
      return { registrados, errores };
    },
    onSuccess: ({ registrados, errores }) => {
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['caja'] });
      if (registrados > 0) toast.success(registrados === 1 ? 'Pago registrado' : `${registrados} pagos registrados`);
      errores.forEach((mensaje) => toast.error(mensaje));
    },
  });
}