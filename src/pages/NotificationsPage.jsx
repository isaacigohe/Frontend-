// src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/client';
import { 
  Bell, CheckCheck, X, Clock, ArrowLeft, 
  FileText, CheckCircle2, XCircle, AlertTriangle, 
  GraduationCap 
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data.results || response.data || []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
    } catch (error) {
      // Silently fail
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // ── Get notification icon based on type ──────────────────────────────────
  const getNotificationIcon = (type) => {
    if (!type) return <Bell className="h-5 w-5 text-navy-400" />;
    if (type.includes('APPROVED')) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (type.includes('REJECTED')) return <XCircle className="h-5 w-5 text-red-500" />;
    if (type.includes('ACTION_REQUIRED')) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (type.includes('DOCUMENT')) return <FileText className="h-5 w-5 text-blue-500" />;
    return <Bell className="h-5 w-5 text-navy-400" />;
  };

  // ── Get dashboard route based on role ─────────────────────────────────────
  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'STUDENT') return '/student';
    if (user.role === 'HOME_ADMIN') return '/admin';
    if (user.role === 'HOST_COORD') return '/coordinator';
    if (user.role === 'SUPER_ADMIN') return '/super-admin';
    return '/';
  };

  // ── Handle back button ────────────────────────────────────────────────────
  const handleBack = () => {
    navigate(getDashboardRoute());
  };

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="text-navy-700 hover:text-gold-600 transition-colors"
              title="Go back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Bell className="h-6 w-6 text-navy-700" />
            <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
            <span className="text-sm text-slate-400">({notifications.length})</span>
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 rounded-none hover:border-slate-400 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="border border-slate-200 bg-white shadow-sm rounded-none">
          {isLoading ? (
            <div className="flex items-center justify-center p-10 text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Bell className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No notifications</p>
              <p className="text-xs text-slate-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition-colors p-1"
                          title="Dismiss notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatTime(notification.created_at)}
                        </span>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="text-xs font-medium text-navy-700 hover:text-gold-600 transition-colors"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}