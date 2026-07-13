// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Dashboard components
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminReviewDesk from './components/dashboard/AdminReviewDesk';
import HostCoordinatorDashboard from './components/dashboard/HostCoordinatorDashboard';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard'; // <-- ADD THIS
import ExploreCatalog from './components/dashboard/ExploreCatalog';
import UniversityDetail from './components/dashboard/UniversityDetail';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<ExploreCatalog />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/universities/:id" element={<UniversityDetail />} />

          {/* ── Student Route ────────────────────────────────────────────── */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Admin Route ──────────────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['HOME_ADMIN']}>
              <DashboardLayout>
                <AdminReviewDesk />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Host Coordinator Route ────────────────────────────────────── */}
          <Route path="/coordinator" element={
            <ProtectedRoute allowedRoles={['HOST_COORD']}>
              <DashboardLayout>
                <HostCoordinatorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── SUPER ADMIN Route ────────────────────────────────────────── */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <DashboardLayout>
                <SuperAdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Catch-all ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}