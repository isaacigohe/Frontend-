// src/App.jsx
// Root router — maps URLs to pages, locked by role through ProtectedRoute.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Standard relative layouts
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminReviewDesk from './components/dashboard/AdminReviewDesk';
import HostCoordinatorDashboard from './components/dashboard/HostCoordinatorDashboard';
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
          {/* Public Landing Page — no Header/Footer shell, it has its own hero nav */}
          <Route path="/" element={<ExploreCatalog />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Student Dashboard — wrapped in the shared Header/Footer shell */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Review Split-Panel Desk — same shared shell */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['HOME_ADMIN']}>
              <DashboardLayout>
                <AdminReviewDesk />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Host Coordinator Workspace — same shared shell */}
          <Route path="/coordinator" element={
            <ProtectedRoute allowedRoles={['HOST_COORD']}>
              <DashboardLayout>
                <HostCoordinatorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* University Detail Page — PUBLIC */}
          <Route path="/universities/:id" element={<UniversityDetail />} />

          {/* Catch-all safely brings broken links or manual path mistakes back to the Explore page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
        // Add to Routes:
<Route path="/super-admin" element={
  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
    <DashboardLayout>
      <SuperAdminDashboard />
    </DashboardLayout>
  </ProtectedRoute>
} />
}