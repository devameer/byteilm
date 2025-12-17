import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import taskService from '../../services/taskService';

// Query keys
export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (params) => [...taskKeys.lists(), params],
  details: () => [...taskKeys.all, 'detail'],
  detail: (id) => [...taskKeys.details(), id],
};

/**
 * Hook to fetch all tasks
 */
export const useTasks = (params = {}) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => taskService.list(params),
  });
};

/**
 * Hook to fetch a single task
 */
export const useTask = (id) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.retrieve(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => taskService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to update a task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => taskService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to complete a task
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskService.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to reorder tasks
 */
export const useReorderTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tasks) => taskService.reorder(tasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};
