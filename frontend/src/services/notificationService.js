import api from './api';

const notificationService = {
  async getNotifications(page = 1) {
    const response = await api.get(`/notifications?page=${page}`);
    return response.data;
  },

  async getUnread() {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  async markAsRead(id) {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  async clearAll() {
    const response = await api.post('/notifications/clear');
    return response.data;
  }
};

export default notificationService;
