import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Loader2,
  Calendar,
  Building,
  RefreshCw,
} from 'lucide-react';

import UserAvatar from '../../components/UserAvatar';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    metrics: { total: 0, pending: 0, inProgress: 0, resolved: 0 },
    recentComplaints: [],
    blocks: [],
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/dashboard');
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data from server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredComplaints = data.recentComplaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.referenceId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Profile Section */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={user?.profilePhoto}
            name={user?.name}
            size="lg"
            className="rounded-2xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading tracking-tight">
                Welcome back, {user?.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 bg-ice/60 px-2.5 py-0.5 rounded-full text-royal border border-sky/30">
                <Building className="w-3.5 h-3.5" />
                {user?.hostelBlock ? `${user.hostelBlock} • Room ${user.roomNumber || 'N/A'}` : 'Room Not Set'}
              </span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/student/complaints/new"
            className="btn-action w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-control text-xs font-bold shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise a Complaint</span>
          </Link>
        </div>
      </div>

      {/* API Error Notification & Retry */}
      {error && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total */}
        <div className="glass-card p-5 sm:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Complaints</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-navy font-heading">
            {loading ? '-' : data.metrics.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">All registered lifetime complaints</p>
        </div>

        {/* Pending */}
        <div className="glass-card p-5 sm:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Review</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-royal flex items-center justify-center border border-sky/40">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-royal font-heading">
            {loading ? '-' : data.metrics.pending}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Queued for warden inspection</p>
        </div>

        {/* In Progress */}
        <div className="glass-card p-5 sm:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600 font-heading">
            {loading ? '-' : data.metrics.inProgress}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Currently assigned to technicians</p>
        </div>

        {/* Resolved */}
        <div className="glass-card p-5 sm:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600 font-heading">
            {loading ? '-' : data.metrics.resolved}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Successfully closed maintenance issues</p>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-navy">Recent Complaints</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live status of your submitted hostel concerns</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-9 pr-3 py-1.5 text-xs w-48 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <Link
              to="/student/complaints"
              className="text-xs font-bold text-royal hover:underline flex items-center gap-1 ml-2"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Complaints List / Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-electric" />
            <p className="text-xs">Loading complaint records from database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center bg-white/40 rounded-2xl border border-dashed border-sky/40 p-8">
            <FileText className="w-10 h-10 text-sky mx-auto mb-2 opacity-70" />
            <h3 className="text-sm font-bold text-navy">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No matching complaints found for the applied search criteria.'
                : 'You have not submitted any complaints yet. Use the "Raise a Complaint" button to report an issue.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link
                to="/student/complaints/new"
                className="btn-action inline-flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Your First Complaint</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Title & Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c._id} className="transition-colors">
                    <td className="font-mono font-bold text-xs text-royal">{c.referenceId}</td>
                    <td>
                      <div className="font-semibold text-navy max-w-xs truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.category}</div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.hostelBlockName} {c.roomNumber ? `• ${c.roomNumber}` : ''}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/student/complaints/${c._id}`}
                        className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <span>Details</span>
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

export default StudentDashboard;
