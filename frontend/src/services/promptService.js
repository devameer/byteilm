import api from './api';

const promptService = {
    /**
     * Get all prompts for the authenticated user
     */
    async getPrompts() {
        const response = await api.get('/prompts');
        return response.data;
    },

    /**
     * Get a single prompt
     */
    async getPrompt(id) {
        const response = await api.get(`/prompts/${id}`);
        return response.data;
    },

    /**
     * Create a new prompt
     */
    async createPrompt(data) {
        const response = await api.post('/prompts', data);
        return response.data;
    },

    /**
     * Update an existing prompt
     */
    async updatePrompt(id, data) {
        const response = await api.put(`/prompts/${id}`, data);
        return response.data;
    },

    /**
     * Delete a prompt
     */
    async deletePrompt(id) {
        const response = await api.delete(`/prompts/${id}`);
        return response.data;
    },
};

export default promptService;
