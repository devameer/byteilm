import api from './api';

const categoryService = {
    /**
     * Get all categories
     */
    async getCategories() {
        const response = await api.get('/categories');
        return response.data;
    },

    /**
     * Get a single category
     */
    async getCategory(id) {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    /**
     * Create a new category
     */
    async createCategory(data) {
        const config = data instanceof FormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : undefined;
        const response = await api.post('/categories', data, config);
        return response.data;
    },

    /**
     * Update a category
     */
    async updateCategory(id, data) {
        let payload = data;
        let config;

        if (data instanceof FormData) {
            payload = data;
            payload.append('_method', 'PUT');
            config = { headers: { 'Content-Type': 'multipart/form-data' } };
        } else {
            payload = { ...data, _method: 'PUT' };
        }

        const response = await api.post(`/categories/${id}`, payload, config);
        return response.data;
    },

    /**
     * Delete a category
     */
    async deleteCategory(id) {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

export default categoryService;
