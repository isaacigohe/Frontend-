// src/App.jsx
// Root router — maps URLs to pages, locked by role through ProtectedRoute.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Standard relative layouts
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminReviewDesk from './components/dashboard/AdminReviewDesk';
import HostCoordinatorDashboard from './components/dashboard/HostCoordinatorDashboard';
import ExploreCatalog from './components/dashboard/ExploreCatalog';

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

          {/* Catch-all safely brings broken links or manual path mistakes back to the Explore page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}