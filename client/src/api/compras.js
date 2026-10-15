import { api } from './cliente';
import { construirQuery } from './query';

export const comprasApi = {
  listar: (filtros) => api.get(`/compras${construirQuery(filtros)}`),
  obtener: (id) => api.get(`/compras/${id}`),
  registrar: (datos) => api.post('/compras', datos),
  anular: (id, motivo) => api.post(`/compras/${id}/anular`, { motivo }),
};