import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Bell, CheckCircle2, Clock, AlertTriangle, ArrowRight, Check } from 'lucide-react';

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/staff/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/staff/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-royal" />
            <span>Staff Operational Alerts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding assignments, rework requests, and warden verifications
          </p>
        </div>

        {unreadCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/60 border border-white animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/80 shadow-glass">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            You're all caught up! Updates regarding your tasks will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`glass-card p-4 sm:p-5 border transition-all flex items-start justify-between gap-4 ${
                !n.isRead
                  ? 'border-royal/50 bg-blue-50/40 shadow-sm'
                  : 'border-white/80 opacity-80'
              }`}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-navy">{n.title}</h3>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-electric shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={() => !n.isRead && handleMarkRead(n._id)}
                    className="p-2 rounded-xl bg-electric text-white hover:bg-royal transition-colors text-xs font-semibold"
                    title="View task"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="p-2 rounded-xl bg-white border border-sky/30 text-slate-500 hover:text-navy transition-colors text-xs"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffNotifications;
