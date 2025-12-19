import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

// Query keys
export const planKeys = {
  all: ['plans'],
  lists: () => [...planKeys.all, 'list'],
  detail: (id) => [...planKeys.all, 'detail', id],
  compare: () => [...planKeys.all, 'compare'],
};

/**
 * Fetch all active plans
 */
const getPlans = async () => {
  const response = await api.get('/plans');
  return response.data.data;
};

/**
 * Fetch a single plan by ID
 */
const getPlan = async (id) => {
  const response = await api.get(`/plans/${id}`);
  return response.data.data;
};

/**
 * Fetch plans comparison data
 */
const comparePlans = async () => {
  const response = await api.get('/plans/compare/all');
  return response.data.data;
};

/**
 * Hook to fetch all plans
 */
export const usePlans = () => {
  return useQuery({
    queryKey: planKeys.lists(),
    queryFn: getPlans,
    staleTime: 5 * 60 * 1000, // Plans don't change often, cache for 5 minutes
  });
};

/**
 * Hook to fetch a single plan
 */
export const usePlan = (id) => {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => getPlan(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch plans comparison
 */
export const usePlansComparison = () => {
  return useQuery({
    queryKey: planKeys.compare(),
    queryFn: comparePlans,
    staleTime: 5 * 60 * 1000,
  });
};

export default {
  usePlans,
  usePlan,
  usePlansComparison,
};
