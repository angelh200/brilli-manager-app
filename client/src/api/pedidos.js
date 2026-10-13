import { api } from './cliente';
import { construirQuery } from './query';

export const pedidosApi = {
  listar: (filtros) => api.get(`/pedidos${construirQuery(filtros)}`),
  abierto: (clienteId) => api.get(`/pedidos/abierto?clienteId=${clienteId}`),
  obtener: (id) => api.get(`/pedidos/${id}`),
  actualizar: (id, datos) => api.patch(`/pedidos/${id}`, datos),
  cambiarEstado: (id, estado) => api.post(`/pedidos/${id}/estado`, { estado }),
};