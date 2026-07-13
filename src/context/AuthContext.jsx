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
    const storedAccess = localStorage.getItem(TOKEN_KEYS.ACCESS);
    const storedRefresh = localStorage.getItem(TOKEN_KEYS.REFRESH);
    
    console.log('🔍 AuthProvider init:', {
      hasUser: !!storedUser,
      hasAccess: !!storedAccess,
      hasRefresh: !!storedRefresh
    });
    
    if (storedUser && storedAccess) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(TOKEN_KEYS.USER);
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
      }
    }
    setLoading(false);
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { access, refresh } = response.data;
    
    console.log('🔑 Tokens received:', { 
      hasAccess: !!access, 
      hasRefresh: !!refresh 
    });
    
    // Store tokens FIRST
    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    
    // Get user data from response
    const userData = response.data.user || response.data;
    const userInfo = {
      id: userData.id || userData.user_id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
    };
    
    console.log('👤 User info stored:', userInfo);
    
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
    console.log('👋 User logged out');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);