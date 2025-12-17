import api from './api';

const courseService = {
    /**
     * Get all courses
     */
    async getCourses(filters = {}) {
        const response = await api.get('/courses', { params: filters });
        return response.data;
    },

    /**
     * Get a single course
     */
    async getCourse(id) {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },

    /**
     * Create a new course
     */
    async createCourse(data) {
        const config = data instanceof FormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : undefined;
        const response = await api.post('/courses', data, config);
        return response.data;
    },

    /**
     * Update a course
     */
    async updateCourse(id, data) {
        let payload = data;
        let config;

        if (data instanceof FormData) {
            payload = data;
            payload.append('_method', 'PUT');
            config = { headers: { 'Content-Type': 'multipart/form-data' } };
        } else {
            payload = { ...data, _method: 'PUT' };
        }

        const response = await api.post(`/courses/${id}`, payload, config);
        return response.data;
    },

    /**
     * Delete a course
     */
    async deleteCourse(id) {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },

    /**
     * Toggle course active status
     */
    async toggleActive(id) {
        const response = await api.post(`/courses/${id}/toggle-active`);
        return response.data;
    },

    /**
     * Get course lessons
     */
    async getLessons(id) {
        const response = await api.get(`/courses/${id}/lessons`);
        return response.data;
    },

    /**
     * Get course statistics
     */
    async getStatistics(id) {
        const response = await api.get(`/courses/${id}/statistics`);
        return response.data;
    },

    /**
     * Apply numbering to lessons
     */
    async numberLessons(id, type) {
        const response = await api.post(`/courses/${id}/lessons/number`, {
            type,
        });
        return response.data;
    },
};

export default courseService;
