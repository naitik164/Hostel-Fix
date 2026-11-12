import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardCheck,
  Search,
  Filter,
  ArrowUpDown,
  Building,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react';

const StaffTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state initialized from searchParams
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (status !== 'all') params.status = status;
      if (category !== 'all') params.category = category;
      if (priority !== 'all') params.priority = priority;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/staff/tasks', { params });
      if (res.data && res.data.success) {
        setTasks(res.data.tasks);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [status, category, priority, sortBy, sortOrder, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const getStatusBadge = (s) => {
    const map = {
      'Assigned': 'bg-[#E9EDDA] text-[#20543F] border-[#A8B99A]/50',
      'Accepted': 'bg-[#E9EDDA] text-[#173D30] border-[#A8B99A]/50',
      'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
      'Pending Verification': 'bg-[#E9EDDA] text-[#20543F] border-[#A8B99A]/50',
      'Rework Required': 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
      'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Unable to Complete': 'bg-slate-200 text-slate-800 border-slate-300',
    };
    return map[s] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (p) => {
    const map = {
      Urgent: 'bg-rose-500 text-white',
      High: 'bg-amber-500 text-white',
      Medium: 'bg-[#20543F] text-white',
      Low: 'bg-slate-600 text-white',
    };
    return map[p] || 'bg-[#20543F] text-white';
  };

  const statuses = [
    { value: 'all', label: 'All Tasks' },
    { value: 'Assigned', label: 'New Assigned' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Rework Required', label: 'Rework Required' },
    { value: 'Pending Verification', label: 'Pending Verification' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Unable to Complete', label: 'Unable to Complete' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#20543F]" />
            <span>My Assigned Tasks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintenance tasks assigned to you by hostel wardens
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search Reference, title, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-sky/30 text-xs font-medium text-navy placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-electric shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {statuses.map((item) => (
          <button
            key={item.value}
            onClick={() => {
              setStatus(item.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              status === item.value
                ? 'bg-[#20543F] text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-navy border border-sky/20'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Secondary Filters Bar */}
      <div className="glass-card p-3 sm:p-4 border border-white/80 shadow-glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#20543F]" />
            <span>Filter:</span>
          </div>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-2.5 py-2 rounded-lg bg-white border border-sky/30 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-electric"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-2.5 py-2 rounded-lg bg-white border border-sky/30 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-electric"
          >
            <option value="all">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Cleaning & Hygiene">Cleaning & Hygiene</option>
            <option value="Mess & Food">Mess & Food</option>
            <option value="Internet & IT">Internet & IT</option>
            <option value="Security">Security</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 sm:flex-none px-2.5 py-2 rounded-lg bg-white border border-[#A8B99A]/30 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-[#20543F]"
          >
            <option value="createdAt">Date Assigned</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-white border border-[#A8B99A]/30 text-[#20543F] hover:bg-[#E9EDDA]/50 transition-colors touch-target"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#20543F]" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTasks} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Tasks Listing */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/60 border border-white animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/80 shadow-glass">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-navy">No Assigned Tasks Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || status !== 'all' || category !== 'all'
              ? 'Try resetting your filter parameters or search query.'
              : 'You have no assigned tasks in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#20543F] bg-[#E9EDDA] px-2 py-0.5 rounded border border-[#A8B99A]/40">
                    {task.referenceId}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    • {task.category} {task.subcategory ? `› ${task.subcategory}` : ''}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm sm:text-base font-bold text-navy">{task.title}</h2>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {task.description}
                  </p>
                </div>

                {/* Location & Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#20543F]" />
                    <span className="font-semibold text-navy">{task.hostelBlockName}</span>
                  </span>
                  {task.roomNumber && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#20543F]" />
                      <span>Room {task.roomNumber}</span>
                    </span>
                  )}
                  {task.studentId && (
                    <span className="text-slate-500">
                      Student: <span className="font-medium text-navy">{task.studentId.name}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Assigned {new Date(task.assignedAt || task.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                {/* Instructions preview */}
                {task.assignmentInstructions && (
                  <div className="p-2 rounded-lg bg-[#F7F8F0] border border-[#A8B99A]/30 text-[11px] text-[#20543F] font-medium">
                    <span className="font-bold">Warden Instructions:</span> {task.assignmentInstructions}
                  </div>
                )}

                {/* Rework Reason Alert */}
                {task.status === 'Rework Required' && task.reworkReason && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-800">
                    <span className="font-bold">Rework Required:</span> {task.reworkReason}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-2 w-full md:w-auto">
                <Link
                  to={`/staff/tasks/${task._id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#20543F] text-white text-xs font-bold hover:bg-[#173D30] transition-all shadow-sm touch-target"
                >
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Inspect & Manage</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-sky/20 text-xs">
              <span className="text-slate-500">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} tasks total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-sky/30 disabled:opacity-40 text-navy font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-sky/30 disabled:opacity-40 text-navy font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffTasks;
