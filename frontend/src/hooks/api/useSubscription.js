import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// Query keys
export const subscriptionKeys = {
  all: ['subscription'],
  current: () => [...subscriptionKeys.all, 'current'],
  history: () => [...subscriptionKeys.all, 'history'],
  payments: () => [...subscriptionKeys.all, 'payments'],
};

/**
 * Fetch current user subscription
 */
const getCurrentSubscription = async () => {
  const response = await api.get('/user/subscription');
  return response.data.data;
};

/**
 * Fetch subscription history
 */
const getSubscriptionHistory = async () => {
  const response = await api.get('/user/subscription/history');
  return response.data.data;
};

/**
 * Fetch payment history
 */
const getPaymentHistory = async () => {
  const response = await api.get('/user/payments');
  return response.data.data;
};

/**
 * Cancel subscription
 */
const cancelSubscription = async () => {
  const response = await api.post('/user/subscription/cancel');
  return response.data;
};

/**
 * Resume subscription
 */
const resumeSubscription = async () => {
  const response = await api.post('/user/subscription/resume');
  return response.data;
};

/**
 * Hook to fetch current subscription
 */
export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: getCurrentSubscription,
    staleTime: 60 * 1000, // Cache for 1 minute
  });
};

/**
 * Hook to fetch subscription history
 */
export const useSubscriptionHistory = () => {
  return useQuery({
    queryKey: subscriptionKeys.history(),
    queryFn: getSubscriptionHistory,
  });
};

/**
 * Hook to fetch payment history
 */
export const usePaymentHistory = () => {
  return useQuery({
    queryKey: subscriptionKeys.payments(),
    queryFn: getPaymentHistory,
  });
};

/**
 * Hook to cancel subscription
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
};

/**
 * Hook to resume subscription
 */
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
};

export default {
  useCurrentSubscription,
  useSubscriptionHistory,
  usePaymentHistory,
  useCancelSubscription,
  useResumeSubscription,
};
