import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import courseService from '../../services/courseService';

// Query keys
export const courseKeys = {
  all: ['courses'],
  lists: () => [...courseKeys.all, 'list'],
  list: (filters) => [...courseKeys.lists(), filters],
  details: () => [...courseKeys.all, 'detail'],
  detail: (id) => [...courseKeys.details(), id],
  lessons: (id) => [...courseKeys.detail(id), 'lessons'],
  statistics: (id) => [...courseKeys.detail(id), 'statistics'],
};

/**
 * Hook to fetch all courses
 */
export const useCourses = (filters = {}) => {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => courseService.getCourses(filters),
  });
};

/**
 * Hook to fetch a single course
 */
export const useCourse = (id) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch course lessons
 */
export const useCourseLessons = (id) => {
  return useQuery({
    queryKey: courseKeys.lessons(id),
    queryFn: () => courseService.getLessons(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch course statistics
 */
export const useCourseStatistics = (id) => {
  return useQuery({
    queryKey: courseKeys.statistics(id),
    queryFn: () => courseService.getStatistics(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a course
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => courseService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

/**
 * Hook to update a course
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => courseService.updateCourse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

/**
 * Hook to delete a course
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => courseService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

/**
 * Hook to toggle course active status
 */
export const useToggleCourseActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => courseService.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};
