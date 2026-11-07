import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
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
      await api.patch('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
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
            <span>Administrative Alerts</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time critical safety flags, emergency notifications, and overdue ticket dispatches
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-control text-xs font-bold touch-target"
          >
            <CheckCheck className="w-4 h-4 text-royal" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="glass-card overflow-hidden divide-y divide-ice/60">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Fetching warden administrative alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Bell className="w-12 h-12 text-sky mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-navy">No alerts pending</h3>
            <p className="text-xs text-slate-500 mt-1">
              All resident complaints are inspected and up to date.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                n.isRead ? 'bg-white/40 hover:bg-white/70' : 'bg-ice/40 hover:bg-ice/60 font-medium'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm text-navy ${!n.isRead ? 'font-bold' : 'font-semibold'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed break-anywhere">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {n.link && (
                <Link
                  to={n.link}
                  className="btn-secondary shrink-0 p-2.5 rounded-lg text-royal hover:text-navy touch-target flex items-center justify-center"
                  title="Inspect Ticket"
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

export default AdminNotifications;
