import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../../services/projectService';

// Query keys
export const projectKeys = {
  all: ['projects'],
  lists: () => [...projectKeys.all, 'list'],
  list: (filters) => [...projectKeys.lists(), filters],
  details: () => [...projectKeys.all, 'detail'],
  detail: (id) => [...projectKeys.details(), id],
  statistics: (id) => [...projectKeys.detail(id), 'statistics'],
  allStatistics: () => [...projectKeys.all, 'statistics'],
};

/**
 * Hook to fetch all projects
 */
export const useProjects = (filters = {}) => {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectService.getProjects(filters),
  });
};

/**
 * Hook to fetch a single project
 */
export const useProject = (id) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch project statistics
 */
export const useProjectStatistics = (id) => {
  return useQuery({
    queryKey: projectKeys.statistics(id),
    queryFn: () => projectService.getStatistics(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch all projects statistics
 */
export const useAllProjectsStatistics = () => {
  return useQuery({
    queryKey: projectKeys.allStatistics(),
    queryFn: () => projectService.getAllStatistics(),
  });
};

/**
 * Hook to create a project
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

/**
 * Hook to update a project
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => projectService.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

/**
 * Hook to delete a project
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

/**
 * Hook to archive a project
 */
export const useArchiveProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => projectService.archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

/**
 * Hook to duplicate a project
 */
export const useDuplicateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => projectService.duplicateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};
