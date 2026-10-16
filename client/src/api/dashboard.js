import { api } from './cliente';

export const dashboardApi = {
  obtener: () => api.get('/dashboard'),
};