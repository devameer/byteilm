import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Query keys
export const reportKeys = {
  all: ['reports'],
  types: () => [...reportKeys.all, 'types'],
  productivity: (params) => [...reportKeys.all, 'productivity', params],
};

// Report API functions
const reportApi = {
  getReportTypes: () => axios.get('/reports/types').then(res => res.data),
  getProductivityReport: (params) => axios.get('/reports/productivity', { params }).then(res => res.data),
};

/**
 * Hook to fetch report types (preset periods)
 */
export const useReportTypes = () => {
  return useQuery({
    queryKey: reportKeys.types(),
    queryFn: reportApi.getReportTypes,
  });
};

/**
 * Hook to fetch productivity report
 */
export const useProductivityReport = (startDate, endDate) => {
  return useQuery({
    queryKey: reportKeys.productivity({ startDate, endDate }),
    queryFn: () => reportApi.getProductivityReport({ start_date: startDate, end_date: endDate }),
    enabled: !!startDate && !!endDate,
  });
};
