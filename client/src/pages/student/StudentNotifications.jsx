import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Bell, CheckCheck, ExternalLink, Loader2, Info, AlertTriangle, CheckCircle, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/student/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-electric" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading flex items-center gap-3">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-electric text-white shadow-sm">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding your complaint status, staff assignments, and warden messages
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary inline-flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold"
          >
            <CheckCheck className="w-4 h-4 text-royal" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* API Error Notification & Retry */}
      {error && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="glass-card overflow-hidden divide-y divide-ice/60">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Fetching notification alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Bell className="w-12 h-12 text-sky mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-navy">No notifications</h3>
            <p className="text-xs text-slate-500 mt-1">You're all caught up! New updates will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                n.isRead ? 'bg-white/40 hover:bg-white/70' : 'bg-ice/30 hover:bg-ice/50 font-medium'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm text-navy ${!n.isRead ? 'font-bold' : 'font-semibold'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-electric shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {n.link && (
                <Link
                  to={n.link}
                  className="btn-secondary shrink-0 p-2 rounded-lg text-royal hover:text-navy"
                  title="View Complaint"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
