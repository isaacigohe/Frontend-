// src/pages/auth/SuperAdminLoginPage.jsx
// Super Admin login with side panel
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Loader2, Eye, EyeOff, Shield, GraduationCap } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      if (user.role !== 'SUPER_ADMIN') {
        setError('Access denied. This page is only for Super Administrators.');
        setIsLoading(false);
        return;
      }
      
      navigate('/super-admin');
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Hero ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 p-12">
        <div className="max-w-sm text-center text-white">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20">
            <Shield className="h-8 w-8 text-gold-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Super Admin Access</h2>
          <p className="mt-3 text-sm text-navy-300 leading-relaxed">
            Secure administrative portal for system oversight. 
            Verify and manage administrator accounts.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-0.5 w-10 rounded-full bg-gold-500" />
            <div className="h-0.5 w-16 rounded-full bg-navy-600" />
            <div className="h-0.5 w-10 rounded-full bg-navy-700" />
          </div>
          <p className="mt-4 text-xs text-navy-400 italic">
            "Authorized personnel only."
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ───────────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
                <Shield className="h-5 w-5 text-gold-500" />
              </div>
              <span className="text-lg font-bold text-navy-900">Super Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-900">Secure Access</h1>
            <p className="text-sm text-slate-500">Administrator verification required</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="superadmin@globalscholar.com"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-900 transition-all hover:bg-gold-600 hover:shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sign In as Super Admin'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm text-slate-500 hover:text-navy-700 transition-colors">
              ← Regular user login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}