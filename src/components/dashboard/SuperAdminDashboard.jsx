// src/components/dashboard/SuperAdminDashboard.jsx
// Super Admin Dashboard - Verify/Reject new admins

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { getUnverifiedAdmins, verifyAdmin, rejectAdmin } from '../../api/admin';
import { Badge, EmptyState, LoadingRow } from './shared/DashboardUI';

export default function SuperAdminDashboard() {
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch unverified users ──────────────────────────────────────────────
  const fetchUnverified = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUnverifiedAdmins();
      console.log('📊 Unverified users response:', response);
      
      // ── FIX: Extract the array from the response ──────────────────────
      // The response might be { data: [...] } or just [...]
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (Array.isArray(response)) {
        users = response;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with results or results array
        users = response.data.results || response.data.data || [];
      }
      
      console.log('📊 Extracted users:', users);
      setUnverifiedUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error('❌ Error fetching unverified admins:', err);
      setError('Could not load unverified admins. Please refresh and try again.');
      setUnverifiedUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchUnverified();
  }, [fetchUnverified]);

  // ── Handle Verify ───────────────────────────────────────────────────────
  const handleVerify = async (userId) => {
    setActionLoading(userId);
    try {
      await verifyAdmin(userId);
      await fetchUnverified();
    } catch (err) {
      console.error('❌ Verify error:', err);
      alert('Could not verify user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Handle Reject ───────────────────────────────────────────────────────
  const handleReject = async (userId) => {
    if (!confirm('Are you sure you want to reject and remove this user?')) return;
    setActionLoading(userId);
    try {
      await rejectAdmin(userId);
      await fetchUnverified();
    } catch (err) {
      console.error('❌ Reject error:', err);
      alert('Could not reject user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filter users by search ──────────────────────────────────────────────
  const filteredUsers = Array.isArray(unverifiedUsers) ? unverifiedUsers.filter((user) => {
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const searchLower = searchQuery.toLowerCase();
    return fullName.toLowerCase().includes(searchLower) ||
           (user.email || '').toLowerCase().includes(searchLower);
  }) : [];

  return (
    <div className="bg-slate-100 p-6 min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Super Admin Dashboard</h1>
            <p className="text-xs text-slate-500">Verify and manage new admin accounts</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users…"
              className="w-56 rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>
        </header>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">
              {Array.isArray(unverifiedUsers) ? unverifiedUsers.length : 0}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Verification</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">
              {Array.isArray(unverifiedUsers) ? unverifiedUsers.filter(u => u.role === 'HOME_ADMIN').length : 0}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home Admins Pending</p>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <LoadingRow label="Loading pending verifications…" />
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-600">
              <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-500" />
              {error}
              <button
                type="button"
                onClick={fetchUnverified}
                className="block mx-auto mt-2 text-navy-600 underline hover:text-navy-800"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState label="No pending admin verifications. All admins are verified!" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Requested</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{user.email}</td>
                      <td className="px-6 py-3">
                        <Badge tone="amber">{user.role?.replace(/_/g, ' ') || 'Unknown'}</Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerify(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(user.id)}
                          disabled={actionLoading === user.id}
                          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-red-600 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}