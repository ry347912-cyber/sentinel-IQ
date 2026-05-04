import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const logout = useCallback(async (silent = false) => {
    try {
      if (!silent && accessToken) await api.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      if (err.response?.data?.code === 'TOKEN_EXPIRED') {
        await refreshAccessToken();
      } else {
        await logout(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) { await logout(true); return; }
    try {
      const res = await api.post('/auth/refresh', { refreshToken });
      const newToken = res.data.data.accessToken;
      localStorage.setItem('accessToken', newToken);
      setAccessToken(newToken);
      await loadUser();
    } catch {
      await logout(true);
    }
  };

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
