// src/components/NotificationPopup.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, X, Bell } from 'lucide-react';

export default function NotificationPopup({ notification, onClose }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification?.notification_type) {
      case 'APPLICATION_APPROVED':
        return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
      case 'APPLICATION_REJECTED':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'DOCUMENT_ACTION_REQUIRED':
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      default:
        return <Bell className="h-8 w-8 text-gold-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification?.notification_type) {
      case 'APPLICATION_APPROVED':
        return 'border-emerald-200 bg-emerald-50';
      case 'APPLICATION_REJECTED':
        return 'border-red-200 bg-red-50';
      case 'DOCUMENT_ACTION_REQUIRED':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-xl ${getBgColor()} p-6 animate-in duration-300`}>
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h2 className="text-center text-xl font-bold text-navy-900">
          {notification?.title || 'Notification'}
        </h2>

        {/* Message */}
        <p className="mt-2 text-center text-sm text-slate-600">
          {notification?.message}
        </p>

        {/* Link */}
        {notification?.link && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                navigate(notification.link);
                onClose();
              }}
              className="text-sm font-semibold text-navy-700 hover:text-gold-600"
            >
              View Details →
            </button>
          </div>
        )}

        {/* Status badge */}
        {notification?.notification_type === 'APPLICATION_APPROVED' && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-100/50 px-4 py-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              ✅ Application Approved!
            </span>
          </div>
        )}

        {notification?.notification_type === 'APPLICATION_REJECTED' && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-100/50 px-4 py-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
              ❌ Application Rejected
            </span>
          </div>
        )}

        {/* Auto-close timer indicator */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gold-500 transition-all duration-7000 ease-linear"
            style={{ width: '100%', animation: 'shrink 7s linear forwards' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-in {
          animation: popIn 0.3s ease-out;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}