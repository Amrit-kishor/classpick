import api from './api';

export const selectionService = {
  async getStatus(classroomId) {
    const res = await api.get(`/classrooms/${classroomId}/selection/status`);
    return res.data;
  },

  async drawStudent(classroomId, mode = 'random') {
    const res = await api.post(`/classrooms/${classroomId}/selection/draw`, { mode });
    return res.data;
  },

  async resetRound(classroomId) {
    const res = await api.post(`/classrooms/${classroomId}/selection/reset-round`);
    return res.data;
  },

  async getHistory(params = {}) {
    const res = await api.get('/selection/history', { params });
    return res.data;
  },

  async clearHistory(classroomId = '') {
    const params = classroomId ? { classroomId } : {};
    const res = await api.delete('/selection/history', { params });
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/stats/dashboard');
    return res.data;
  },
};
