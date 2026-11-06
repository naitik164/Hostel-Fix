import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import {
  PlusCircle,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Food Quality & Mess',
  'Drinking Water',
  'Plumbing & Washroom',
  'Electricity & Lighting',
  'Cleanliness & Hygiene',
  'Room Maintenance',
  'Furniture & Fixtures',
  'Internet & Wi-Fi',
  'Security & Safety',
  'Pest Control',
  'Common Area Maintenance',
  'Other',
];

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        status: status !== 'all' ? status : undefined,
        category: category !== 'All Categories' ? category : undefined,
        search: search.trim() || undefined,
      };
      const res = await api.get('/student/complaints', { params });
      if (res.data && res.data.success) {
        setComplaints(res.data.complaints);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load student complaints:', err);
      setError(err.response?.data?.message || 'Failed to retrieve complaint records. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, status, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">My Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and monitor all maintenance tickets logged by your account
          </p>
        </div>
        <Link
          to="/student/complaints/new"
          className="btn-action inline-flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise a Complaint</span>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="glass-card p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by reference ID or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9 pr-3 py-2 text-xs w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="glass-input px-3 py-2 text-xs"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn-action px-4 py-2 rounded-control text-xs font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      {/* API Error Notification & Retry */}
      {error && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={fetchComplaints}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Complaints Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center justify-between gap-4 py-3 border-b border-sky/15">
                <div className="w-28 h-4 rounded skeleton-shimmer" />
                <div className="w-48 h-4 rounded skeleton-shimmer" />
                <div className="w-24 h-4 rounded skeleton-shimmer hidden sm:block" />
                <div className="w-20 h-5 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-20 text-center p-6">
            <ClipboardList className="w-12 h-12 text-sky mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-navy">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No complaint records matched your current search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Assigned Staff</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="transition-colors">
                    <td className="font-mono font-bold text-xs text-royal">{c.referenceId}</td>
                    <td>
                      <div className="font-semibold text-navy max-w-xs truncate">{c.title}</div>
                      {c.subcategory && (
                        <div className="text-[11px] text-slate-400">{c.subcategory}</div>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">{c.category}</td>
                    <td className="text-xs text-slate-600">
                      {c.hostelBlockName} {c.roomNumber ? `• ${c.roomNumber}` : ''}
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.assignedStaffId ? (
                        <div>
                          <div className="font-medium text-navy">{c.assignedStaffId.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {c.assignedStaffId.specialization}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
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
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-ice/60 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentComplaints;
