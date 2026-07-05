// =============================================================================
// src/components/layout/Header.jsx
// -----------------------------------------------------------------------------
// Shared header for every authenticated dashboard (Student, Admin, Host
// Coordinator). NOT used on the public ExploreCatalog page — that page has
// its own hero section serving the same "get back home" purpose for
// logged-out visitors.
//
// Two jobs:
//   1. Brand mark that links back to "/" (the public catalog) — lets a
//      logged-in user jump back to browse universities without logging out.
//   2. A universally accessible Log Out control that clears the session via
//      AuthContext and redirects home.
// =============================================================================

import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  // useAuth() gives us the current user (for the role badge) and the
  // logout() function that clears tokens from localStorage.
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Clears the session, then does a normal React Router navigation (not a
  // window.location.href hard reload) back to the public landing page.
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-navy-800 bg-navy-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand mark — graduation cap in the gold accent, per the
            "educational symbol" branding requirement. Links to "/" so a
            logged-in student/admin/coordinator can always get back to the
            public catalog to look up another program. */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <GraduationCap className="h-6 w-6 text-gold-500" strokeWidth={2} />
          <span className="text-sm font-bold uppercase tracking-[0.15em]">GlobalScholar</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden text-xs uppercase tracking-wide text-navy-200 sm:inline">
              {user.full_name || user.email} · {user.role?.replace(/_/g, ' ')}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Slim decorative strip — the "structural placeholder for beautiful
          international exchange imagery" the brief asked for. Swap the
          empty background for a real photograph URL later; the gradient
          wash keeps it subtle so it doesn't compete with the dashboard
          content directly below it. */}
      <div className="relative h-10 overflow-hidden bg-navy-950">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 opacity-80" />
      </div>
    </header>
  );
}