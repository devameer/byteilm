import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';

// Query keys
export const checkoutKeys = {
  gateways: () => ['checkout', 'gateways'],
  session: (sessionId) => ['checkout', 'session', sessionId],
};

/**
 * Fetch available payment gateways
 */
const getGateways = async () => {
  const response = await api.get('/checkout/gateways');
  return response.data.data;
};

/**
 * Create a checkout session
 */
const createCheckoutSession = async ({ planId, gateway }) => {
  const response = await api.post('/checkout/create-session', {
    plan_id: planId,
    gateway: gateway,
  });
  return response.data.data;
};

/**
 * Process a payment (for test gateway)
 */
const processPayment = async ({ planId, gateway, cardNumber, cardExpiry, cardCvc, sessionId }) => {
  const response = await api.post('/checkout/process', {
    plan_id: planId,
    gateway: gateway,
    card_number: cardNumber,
    card_expiry: cardExpiry,
    card_cvc: cardCvc,
    session_id: sessionId,
  });
  return response.data;
};

/**
 * Verify a checkout session
 */
const verifySession = async (sessionId) => {
  const response = await api.get(`/checkout/verify/${sessionId}`);
  return response.data.data;
};

/**
 * Hook to fetch available gateways
 */
export const usePaymentGateways = () => {
  return useQuery({
    queryKey: checkoutKeys.gateways(),
    queryFn: getGateways,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a checkout session
 */
export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: createCheckoutSession,
  });
};

/**
 * Hook to process a payment
 */
export const useProcessPayment = () => {
  return useMutation({
    mutationFn: processPayment,
  });
};

/**
 * Hook to verify a checkout session
 */
export const useVerifySession = (sessionId, enabled = false) => {
  return useQuery({
    queryKey: checkoutKeys.session(sessionId),
    queryFn: () => verifySession(sessionId),
    enabled: !!sessionId && enabled,
    refetchInterval: (data) => {
      // Keep polling if status is pending
      if (data?.status === 'pending') {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
};

export default {
  usePaymentGateways,
  useCreateCheckoutSession,
  useProcessPayment,
  useVerifySession,
};
