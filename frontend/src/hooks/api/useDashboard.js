import { useQuery } from '@tanstack/react-query';
import dashboardService from '../../services/dashboardService';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'],
  data: () => [...dashboardKeys.all, 'data'],
};

/**
 * Hook to fetch dashboard data
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: () => dashboardService.getDashboard(),
  });
};
