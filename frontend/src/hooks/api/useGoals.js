import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Query keys
export const goalKeys = {
  all: ['goals'],
  lists: () => [...goalKeys.all, 'list'],
  list: (filters) => [...goalKeys.lists(), filters],
  details: () => [...goalKeys.all, 'detail'],
  detail: (id) => [...goalKeys.details(), id],
  statistics: () => [...goalKeys.all, 'statistics'],
  suggestions: () => [...goalKeys.all, 'suggestions'],
  leaderboard: () => [...goalKeys.all, 'leaderboard'],
};

// Goal API functions
const goalApi = {
  getGoals: (params) => axios.get('/goals', { params }).then(res => res.data),
  getStatistics: () => axios.get('/goals/statistics').then(res => res.data),
  getSuggestions: () => axios.get('/goals/suggestions').then(res => res.data),
  getLeaderboard: (limit = 5) => axios.get('/goals/leaderboard', { params: { limit } }).then(res => res.data),
  incrementProgress: (id, amount) => axios.post(`/goals/${id}/increment`, { amount }).then(res => res.data),
  complete: (id) => axios.post(`/goals/${id}/complete`).then(res => res.data),
};

/**
 * Hook to fetch goals
 */
export const useGoals = (filters = {}) => {
  return useQuery({
    queryKey: goalKeys.list(filters),
    queryFn: () => goalApi.getGoals(filters),
  });
};

/**
 * Hook to fetch goal statistics
 */
export const useGoalStatistics = () => {
  return useQuery({
    queryKey: goalKeys.statistics(),
    queryFn: () => goalApi.getStatistics(),
  });
};

/**
 * Hook to fetch goal suggestions
 */
export const useGoalSuggestions = () => {
  return useQuery({
    queryKey: goalKeys.suggestions(),
    queryFn: () => goalApi.getSuggestions(),
  });
};

/**
 * Hook to fetch leaderboard
 */
export const useGoalLeaderboard = (limit = 5) => {
  return useQuery({
    queryKey: goalKeys.leaderboard(),
    queryFn: () => goalApi.getLeaderboard(limit),
  });
};

/**
 * Hook to increment goal progress
 */
export const useIncrementGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }) => goalApi.incrementProgress(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.statistics() });
    },
  });
};

/**
 * Hook to complete a goal
 */
export const useCompleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => goalApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.statistics() });
    },
  });
};
