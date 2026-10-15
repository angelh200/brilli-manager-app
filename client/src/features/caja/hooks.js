import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cajaApi } from '@/api/caja';

export const useResumenCaja = () =>
  useQuery({ queryKey: ['caja', 'resumen'], queryFn: () => cajaApi.resumen() });

export const useMovimientos = (filtros) =>
  useQuery({
    queryKey: ['caja', 'movimientos', filtros],
    queryFn: () => cajaApi.movimientos(filtros),
    placeholderData: keepPreviousData,
  });

// Cada operación cambia saldos y movimientos; las cuentas también alimentan los selectores
function useMutacionCaja(funcion, mensaje) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: funcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas'] });
      toast.success(mensaje);
    },
    onError: (error) => toast.error(error.message),
  });
}

export const useCrearCuenta = () => useMutacionCaja((datos) => cajaApi.crearCuenta(datos), 'Cuenta creada');

export const useActualizarCuenta = () =>
  useMutacionCaja(({ id, datos }) => cajaApi.actualizarCuenta(id, datos), 'Cuenta actualizada');

export const useAjustarSaldo = () =>
  useMutacionCaja(({ id, datos }) => cajaApi.ajustarSaldo(id, datos), 'Saldo ajustado');

export const useRegistrarMovimiento = () =>
  useMutacionCaja((datos) => cajaApi.registrarMovimiento(datos), 'Movimiento registrado');

export const useAnularMovimiento = () =>
  useMutacionCaja(({ id, motivo }) => cajaApi.anularMovimiento(id, motivo), 'Movimiento anulado');