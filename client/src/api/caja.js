import { api } from './cliente';
import { construirQuery } from './query';

export const cajaApi = {
  resumen: () => api.get('/caja/resumen'),
  crearCuenta: (datos) => api.post('/caja/cuentas', datos),
  actualizarCuenta: (id, datos) => api.put(`/caja/cuentas/${id}`, datos),
  ajustarSaldo: (id, datos) => api.post(`/caja/cuentas/${id}/ajuste-saldo`, datos),
  movimientos: (filtros) => api.get(`/caja/movimientos${construirQuery(filtros)}`),
  registrarMovimiento: (datos) => api.post('/caja/movimientos', datos),
  anularMovimiento: (id, motivo) => api.post(`/caja/movimientos/${id}/anular`, { motivo }),
};