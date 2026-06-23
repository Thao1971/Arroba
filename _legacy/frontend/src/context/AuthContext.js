import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Skip if OAuth callback in progress
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    try {
      // Primary: httpOnly cookie sent automatically via withCredentials
      // Fallback: JWT from localStorage (transitional, will be removed)
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch {
      setUser(null);
      // Clean up transitional localStorage token
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    // Transitional: store JWT for backward compatibility with interceptor
    // Primary auth is now via httpOnly session cookie set by backend
    if (access_token) localStorage.setItem('access_token', access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { access_token, user: newUser } = response.data;
    if (access_token) localStorage.setItem('access_token', access_token);
    setUser(newUser);
    return newUser;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const processGoogleSession = async (sessionId) => {
    const response = await authAPI.processGoogleSession(sessionId);
    // Google auth uses httpOnly cookie exclusively (no JWT in localStorage)
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* silent */ }
    finally {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const updateUser = (userData) => setUser(userData);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      return response.data;
    } catch { return null; }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, processGoogleSession, logout, updateUser, refreshUser, checkAuth, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
