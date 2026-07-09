// =============================================================================
// src/components/layout/Footer.jsx
// -----------------------------------------------------------------------------
// Professional institutional footer with links and branding.
// Matches header color (navy).
// =============================================================================

import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-navy-800 bg-navy-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gold-500" />
              <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">GlobalScholar</span>
            </div>
            <p className="mt-2 max-w-xs text-xs text-navy-300">
              International Academic Exchange Network — connecting students to global opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-200">Quick Links</h4>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link to="/" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Browse Universities
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-200">Support</h4>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="#" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-navy-300 hover:text-gold-500 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 border-t border-navy-700 pt-4">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-center text-xs text-navy-400">
              © {new Date().getFullYear()} GlobalScholar — International Academic Exchange Network
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-navy-400 hover:text-gold-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-xs text-navy-400 hover:text-gold-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-xs text-navy-400 hover:text-gold-500 transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}