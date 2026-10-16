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
};