import api from './api';

const lessonService = {
    /**
     * Get all lessons
     */
    async getLessons(filters = {}) {
        const response = await api.get('/lessons', { params: filters });
        return response.data;
    },

    /**
     * Get a single lesson
     */
    async getLesson(id) {
        const response = await api.get(`/lessons/${id}`);
        return response.data;
    },

    /**
     * Create a new lesson
     */
    async createLesson(data) {
        const response = await api.post('/lessons', data);
        return response.data;
    },

    /**
     * Update a lesson
     */
    async updateLesson(id, data) {
        const response = await api.put(`/lessons/${id}`, data);
        return response.data;
    },

    /**
     * Delete a lesson
     */
    async deleteLesson(id) {
        const response = await api.delete(`/lessons/${id}`);
        return response.data;
    },

    /**
     * Toggle lesson completion
     */
    async toggleCompletion(id) {
        const response = await api.post(`/lessons/${id}/toggle-completion`);
        return response.data;
    },
};

export default lessonService;
