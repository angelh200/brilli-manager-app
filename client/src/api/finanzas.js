import { api } from './cliente';
import { construirQuery } from './query';

export const finanzasApi = {
  resumen: (periodo) => api.get(`/finanzas/resumen${construirQuery({ periodo })}`),
  categorias: () => api.get('/finanzas/categorias'),
  crearCategoria: (datos) => api.post('/finanzas/categorias', datos),
  actualizarCategoria: (id, datos) => api.put(`/finanzas/categorias/${id}`, datos),
  gastos: (filtros) => api.get(`/finanzas/gastos${construirQuery(filtros)}`),
  registrarGasto: (datos) => api.post('/finanzas/gastos', datos),
  anularGasto: (id, motivo) => api.post(`/finanzas/gastos/${id}/anular`, { motivo }),

  empleados: (activo) => api.get(`/finanzas/empleados${construirQuery({ activo })}`),
  crearEmpleado: (datos) => api.post('/finanzas/empleados', datos),
  actualizarEmpleado: (id, datos) => api.put(`/finanzas/empleados/${id}`, datos),

  recurrentes: (activo) => api.get(`/finanzas/recurrentes${construirQuery({ activo })}`),
  crearRecurrente: (datos) => api.post('/finanzas/recurrentes', datos),
  actualizarRecurrente: (id, datos) => api.put(`/finanzas/recurrentes/${id}`, datos),
  pendientes: () => api.get('/finanzas/pendientes'),
  registrarPendiente: (datos) => api.post('/finanzas/pendientes/registrar', datos),
};