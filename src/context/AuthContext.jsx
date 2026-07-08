// src/context/AuthContext.jsx
// Global authentication state — wraps the whole app so any component
// can read the logged-in user and their role via useAuth().

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, registerUser, TOKEN_KEYS } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(TOKEN_KEYS.USER);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(TOKEN_KEYS.USER);
      }
    }
    setLoading(false);
  }, []);

  // ── DECODE JWT TOKEN ──────────────────────────────────────────────────
  const decodeToken = (accessToken) => {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return {
        id: payload.user_id || payload.sub,
        email: payload.email,
        role: payload.role,
        full_name: payload.full_name || payload.name || 'User',
      };
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { access, refresh } = response.data;
    const userData = decodeToken(access);
    
    if (!userData) {
      throw new Error('Invalid token received');
    }

    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // ── REGISTER ────────────────────────────────────────────────────────────
  const register = async (formData) => {
    await registerUser(formData);
    return await login(formData.email, formData.password);
  };

  // ── LOGOUT ─────────────────────────────────────────────────────────────
  const logout = async () => {
    const refresh = localStorage.getItem(TOKEN_KEYS.REFRESH);
    if (refresh) {
      try {
        await logoutUser(refresh);
      } catch (e) {
        // Ignore logout errors
      }
    }
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);