import { api } from './cliente';
import { construirQuery } from './query';

export const proveedoresApi = {
  listar: (filtros) => api.get(`/proveedores${construirQuery(filtros)}`),
  crear: (datos) => api.post('/proveedores', datos),
  actualizar: (id, datos) => api.put(`/proveedores/${id}`, datos),
};