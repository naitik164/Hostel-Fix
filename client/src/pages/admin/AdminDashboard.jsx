import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Users,
  Building,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState({
    metrics: {
      total: 0,
      awaitingReview: 0,
      inProgress: 0,
      resolved: 0,
      overdue: 0,
      avgResolutionTimeHours: 0,
      resolutionRate: 0,
    },
    recentComplaints: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard');
        if (res.data && res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const { metrics, recentComplaints } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Fast Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">
            Warden Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time hostel facility telemetry, staff workloads, and SLA compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/analytics"
            className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold"
          >
            <TrendingUp className="w-4 h-4 text-royal" />
            <span>Deep Analytics</span>
          </Link>
          <Link
            to="/admin/complaints"
            className="btn-action flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold shadow-md"
          >
            <span>Manage All Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Critical Overdue Alert Banner if overdue > 0 */}
      {metrics.overdue > 0 && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-300 shadow-sm flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-200/80 flex items-center justify-center shrink-0 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold">
                {metrics.overdue} Complaint(s) Currently Exceeding SLA Targets
              </h2>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Urgent attention recommended to expedite resolution for high-priority hostel complaints.
              </p>
            </div>
          </div>
          <Link
            to="/admin/complaints?status=In Progress"
            className="shrink-0 text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Inspect Overdue
          </Link>
        </div>
      )}

      {/* 6 Key Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="glass-card p-4 glass-card-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
            <FileText className="w-4 h-4 text-navy" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy font-heading">
            {loading ? '-' : metrics.total}
          </p>
          <span className="text-[10px] text-slate-400">Logged to date</span>
        </div>

        {/* Awaiting Review */}
        <div className="glass-card p-4 glass-card-hover border-royal/40">
          <div className="flex items-center justify-between text-royal">
            <span className="text-[10px] uppercase font-bold tracking-wider">Submitted</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-royal font-heading">
            {loading ? '-' : metrics.awaitingReview}
          </p>
          <span className="text-[10px] text-slate-400">Needs review & staff</span>
        </div>

        {/* In Progress */}
        <div className="glass-card p-4 glass-card-hover border-amber-300">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">In Progress</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 font-heading">
            {loading ? '-' : metrics.inProgress}
          </p>
          <span className="text-[10px] text-slate-400">Under active repair</span>
        </div>

        {/* Resolved */}
        <div className="glass-card p-4 glass-card-hover border-emerald-300">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">
            {loading ? '-' : metrics.resolved}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">{metrics.resolutionRate}% rate</span>
        </div>

        {/* Overdue */}
        <div className="glass-card p-4 glass-card-hover border-rose-300">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 font-heading">
            {loading ? '-' : metrics.overdue}
          </p>
          <span className="text-[10px] text-slate-400">Exceeded SLA limit</span>
        </div>

        {/* Avg Resolution Time */}
        <div className="glass-card p-4 glass-card-hover border-sky/40">
          <div className="flex items-center justify-between text-electric">
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Resolution</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-electric font-heading">
            {loading ? '-' : `${metrics.avgResolutionTimeHours}h`}
          </p>
          <span className="text-[10px] text-slate-400">Turnaround time</span>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-navy">Recent Complaints Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Prioritized administrative intake</p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-bold text-royal hover:underline flex items-center gap-1"
          >
            <span>Open All Complaints Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Connecting to MongoDB database...</p>
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No complaints logged in the system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Block & Room</th>
                  <th>Priority</th>
                  <th>Assigned Staff</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c._id} className="transition-colors">
                    <td className="font-mono font-bold text-xs text-royal">{c.referenceId}</td>
                    <td>
                      <div className="font-semibold text-navy text-xs">{c.studentId?.name || 'Student'}</div>
                      <div className="text-[11px] text-slate-400">{c.studentId?.email}</div>
                    </td>
                    <td className="text-xs text-slate-600">{c.category}</td>
                    <td>
                      <div className="font-medium text-navy max-w-xs truncate text-xs">{c.title}</div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.hostelBlockName} {c.roomNumber ? `• ${c.roomNumber}` : ''}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.assignedStaffId ? (
                        <span className="font-medium text-navy">{c.assignedStaffId.name}</span>
                      ) : (
                        <span className="text-rose-500 font-semibold text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/admin/complaints/${c._id}`}
                        className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
