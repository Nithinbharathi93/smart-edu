// src/hooks/useAuth.js
import { useState } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post('/login', credentials);
      localStorage.setItem('token', data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};