import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  register: async (email, password) => {
    return await api.post('/register', { email, password });
  },
  setupProfile: async (persona) => {
    return await api.post('/profile/setup', { persona });
  }
};