// src/pages/auth/LoginPage.jsx
// Two-column institutional login screen — brand panel on the left,
// form on the right. Redirects to the correct workspace by role on success.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation before hitting the API
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      // ── ROUTE BY ROLE ──────────────────────────────────────────────────
      // CONFIRMED: Backend roles are: STUDENT, HOME_ADMIN, HOST_COORD
      if (user.role === 'STUDENT') {
        navigate('/student');
      } else if (user.role === 'HOME_ADMIN') {
        navigate('/admin');
      } else if (user.role === 'HOST_COORD') {
        navigate('/coordinator');
      } else {
        // Fallback for unknown roles
        navigate('/');
      }
    } catch (err) {
      // Try to extract a meaningful error message from the backend
      const responseData = err?.response?.data;
      let errorMessage = 'Invalid email or password.';
      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.non_field_errors) {
        errorMessage = responseData.non_field_errors[0];
      } else if (responseData?.email) {
        errorMessage = responseData.email[0];
      } else if (responseData?.password) {
        errorMessage = responseData.password[0];
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">

      {/* Left brand panel — hidden on small screens */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-navy-800 p-12">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-navy-300" size={28} />
          <span className="text-white font-semibold text-lg tracking-tight">
            GlobalScholar
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            International Academic <br />Exchange Portal
          </h1>
          <p className="text-navy-300 text-sm leading-relaxed">
            Apply, track compliance, and manage credit transfers across
            institutions from a single secure portal.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { role: 'Student', desc: 'Apply, upload documents, track status' },
            { role: 'Home Admin', desc: 'Review applications, verify compliance' },
            { role: 'Host Coordinator', desc: 'Manage credit transfer logs' },
          ].map((item) => (
            <div key={item.role} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-navy-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-white text-xs font-medium">{item.role}</p>
                <p className="text-navy-400 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <GraduationCap className="text-navy-600" size={24} />
            <span className="font-semibold text-ink-900">GlobalScholar</span>
          </div>

          <h2 className="text-xl font-semibold text-ink-900 mb-1">
            Sign in to your account
          </h2>
          <p className="text-sm text-ink-500 mb-7">
            Enter your institutional email and password
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-crimson-50 border border-crimson-100 rounded text-sm text-crimson-700 mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@institution.edu"
                  className="w-full px-3 py-2 pl-9 bg-white border border-surface-300 rounded text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pl-9 bg-white border border-surface-300 rounded text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-sm font-medium rounded border border-transparent transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-xs text-ink-500 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-navy-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}