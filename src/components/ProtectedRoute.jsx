// src/components/ProtectedRoute.jsx
// Route guard — sends unauthenticated users to login, and optionally
// restricts a route to specific roles only.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Wait for the localStorage check to finish before deciding anything
  if (loading) return null;

  // No active session — send to login
  if (!user) return <Navigate to="/login" replace />;

  // Role restriction — e.g. allowedRoles={['HOME_ADMIN']}
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}