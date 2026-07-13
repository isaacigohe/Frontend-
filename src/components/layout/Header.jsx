// =============================================================================
// src/components/layout/Header.jsx
// -----------------------------------------------------------------------------
// Shared header for every authenticated dashboard (Student, Admin, Host
// Coordinator). Includes notification bell with dropdown and unread count.
// =============================================================================

import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Bell, CheckCheck, Shield, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api/client';
import ProfileSettings from '../ProfileSettings';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // ── Notification State ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

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
      // Silently fail - notifications are non-critical
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
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      // Silently fail
    }
  };

  // ── Mark all notifications as read ─────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
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

  return (
    <header className="sticky top-0 z-30 border-b border-navy-800 bg-navy-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* ── Brand ───────────────────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2 text-white hover:text-gold-500 transition-colors">
          <GraduationCap className="h-6 w-6 text-gold-500" strokeWidth={2} />
          <span className="text-sm font-bold uppercase tracking-[0.15em]">GlobalScholar</span>
        </Link>

        {/* ── Right Section ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {user ? (
            // ── LOGGED IN ──────────────────────────────────────────────────────
            <>
              {/* User Role Badge with University for Host Coordinators */}
              <span className="hidden text-xs uppercase tracking-wide text-navy-200 sm:inline">
                {user.full_name || user.email}
                {user.role === 'HOST_COORD' && user.host_university_name && (
                  <> · <span className="text-gold-500">{user.host_university_name}</span></>
                )}
                <> · {user.role?.replace(/_/g, ' ')}</>
              </span>

              {/* Profile Button */}
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1.5 border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </button>

              {/* Notification Bell */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="relative flex items-center justify-center rounded-full p-1.5 text-navy-200 hover:text-white hover:bg-navy-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden rounded border border-navy-700 bg-navy-800 shadow-deep">
                    <div className="flex items-center justify-between border-b border-navy-700 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white">Notifications</span>
                      {notifications.some((n) => !n.is_read) && (
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
                    <div className="max-h-[340px] overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-navy-400">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-sm text-navy-400">
                          <Bell className="h-8 w-8 text-navy-600 mb-2" />
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`border-b border-navy-700/50 px-4 py-3 transition-colors ${
                              notification.is_read
                                ? 'hover:bg-navy-700/50'
                                : 'bg-navy-700/30 hover:bg-navy-700/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notification.is_read ? 'text-navy-300' : 'text-white'}`}>
                                  {notification.title}
                                </p>
                                <p className="mt-0.5 text-xs text-navy-400 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[10px] text-navy-500">
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
                          </div>
                        ))
                      )}
                    </div>
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

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </>
          ) : (
            // ── NOT LOGGED IN ──────────────────────────────────────────────────
            <>
              {/* Super Admin Login Link */}
              <Link
                to="/super-admin-login"
                className="flex items-center gap-1.5 border border-gold-500/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold-500 transition-colors hover:bg-gold-500/10"
              >
                <Shield className="h-3.5 w-3.5" />
                Super Admin
              </Link>

              {/* Regular Login */}
              <Link
                to="/login"
                className="border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:border-white hover:bg-white/10"
              >
                Sign In
              </Link>

              {/* Register */}
              <Link
                to="/register"
                className="bg-gold-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-900 transition-colors hover:bg-gold-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Slim decorative strip */}
      <div className="relative h-10 overflow-hidden bg-navy-950">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 opacity-80" />
      </div>

      {/* Profile Settings Modal */}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </header>
  );
}