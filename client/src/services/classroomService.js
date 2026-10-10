import api from './api';

export const classroomService = {
  async getAll(search = '') {
    const params = search ? { search } : {};
    const res = await api.get('/classrooms', { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/classrooms/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post('/classrooms', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/classrooms/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/classrooms/${id}`);
    return res.data;
  },
};
