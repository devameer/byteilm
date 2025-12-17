import api from './api';

const teamService = {
    async getTeams() {
        const response = await api.get('/teams');
        return response.data;
    },

    async getTeam(id) {
        const response = await api.get(`/teams/${id}`);
        return response.data;
    },

    async createTeam(payload) {
        const response = await api.post('/teams', payload);
        return response.data;
    },

    async updateTeam(id, payload) {
        const response = await api.put(`/teams/${id}`, payload);
        return response.data;
    },

    async deleteTeam(id) {
        const response = await api.delete(`/teams/${id}`);
        return response.data;
    },

    async addMember(teamId, payload) {
        const response = await api.post(`/teams/${teamId}/members`, payload);
        return response.data;
    },

    async updateMember(teamId, memberId, payload) {
        const response = await api.patch(`/teams/${teamId}/members/${memberId}`, payload);
        return response.data;
    },

    async removeMember(teamId, memberId) {
        const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
        return response.data;
    },

    async getResourceOptions(teamId) {
        const response = await api.get(`/teams/${teamId}/resources/options`);
        return response.data;
    },

    async shareCourse(teamId, courseId) {
        const response = await api.post(`/teams/${teamId}/resources/courses`, {
            course_id: courseId,
        });
        return response.data;
    },

    async unshareCourse(teamId, courseId) {
        const response = await api.delete(`/teams/${teamId}/resources/courses/${courseId}`);
        return response.data;
    },

    async shareProject(teamId, projectId) {
        const response = await api.post(`/teams/${teamId}/resources/projects`, {
            project_id: projectId,
        });
        return response.data;
    },

    async unshareProject(teamId, projectId) {
        const response = await api.delete(`/teams/${teamId}/resources/projects/${projectId}`);
        return response.data;
    },

    // Invitations
    async getInvitations(teamId) {
        const response = await api.get(`/teams/${teamId}/invitations`);
        return response.data;
    },

    async createInvitation(teamId, payload) {
        const response = await api.post(`/teams/${teamId}/invitations`, payload);
        return response.data;
    },

    async revokeInvitation(teamId, invitationId) {
        const response = await api.delete(`/teams/${teamId}/invitations/${invitationId}`);
        return response.data;
    },

    async acceptInvitation(token) {
        const response = await api.post(`/teams/join/${token}`);
        return response.data;
    },

    // Activity Log
    async getActivityLog(teamId, params = {}) {
        const response = await api.get(`/teams/${teamId}/activity-log`, { params });
        return response.data;
    },

    // Tasks
    async getTeamTasks(teamId) {
        const response = await api.get(`/teams/${teamId}/tasks`);
        return response.data;
    },

    async shareTask(teamId, payload) {
        const response = await api.post(`/teams/${teamId}/tasks`, payload);
        return response.data;
    },

    async unshareTask(teamId, taskId) {
        const response = await api.delete(`/teams/${teamId}/tasks/${taskId}`);
        return response.data;
    },

    async assignTask(teamId, taskId, payload) {
        const response = await api.patch(`/teams/${teamId}/tasks/${taskId}/assign`, payload);
        return response.data;
    },

    // Analytics
    async getAnalytics(teamId, params = {}) {
        const response = await api.get(`/teams/${teamId}/analytics`, { params });
        return response.data;
    },
};

export default teamService;
