import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [loading, setLoading] = useState(!!token);

  const persistTokens = useCallback((access, refresh) => {
    if (access) localStorage.setItem('access_token', access);
    else localStorage.removeItem('access_token');
    if (refresh) localStorage.setItem('refresh_token', refresh);
    else localStorage.removeItem('refresh_token');
    setToken(access || null);
    setRefreshToken(refresh || null);
  }, []);

  const logout = useCallback(async () => {
    try { if (refreshToken) await authApi.logout(refreshToken); } catch {}
    persistTokens(null, null);
    setUser(null);
    navigate('/login');
  }, [refreshToken, persistTokens, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      persistTokens(null, null);
      setUser(null);
      navigate('/login');
    });
  }, [navigate, persistTokens]);

  useEffect(() => {
    let cancelled = false;
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((d) => { if (!cancelled) setUser(d.user); })
      .catch(() => { if (!cancelled) { persistTokens(null, null); setUser(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, persistTokens]);

  const login = async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const register = (form) => authApi.register(form);
  const verify = async (payload) => {
    const data = await authApi.verify(payload);
    persistTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, verify, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
