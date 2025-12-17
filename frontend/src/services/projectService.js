import api from './api';
import { cleanParams } from '../utils/apiHelpers';

const projectService = {
    /**
     * Get all projects
     */
    async getProjects(filters = {}) {
        const cleanedParams = cleanParams(filters);
        const response = await api.get('/projects', { params: cleanedParams });
        return response.data;
    },

    /**
     * Get a single project
     */
    async getProject(id) {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    /**
     * Create a new project
     */
    async createProject(data) {
        const response = await api.post('/projects', data);
        return response.data;
    },

    /**
     * Update a project
     */
    async updateProject(id, data) {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },

    /**
     * Delete a project
     */
    async deleteProject(id) {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },

    /**
     * Toggle project status
     */
    async toggleStatus(id) {
        const response = await api.post(`/projects/${id}/toggle-status`);
        return response.data;
    },

    /**
     * Update project progress
     */
    async updateProgress(id, progress) {
        const response = await api.post(`/projects/${id}/update-progress`, { progress });
        return response.data;
    },

    /**
     * Get project statistics
     */
    async getStatistics(id) {
        const response = await api.get(`/projects/${id}/statistics`);
        return response.data;
    },

    /**
     * Get all projects statistics
     */
    async getAllStatistics() {
        const response = await api.get('/projects/statistics');
        return response.data;
    },

    /**
     * Archive project
     */
    async archiveProject(id) {
        const response = await api.post(`/projects/${id}/archive`);
        return response.data;
    },

    /**
     * Duplicate project
     */
    async duplicateProject(id) {
        const response = await api.post(`/projects/${id}/duplicate`);
        return response.data;
    },
};

export default projectService;
