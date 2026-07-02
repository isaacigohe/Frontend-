// src/pages/UnauthorizedPage.jsx
// Shown when a logged-in user tries a route their role can't access.

import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Send the user back to their own correct workspace
  const goHome = () => {
    if (user?.role === 'STUDENT') navigate('/student');
    else if (user?.role === 'HOME_ADMIN') navigate('/admin');
    else if (user?.role === 'HOST_COORD') navigate('/coordinator');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <ShieldOff size={40} className="text-surface-300 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-ink-900 mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-ink-500 mb-6">
          Your account role does not have permission to view this workspace.
        </p>
        <button onClick={goHome} className="btn-primary">
          Return to my workspace
        </button>
      </div>
    </div>
  );
}