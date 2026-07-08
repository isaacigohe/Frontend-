// src/context/AuthContext.jsx
// Global authentication state.

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

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { access, refresh } = response.data;
    
    // CRITICAL FIX: Get user data from the response body, NOT from the token!
    // The token doesn't contain email/role, but the response does.
    const userData = response.data.user || response.data;

    // Build user info from the response data
    const userInfo = {
      id: userData.id || userData.user_id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
    };

    console.log('🔍 User data from login response:', userInfo);

    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userInfo));
    setUser(userInfo);
    return userInfo;
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