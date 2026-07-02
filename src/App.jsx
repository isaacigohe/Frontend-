// src/App.jsx
// Root router — maps URLs to pages, locked by role through ProtectedRoute.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
          {/* Public Landing Page is now mounted safely at the root route */}
          <Route path="/" element={<ExploreCatalog />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Student Dashboard Integrated from Phase 3 */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Review Split-Panel Desk Integrated from Phase 4 */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['HOME_ADMIN']}>
              <AdminReviewDesk />
            </ProtectedRoute>
          } />

          {/* Host Coordinator Workspace Integrated from Phase 4 */}
          <Route path="/coordinator" element={
            <ProtectedRoute allowedRoles={['HOST_COORD']}>
              <HostCoordinatorDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all safely brings broken links or manual path mistakes back to the Explore page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}