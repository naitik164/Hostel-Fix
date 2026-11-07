import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  UserCheck,
  Shield,
  Mail,
  Phone,
  HardHat,
  Building,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

const StaffProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/staff/profile');
        if (res.data && res.data.success) {
          setProfile(res.data.staff);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const staff = profile || user;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-royal" />
          <span>My Staff Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Authorized maintenance personnel identity and campus assignments
        </p>
      </div>

      <div className="glass-card p-5 sm:p-8 border border-white/80 shadow-glass space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-sky/20">
          <div className="w-16 h-16 rounded-3xl bg-gradient-action text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-electric/25 border border-sky/40 shrink-0">
            {staff?.name ? staff.name.charAt(0) : 'S'}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-navy font-heading truncate">{staff?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active Staff</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium break-anywhere">
              Employee ID: <span className="font-mono font-bold text-royal">{staff?.employeeId}</span> • 
              Specialization: <span className="font-semibold text-navy">{staff?.specialization}</span>
            </p>
          </div>
        </div>

        {/* Identity & Google Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-sky/20 space-y-1 min-w-0">
            <span className="text-slate-400 block text-[11px] font-semibold">Verified Google Email</span>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm break-anywhere">
              <Mail className="w-4 h-4 text-royal shrink-0" />
              <span>{staff?.email}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Linked via official Google Identity Services
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-sky/20 space-y-1 min-w-0">
            <span className="text-slate-400 block text-[11px] font-semibold">Registered Phone</span>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm break-anywhere">
              <Phone className="w-4 h-4 text-royal shrink-0" />
              <span>{staff?.phone || 'Not provided'}</span>
            </div>
            <p className="text-[11px] text-slate-500">Contact number for student & warden calls</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-sky/20 space-y-1 min-w-0">
            <span className="text-slate-400 block text-[11px] font-semibold">Department / Trade</span>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm break-anywhere">
              <HardHat className="w-4 h-4 text-royal shrink-0" />
              <span>{staff?.department || staff?.specialization}</span>
            </div>
            <p className="text-[11px] text-slate-500">Hostel maintenance division</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-sky/20 space-y-1 min-w-0">
            <span className="text-slate-400 block text-[11px] font-semibold">Assigned Hostel Blocks</span>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm break-anywhere">
              <Building className="w-4 h-4 text-royal shrink-0" />
              <span>
                {staff?.assignedBlocks && staff.assignedBlocks.length > 0
                  ? staff.assignedBlocks.join(', ')
                  : 'All Campus Blocks'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Field zones under your service</p>
          </div>
        </div>

        {/* Workload Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold block">Total Tasks Completed</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {profile?.completedCount ?? 0}
            </span>
            <span className="text-[10px] text-emerald-700">Verified and approved by warden</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-xs text-blue-800 font-semibold block">Active Workload</span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {profile?.activeCount ?? 0}
            </span>
            <span className="text-[10px] text-blue-700">Tasks currently in workflow</span>
          </div>
        </div>

        {/* Security & Warden Administration Note */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-bold text-navy">
            <Shield className="w-4 h-4 text-royal" />
            <span>Profile Administration & Security Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Staff profiles and permissions are managed exclusively by the Hostel Warden. If you need to update your registered Google email address, phone number, or assigned blocks, please submit a request to the warden administration office.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
