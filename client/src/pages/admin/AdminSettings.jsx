import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Settings,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Key,
} from 'lucide-react';

const AdminSettings = () => {
  const { user } = useAuth();
  const [slaHours, setSlaHours] = useState({
    Critical: 6,
    High: 24,
    Medium: 48,
    Low: 72,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/settings');
        if (res.data && res.data.slaHours) {
          setSlaHours(res.data.slaHours);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSLA = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.patch('/admin/settings', {
        slaHours: {
          Critical: Number(slaHours.Critical),
          High: Number(slaHours.High),
          Medium: Number(slaHours.Medium),
          Low: Number(slaHours.Low),
        },
      });
      setSuccess('SLA resolution service targets updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">
          System & SLA Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure service level agreements, resolution time targets, and warden credentials
        </p>
      </div>

      {/* Warden Account Profile Card */}
      <div className="glass-card p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-action text-white flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7 text-ice" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">
              Administrator Role
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 hidden sm:block">
          <p className="font-semibold text-navy">Authentication Mode</p>
          <p className="text-[11px]">Bcrypt Password & HttpOnly Cookie Session</p>
        </div>
      </div>

      {/* Service Level Agreement (SLA) Targets Form */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-ice/80 pb-4">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Clock className="w-5 h-5 text-royal" />
            <span>Resolution SLA Service Target Hours</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Complaints exceeding these elapsed turnaround thresholds are automatically flagged as
            "Overdue" across the warden analytics dashboard.
          </p>
        </div>

        {success && (
          <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveSLA} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200">
              <label className="block text-xs font-bold text-red-700 mb-1">
                Critical Priority (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                required
                value={slaHours.Critical}
                onChange={(e) => setSlaHours({ ...slaHours, Critical: e.target.value })}
                className="glass-input w-full p-2 text-xs font-bold text-red-800"
              />
              <span className="text-[10px] text-red-600 mt-1 block">Ex: Sparks, flooding</span>
            </div>

            {/* High */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200">
              <label className="block text-xs font-bold text-orange-700 mb-1">
                High Priority (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                required
                value={slaHours.High}
                onChange={(e) => setSlaHours({ ...slaHours, High: e.target.value })}
                className="glass-input w-full p-2 text-xs font-bold text-orange-800"
              />
              <span className="text-[10px] text-orange-600 mt-1 block">Ex: Water outage, mess</span>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <label className="block text-xs font-bold text-amber-700 mb-1">
                Medium Priority (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                required
                value={slaHours.Medium}
                onChange={(e) => setSlaHours({ ...slaHours, Medium: e.target.value })}
                className="glass-input w-full p-2 text-xs font-bold text-amber-800"
              />
              <span className="text-[10px] text-amber-600 mt-1 block">Ex: Clogged sink, pests</span>
            </div>

            {/* Low */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <label className="block text-xs font-bold text-blue-700 mb-1">
                Low Priority (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                required
                value={slaHours.Low}
                onChange={(e) => setSlaHours({ ...slaHours, Low: e.target.value })}
                className="glass-input w-full p-2 text-xs font-bold text-blue-800"
              />
              <span className="text-[10px] text-blue-600 mt-1 block">Ex: Study desk leg</span>
            </div>
          </div>

          <div className="pt-4 border-t border-ice/80 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-action flex items-center gap-2 px-6 py-2.5 rounded-control text-xs font-bold shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save SLA Target Thresholds</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* System Infrastructure Telemetry */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-navy flex items-center gap-2">
          <Database className="w-5 h-5 text-royal" />
          <span>System Environment & Storage Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/60 p-3 rounded-xl border border-sky/30">
            <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">
              Database Cluster
            </span>
            <span className="font-bold text-navy">MongoDB Atlas / Local Server</span>
          </div>

          <div className="bg-white/60 p-3 rounded-xl border border-sky/30">
            <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">
              Image Storage
            </span>
            <span className="font-bold text-navy">Cloudinary / Local Fallback Active</span>
          </div>

          <div className="bg-white/60 p-3 rounded-xl border border-sky/30">
            <span className="text-slate-400 block mb-0.5 font-semibold text-[10px] uppercase">
              Student Auth Protocol
            </span>
            <span className="font-bold text-navy">Google Identity Services (GIS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
