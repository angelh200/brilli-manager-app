import { api } from './cliente';

export const cuentasApi = {
  listar: () => api.get('/cuentas'),
};