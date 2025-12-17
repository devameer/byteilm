import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import lessonService from '../../services/lessonService';

// Query keys
export const lessonKeys = {
  all: ['lessons'],
  lists: () => [...lessonKeys.all, 'list'],
  list: (filters) => [...lessonKeys.lists(), filters],
  details: () => [...lessonKeys.all, 'detail'],
  detail: (id) => [...lessonKeys.details(), id],
};

/**
 * Hook to fetch all lessons
 */
export const useLessons = (filters = {}) => {
  return useQuery({
    queryKey: lessonKeys.list(filters),
    queryFn: () => lessonService.getLessons(filters),
  });
};

/**
 * Hook to fetch a single lesson
 */
export const useLesson = (id) => {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => lessonService.getLesson(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a lesson
 */
export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => lessonService.createLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
};

/**
 * Hook to update a lesson
 */
export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => lessonService.updateLesson(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
};

/**
 * Hook to delete a lesson
 */
export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => lessonService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
};

/**
 * Hook to toggle lesson completion
 */
export const useToggleLessonCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => lessonService.toggleCompletion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
};
