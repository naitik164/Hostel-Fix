import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  History,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Eye,
  Camera,
  Search,
  Check,
} from 'lucide-react';

const StaffHistory = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/staff/tasks', {
        params: { status: 'Resolved', limit: 30, search: search.trim() },
      });
      if (res.data && res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load work history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-royal" />
            <span>Work & Resolution History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archive of your completed, verified, and signed-off maintenance tasks
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-sky/30 text-xs font-medium text-navy placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-electric shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/60 border border-white animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/80 shadow-glass">
          <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-navy">No Completed Tasks Recorded</h2>
          <p className="text-xs text-slate-600 font-medium mt-1 max-w-sm mx-auto">
            Once tasks are verified and approved by the warden, they will appear here as part of your permanent performance record.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="glass-card p-5 border border-white/80 shadow-glass hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-royal bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {task.referenceId}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Verified Resolved</span>
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    • {task.category}
                  </span>
                </div>

                <h2 className="text-sm sm:text-base font-bold text-navy">{task.title}</h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
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
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Resolved {task.resolvedAt ? new Date(task.resolvedAt).toLocaleDateString() : 'Yes'}</span>
                  </span>
                  {task.evidence && (
                    <span className="inline-flex items-center gap-1 text-royal font-semibold text-xs">
                      <Camera className="w-3 h-3" />
                      <span>{task.evidence.length} Photo Proof(s)</span>
                    </span>
                  )}
                </div>

                {task.resolutionNotes && (
                  <p className="text-xs text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900">Resolution Sign-off:</span> {task.resolutionNotes}
                  </p>
                )}
              </div>

              <Link
                to={`/staff/tasks/${task._id}`}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-white text-xs font-bold transition-all border border-slate-300 shrink-0 touch-target"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Record</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffHistory;
