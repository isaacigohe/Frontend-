// src/context/AuthContext.jsx
// Global authentication state — wraps the whole app so any component
// can read the logged-in user and their role via useAuth().

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, registerUser } from '../api/client';
import { TOKEN_KEYS } from '../api/client';

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
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Decode the JWT payload (the middle section between the two dots)
  // and pull out the fields our backend embeds: role, email, full_name
  const decodeToken = (accessToken) => {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return {
      id: payload.user_id,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
    };
  };

  // Called from LoginPage — authenticates and saves the session
  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { access, refresh } = response.data;
    const userData = decodeToken(access);

    localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  // Called from RegisterPage — registers the account then auto-logs in
  const register = async (formData) => {
    await registerUser(formData);
    return await login(formData.email, formData.password);
  };

  // Clears all stored tokens and ends the session
  const logout = async () => {
    const refresh = localStorage.getItem(TOKEN_KEYS.REFRESH);
    if (refresh) {
      // Blacklist the refresh token server-side; ignore failures here
      await logoutUser(refresh).catch(() => {});
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