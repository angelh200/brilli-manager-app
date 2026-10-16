import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';

// Se refresca al abrir la pantalla, al volver a la pestaña y cada minuto
export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.obtener(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });