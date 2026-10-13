import { api } from './cliente';
import { construirQuery } from './query';

export const ventasApi = {
  listar: (filtros) => api.get(`/ventas${construirQuery(filtros)}`),
  obtener: (id) => api.get(`/ventas/${id}`),
  registrar: (datos) => api.post('/ventas', datos),
  anular: (id, motivo) => api.post(`/ventas/${id}/anular`, { motivo }),
};