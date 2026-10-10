import api from './api';

export const authService = {
  async register(userData) {
    const res = await api.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('classpick_token', res.data.token);
    }
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('classpick_token', res.data.token);
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('classpick_token');
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },
};
