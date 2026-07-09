// =============================================================================
// src/components/layout/Footer.jsx
// -----------------------------------------------------------------------------
// Professional institutional footer with links and branding.
// Shared across all authenticated dashboards.
// =============================================================================

import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gold-500" />
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-navy-900">GlobalScholar</span>
            </div>
            <p className="mt-2 max-w-xs text-xs text-slate-500">
              International Academic Exchange Network — connecting students to global opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Quick Links</h4>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link to="/" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Browse Universities
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Support</h4>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="#" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-500 hover:text-navy-700 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-center text-xs text-slate-400">
              © {new Date().getFullYear()} GlobalScholar — International Academic Exchange Network
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}