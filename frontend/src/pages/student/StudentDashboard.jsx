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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Profile Section */}
      <div className="glass-card p-4.5 sm:p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <UserAvatar
            src={user?.profilePhoto}
            name={user?.name}
            size="lg"
            className="rounded-2xl shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy font-heading tracking-tight truncate">
              Welcome back, {user?.name?.split(' ')[0] || user?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 bg-[#E9EDDA] px-2.5 py-0.5 rounded-full text-[#20543F] border border-[#A8B99A]/40">
                <Building className="w-3.5 h-3.5 text-[#20543F]" />
                {user?.hostelBlock ? `${user.hostelBlock} • Room ${user.roomNumber || 'N/A'}` : 'Room Not Set'}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate max-w-[200px]">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <Link
            to="/student/complaints/new"
            className="btn-action w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-control text-xs font-bold shadow-lg touch-target"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total */}
        <div className="glass-card p-3.5 sm:p-5 lg:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center border border-[#A8B99A]/40 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#20543F]" />
            </div>
          </div>
          <p className="mt-2.5 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-navy font-heading">
            {loading ? '-' : data.metrics.total}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-medium">All registered lifetime complaints</p>
        </div>

        {/* Pending */}
        <div className="glass-card p-3.5 sm:p-5 lg:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Awaiting Review</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center border border-[#A8B99A]/40 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#20543F]" />
            </div>
          </div>
          <p className="mt-2.5 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-[#20543F] font-heading">
            {loading ? '-' : data.metrics.pending}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-medium">Queued for warden inspection</p>
        </div>

        {/* In Progress */}
        <div className="glass-card p-3.5 sm:p-5 lg:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="mt-2.5 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-amber-700 font-heading">
            {loading ? '-' : data.metrics.inProgress}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-medium">Currently assigned to technicians</p>
        </div>

        {/* Resolved */}
        <div className="glass-card p-3.5 sm:p-5 lg:p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#00A878] flex items-center justify-center border border-emerald-300 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A878]" />
            </div>
          </div>
          <p className="mt-2.5 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-[#00A878] font-heading">
            {loading ? '-' : data.metrics.resolved}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-medium">Successfully closed maintenance issues</p>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="glass-card p-4 sm:p-6 md:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-navy">Recent Complaints</h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Live status of your submitted hostel concerns</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-9 pr-3 py-2 text-xs w-full placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input px-3 py-2 text-xs flex-1 sm:flex-none"
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
                className="text-xs font-bold text-[#20543F] hover:underline flex items-center gap-1 shrink-0 px-2 py-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#20543F]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Horizontal scroll notice for mobile */}
        {filteredComplaints.length > 0 && (
          <div className="md:hidden text-xs text-slate-600 font-medium flex items-center justify-end gap-1">
            <span>← Swipe table sideways →</span>
          </div>
        )}

        {/* Complaints List / Table */}
        {loading ? (
          <div className="py-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 rounded-xl glass-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1 max-w-sm">
                    <div className="w-3/4 h-3.5 rounded skeleton-shimmer" />
                    <div className="w-1/2 h-2.5 rounded skeleton-shimmer" />
                  </div>
                </div>
                <div className="w-20 h-5 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center bg-white/40 rounded-2xl border border-dashed border-[#A8B99A]/40 p-6 sm:p-8">
            <FileText className="w-10 h-10 text-[#A8B99A] mx-auto mb-2 opacity-70" />
            <h3 className="text-sm font-bold text-navy">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No matching complaints found for the applied search criteria.'
                : 'You have not submitted any complaints yet. Use the "Raise a Complaint" button to report an issue.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link
                to="/student/complaints/new"
                className="btn-action inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Your First Complaint</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive-container">
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
                    <td className="font-mono font-bold text-xs text-[#20543F] whitespace-nowrap">{c.referenceId}</td>
                    <td>
                      <div className="font-semibold text-navy max-w-xs truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.category}</div>
                    </td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">
                      {c.hostelBlockName} {c.roomNumber ? `• ${c.roomNumber}` : ''}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/student/complaints/${c._id}`}
                        className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap touch-target justify-center"
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
