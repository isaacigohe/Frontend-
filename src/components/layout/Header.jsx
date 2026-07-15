// =============================================================================
// src/components/layout/Header.jsx
// -----------------------------------------------------------------------------
// Clean header - no role name, no borders on buttons, no "Profile" text
// Better notifications display
// Logo always goes to landing page (/)
// =============================================================================

import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Bell, CheckCheck, Shield, User, BellDot, FileText, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/client';
import ProfileSettings from '../ProfileSettings';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Get notification icon based on type ──────────────────────────────────
  const getNotificationIcon = (type) => {
    if (!type) return <Bell className="h-4 w-4 text-navy-400" />;
    if (type.includes('APPROVED')) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (type.includes('REJECTED')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (type.includes('ACTION_REQUIRED')) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (type.includes('DOCUMENT')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <Bell className="h-4 w-4 text-navy-400" />;
  };

  // ── Fetch Notifications ─────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifResponse.data.results || notifResponse.data || []);
      setUnreadCount(countResponse.data.unread_count || 0);
    } catch (error) {
      // Silently fail
    }
  };

  // ── Fetch on mount and periodically ────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── Click outside to close dropdown ────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Mark a single notification as read ─────────────────────────────────────
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      // Silently fail
    }
  };

  // ── Mark all notifications as read ─────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      // Silently fail
    }
  };

  // ── Handle logout ──────────────────────────────────────────────────────────
  async function handleLogout() {
    await logout();
    navigate('/');
  }

  // ── Format notification time ──────────────────────────────────────────────
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // ── Get dashboard route based on role (for back button) ───────────────────
  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'STUDENT') return '/student';
    if (user.role === 'HOME_ADMIN') return '/admin';
    if (user.role === 'HOST_COORD') return '/coordinator';
    if (user.role === 'SUPER_ADMIN') return '/super-admin';
    return '/';
  };

  return (
    <header className="sticky top-0 z-30 bg-navy-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* ── Brand - ALWAYS goes to landing page ───────────────────────────── */}
        <Link to="/" className="flex items-center gap-2 text-white hover:text-gold-500 transition-colors">
          <GraduationCap className="h-6 w-6 text-gold-500" strokeWidth={2} />
          <span className="text-sm font-bold uppercase tracking-[0.15em]">GlobalScholar</span>
        </Link>

        {/* ── Right Section - Clean, no borders ────────────────────────────── */}
        <div className="flex items-center gap-3">
          {user ? (
            // ── LOGGED IN ──────────────────────────────────────────────────────
            <>
              {/* User name - no role */}
              <span className="hidden text-xs text-navy-200 sm:inline">
                {user.full_name || user.email}
              </span>

              {/* Profile Icon - no text, no border */}
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                title="Profile"
              >
                <User className="h-4 w-4" />
              </button>

              {/* ── Notification Bell ────────────────────────────────────────── */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                  aria-label="Notifications"
                >
                  {unreadCount > 0 ? (
                    <BellDot className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* ── Notification Dropdown ──────────────────────────────────── */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-hidden rounded border border-navy-700 bg-navy-800 shadow-deep">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between border-b border-navy-700 px-4 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[340px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-sm text-navy-400">
                          <Bell className="h-8 w-8 text-navy-600 mb-2" />
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`border-b border-navy-700/50 px-4 py-3 hover:bg-navy-700/50 transition-colors ${
                              !notification.is_read ? 'bg-navy-700/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="mt-0.5 shrink-0">
                                {getNotificationIcon(notification.notification_type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm font-medium ${!notification.is_read ? 'text-white' : 'text-navy-300'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.is_read && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="shrink-0 text-[10px] text-gold-500 hover:text-gold-400"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-navy-400 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="flex items-center gap-1 text-[10px] text-navy-500">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(notification.created_at)}
                                  </span>
                                  {notification.link && (
                                    <Link
                                      to={notification.link}
                                      className="text-[10px] text-gold-500 hover:text-gold-400"
                                      onClick={() => {
                                        if (!notification.is_read) {
                                          handleMarkAsRead(notification.id);
                                        }
                                        setIsDropdownOpen(false);
                                      }}
                                    >
                                      View
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="border-t border-navy-700 px-4 py-2 text-center">
                      <Link
                        to="/notifications"
                        className="text-xs text-navy-400 hover:text-white transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Logout Icon - no text, no border ────────────────────────── */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            // ── NOT LOGGED IN ──────────────────────────────────────────────────
            <>
              <Link
                to="/super-admin-login"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-500 hover:text-gold-400 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Super Admin
              </Link>
              <Link
                to="/login"
                className="text-xs font-semibold uppercase tracking-wide text-white hover:text-gold-500 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gold-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-900 transition-colors hover:bg-gold-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Slim decorative strip */}
      <div className="relative h-8 overflow-hidden bg-navy-950">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 opacity-80" />
      </div>

      {/* Profile Settings Modal */}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </header>
  );
}