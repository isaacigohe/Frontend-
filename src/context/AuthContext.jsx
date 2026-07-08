// src/context/AuthContext.jsx
// Global authentication state — wraps the whole app so any component
// can read the logged-in user and their role via useAuth().

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, registerUser, TOKEN_KEYS } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user holds the decoded token payload: { id, email, role, full_name }
  const [user, setUser] = useState(null);
  // loading prevents flashing the login page while we check localStorage
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On first load, restore the session from localStorage if it exists
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
  // Decodes the JWT payload and extracts user info.
  // CONFIRMED: Your backend JWT includes: user_id, email, role, full_name
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
    // Auto-login after registration
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

// Custom hook so components write useAuth() instead of useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);