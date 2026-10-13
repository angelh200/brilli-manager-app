import { api } from './cliente';

function construirQuery(filtros) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(clave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

export const clientesApi = {
  listar: (filtros = {}) => api.get(`/clientes${construirQuery(filtros)}`),
  obtener: (id) => api.get(`/clientes/${id}`),
  crear: (datos) => api.post('/clientes', datos),
  actualizar: (id, datos) => api.put(`/clientes/${id}`, datos),
};