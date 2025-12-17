import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Query keys
export const aiKeys = {
  all: ['ai'],
  dashboard: () => [...aiKeys.all, 'dashboard'],
  conversations: () => [...aiKeys.all, 'conversations'],
  conversation: (id) => [...aiKeys.conversations(), id],
};

// AI API functions
const aiApi = {
  getDashboard: () => axios.get('/ai/dashboard').then(res => res.data),
  acceptRecommendation: (id) => axios.post(`/ai/recommendations/${id}/accept`).then(res => res.data),
  dismissRecommendation: (id) => axios.post(`/ai/recommendations/${id}/dismiss`).then(res => res.data),
  markInsightRead: (id) => axios.post(`/ai/insights/${id}/read`).then(res => res.data),
  generateInsights: () => axios.post('/ai/insights/generate').then(res => res.data),
  getConversations: () => axios.get('/ai/chat/conversations').then(res => res.data),
  getConversation: (id) => axios.get(`/ai/chat/conversations/${id}`).then(res => res.data),
  createConversation: (data) => axios.post('/ai/chat/conversations', data).then(res => res.data),
  sendMessage: (conversationId, message) => 
    axios.post(`/ai/chat/conversations/${conversationId}/messages`, { message }).then(res => res.data),
};

/**
 * Hook to fetch AI dashboard
 */
export const useAIDashboard = () => {
  return useQuery({
    queryKey: aiKeys.dashboard(),
    queryFn: () => aiApi.getDashboard(),
  });
};

/**
 * Hook to fetch AI conversations
 */
export const useAIConversations = () => {
  return useQuery({
    queryKey: aiKeys.conversations(),
    queryFn: () => aiApi.getConversations(),
  });
};

/**
 * Hook to fetch a single conversation
 */
export const useAIConversation = (id) => {
  return useQuery({
    queryKey: aiKeys.conversation(id),
    queryFn: () => aiApi.getConversation(id),
    enabled: !!id,
  });
};

/**
 * Hook to accept recommendation
 */
export const useAcceptRecommendation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => aiApi.acceptRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.dashboard() });
    },
  });
};

/**
 * Hook to dismiss recommendation
 */
export const useDismissRecommendation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => aiApi.dismissRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.dashboard() });
    },
  });
};

/**
 * Hook to mark insight as read
 */
export const useMarkInsightRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => aiApi.markInsightRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.dashboard() });
    },
  });
};

/**
 * Hook to generate insights
 */
export const useGenerateInsights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiApi.generateInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.dashboard() });
    },
  });
};

/**
 * Hook to create conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => aiApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
};

/**
 * Hook to send message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message }) => aiApi.sendMessage(conversationId, message),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversation(conversationId) });
    },
  });
};
