import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Query keys
export const integrationKeys = {
  all: ['integrations'],
  list: () => [...integrationKeys.all, 'list'],
  logs: (id) => [...integrationKeys.all, id, 'logs'],
  statistics: (id) => [...integrationKeys.all, id, 'statistics'],
};

// Integration API functions
const integrationApi = {
  getIntegrations: () => axios.get('/integrations').then(res => res.data),
  getAuthUrl: (provider) => axios.get(`/integrations/auth/${provider}`).then(res => res.data),
  disconnect: (id) => axios.delete(`/integrations/${id}`).then(res => res.data),
  test: (id) => axios.post(`/integrations/${id}/test`).then(res => res.data),
  sync: (id) => axios.post(`/integrations/${id}/sync`).then(res => res.data),
  updateSettings: (id, settings) => axios.put(`/integrations/${id}`, settings).then(res => res.data),
  getLogs: (id) => axios.get(`/integrations/${id}/logs`).then(res => res.data),
  getStatistics: (id) => axios.get(`/integrations/${id}/statistics`).then(res => res.data),
};

/**
 * Hook to fetch all integrations
 */
export const useIntegrations = () => {
  return useQuery({
    queryKey: integrationKeys.list(),
    queryFn: integrationApi.getIntegrations,
  });
};

/**
 * Hook to fetch integration logs
 */
export const useIntegrationLogs = (integrationId) => {
  return useQuery({
    queryKey: integrationKeys.logs(integrationId),
    queryFn: () => integrationApi.getLogs(integrationId),
    enabled: !!integrationId,
  });
};

/**
 * Hook to fetch integration statistics
 */
export const useIntegrationStatistics = (integrationId) => {
  return useQuery({
    queryKey: integrationKeys.statistics(integrationId),
    queryFn: () => integrationApi.getStatistics(integrationId),
    enabled: !!integrationId,
  });
};

/**
 * Hook to get auth URL for connecting
 */
export const useConnectIntegration = () => {
  return useMutation({
    mutationFn: (provider) => integrationApi.getAuthUrl(provider),
  });
};

/**
 * Hook to disconnect an integration
 */
export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => integrationApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
};

/**
 * Hook to test integration connection
 */
export const useTestIntegration = () => {
  return useMutation({
    mutationFn: (id) => integrationApi.test(id),
  });
};

/**
 * Hook to sync integration
 */
export const useSyncIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => integrationApi.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
};

/**
 * Hook to update integration settings
 */
export const useUpdateIntegrationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, settings }) => integrationApi.updateSettings(id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
};
