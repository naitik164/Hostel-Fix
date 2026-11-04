import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  HardHat,
  Search,
  ArrowRight,
  ShieldAlert,
  Flame,
  Check,
  Building,
  MapPin,
  Calendar,
  Eye,
  Activity,
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/staff/dashboard');
      if (res.data && res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/staff/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  const recentActivity = data?.recentActivity || [];

  const getStatusBadge = (status) => {
    const map = {
      'Assigned': 'bg-blue-100 text-blue-800 border-blue-300',
      'Accepted': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
      'Pending Verification': 'bg-purple-100 text-purple-800 border-purple-300',
      'Rework Required': 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Unable to Complete': 'bg-slate-200 text-slate-800 border-slate-300',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (priority) => {
    const map = {
      Urgent: 'bg-rose-500 text-white',
      High: 'bg-amber-500 text-white',
      Medium: 'bg-blue-500 text-white',
      Low: 'bg-slate-400 text-white',
    };
    return map[priority] || 'bg-blue-500 text-white';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-white/60 border border-white" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/60 border border-white" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-white/60 border border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#03195B] via-[#0B2CB1] to-[#1951FC] p-6 sm:p-8 text-white shadow-xl shadow-royal/20 border border-sky/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-sky-light font-semibold">
              <HardHat className="w-3.5 h-3.5 text-sky" />
              <span>Field Staff Operational Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-ice-pale/90 max-w-xl">
              Specialization: <span className="font-semibold text-white">{user?.specialization || 'Maintenance'}</span> • 
              Employee ID: <span className="font-semibold text-white">{user?.employeeId || 'STAFF'}</span>
              {user?.assignedBlocks && user.assignedBlocks.length > 0 && (
                <> • Assigned Blocks: <span className="font-semibold text-white">{user.assignedBlocks.join(', ')}</span></>
              )}
            </p>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search Reference (e.g. HF-2026-...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-sky-light/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky"
            />
            <Search className="w-4 h-4 text-sky-light absolute left-3.5 top-3" />
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboard} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Rework Alert Banner (If rework is required) */}
      {stats.reworkRequired > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm">
                {stats.reworkRequired} Task{stats.reworkRequired > 1 ? 's' : ''} Require Rework
              </p>
              <p className="text-xs text-rose-700">
                Warden requested adjustments. Please inspect feedback, fix the issue, and resubmit photo proof.
              </p>
            </div>
          </div>
          <Link
            to="/staff/tasks?status=Rework Required"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm self-start sm:self-center"
          >
            <span>View Rework Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Real MongoDB Derived KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Assigned */}
        <div className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-royal flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">{stats.totalAssigned || 0}</p>
          <span className="text-[11px] text-slate-400">All-time maintenance workload</span>
        </div>

        {/* New Assignments */}
        <Link
          to="/staff/tasks?status=Assigned"
          className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:border-electric transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-electric transition-colors">
              New Assignments
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky/20 text-electric flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-royal">{stats.newAssignments || 0}</p>
          <span className="text-[11px] text-sky-dark font-medium">Awaiting your acceptance</span>
        </Link>

        {/* In Progress */}
        <Link
          to="/staff/tasks?status=In Progress"
          className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-700">{stats.inProgress || 0}</p>
          <span className="text-[11px] text-slate-400">Under active repair on site</span>
        </Link>

        {/* Pending Verification */}
        <Link
          to="/staff/tasks?status=Pending Verification"
          className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-purple-600 transition-colors">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-purple-700">{stats.pendingVerification || 0}</p>
          <span className="text-[11px] text-slate-400">Proof submitted to warden</span>
        </Link>

        {/* Rework Required */}
        <Link
          to="/staff/tasks?status=Rework Required"
          className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:border-rose-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-rose-600 transition-colors">
              Rework Required
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-600">{stats.reworkRequired || 0}</p>
          <span className="text-[11px] text-rose-500 font-medium">Needs correction</span>
        </Link>

        {/* Completed */}
        <Link
          to="/staff/history"
          className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600 transition-colors">
              Completed & Verified
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-700">{stats.completed || 0}</p>
          <span className="text-[11px] text-slate-400">Warden approved & signed off</span>
        </Link>

        {/* High Priority */}
        <div className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Urgent / High</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">{stats.highPriorityCount || 0}</p>
          <span className="text-[11px] text-slate-400">Critical attention required</span>
        </div>

        {/* Overdue */}
        <div className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Past SLA Target</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-800">{stats.overdueCount || 0}</p>
          <span className="text-[11px] text-slate-400">SLA overdue tasks</span>
        </div>
      </div>

      {/* Main Section: Assigned Tasks and Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Assigned Tasks (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-navy font-heading">
                Recent Assigned Tasks
              </h2>
              <p className="text-xs text-slate-500">Directly assigned maintenance complaints</p>
            </div>
            <Link
              to="/staff/tasks"
              className="text-xs font-bold text-royal hover:text-electric transition-colors inline-flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="glass-card p-8 text-center border border-white/80 shadow-glass">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-navy">No Pending Assigned Tasks</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You have no active maintenance tasks right now. New tasks assigned by wardens will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="glass-card p-4 sm:p-5 border border-white/80 shadow-glass hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-royal">
                        {task.referenceId}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-navy truncate">{task.title}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-royal" />
                        <span>{task.hostelBlockName}</span>
                      </span>
                      {task.roomNumber && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-royal" />
                          <span>Room {task.roomNumber}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/staff/tasks/${task._id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-electric text-white text-xs font-bold hover:bg-royal transition-all shadow-sm shadow-electric/25 self-start sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Task</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-navy font-heading flex items-center gap-2">
              <Activity className="w-4 h-4 text-electric" />
              <span>Recent Activity</span>
            </h2>
            <p className="text-xs text-slate-500">Audit trail of updates on your tasks</p>
          </div>

          <div className="glass-card p-5 border border-white/80 shadow-glass space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent updates recorded yet.</p>
            ) : (
              <div className="space-y-3.5 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-sky/30">
                {recentActivity.map((act) => (
                  <div key={act._id} className="relative pl-7 text-xs">
                    <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-electric border-2 border-white" />
                    <p className="font-semibold text-navy">
                      {act.actionType}
                      {act.complaintId && (
                        <span className="text-royal font-mono ml-1.5">
                          {act.complaintId.referenceId}
                        </span>
                      )}
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                      {act.publicNote || act.internalNote || 'Action performed.'}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
