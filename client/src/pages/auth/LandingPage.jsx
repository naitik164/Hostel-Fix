import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CategorySelector from '../../components/CategorySelector';
import {
  Wrench,
  Shield,
  ArrowRight,
  HardHat,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Food Quality & Mess');

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-navy relative overflow-hidden font-sans">
      {/* Dynamic ambient lights */}
      <div className="ambient-glow" />
      <div className="ambient-glow-bottom" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="HostelFix Logo"
              className="w-11 h-11 object-contain drop-shadow-md rounded-2xl"
            />
            <div>
              <span className="font-heading font-extrabold text-2xl text-navy tracking-tight">
                Hostel<span className="text-electric">Fix</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">Smart Complaint & Maintenance System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={
                  user?.role === 'admin'
                    ? '/admin/dashboard'
                    : user?.role === 'staff'
                    ? '/staff/dashboard'
                    : '/student/dashboard'
                }
                className="btn-action flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/student/login"
                  className="btn-secondary px-3.5 py-2 rounded-control text-xs font-bold"
                >
                  Student Login
                </Link>
                <Link
                  to="/staff/login"
                  className="px-3.5 py-2 rounded-control text-xs font-bold bg-blue-100 text-royal hover:bg-blue-200 transition-colors border border-sky/40"
                >
                  Staff Portal
                </Link>
                <Link
                  to="/admin/login"
                  className="btn-action px-3.5 py-2 rounded-control text-xs font-bold shadow-md"
                >
                  Warden Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-navy tracking-tight max-w-4xl mx-auto leading-tight">
          Your Hostel. Your Voice. <br />
          <span className="bg-gradient-to-r from-royal via-electric to-blue bg-clip-text text-transparent">
            Better Living.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering hostel residents to log issues in seconds with photo evidence and live status tracking,
          enabling technicians to manage tasks with photo proof, and providing wardens with complete verification controls.
        </p>

        {/* Portal Entry Cards: 3 Column Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Student Card */}
          <div className="glass-card p-6 text-left flex flex-col justify-between hover:shadow-glass-hover transition-all border-sky/40">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center mb-4 shadow-md">
                <Wrench className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy">Resident Student Portal</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Sign in with Google, report facility complaints, track maintenance milestones, and rate resolution quality.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/student/login"
                className="btn-action w-full flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold"
              >
                <span>Student Google Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Staff Card */}
          <div className="glass-card p-6 text-left flex flex-col justify-between hover:shadow-glass-hover transition-all border-sky/40 bg-gradient-to-b from-white/90 to-blue-50/50">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-royal to-electric text-white flex items-center justify-center mb-4 shadow-md">
                <HardHat className="w-6 h-6 text-ice" />
              </div>
              <h2 className="text-lg font-heading font-bold text-navy">Maintenance Staff Portal</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Authorized field technicians sign in with approved Google accounts, manage assigned tasks, and submit photo proof for sign-off.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/staff/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold bg-royal text-white hover:bg-electric transition-all shadow-md"
              >
                <span>Staff Google Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Warden Card */}
          <div className="glass-dark-panel p-6 text-left flex flex-col justify-between rounded-card shadow-glass-dark text-white">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center mb-4 shadow-md border border-sky/50">
                <Shield className="w-6 h-6 text-ice" />
              </div>
              <h2 className="text-lg font-heading font-bold text-white">Warden Admin Center</h2>
              <p className="mt-2 text-xs text-slate-200/80 leading-relaxed">
                Assign tasks, inspect before/after photo proof, approve resolutions, register staff, and monitor MongoDB analytics.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/admin/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold bg-white text-navy hover:bg-ice transition-all shadow-md"
              >
                <span>Warden ID & Pass Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="relative z-10 py-20 bg-white/60 border-y border-sky/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-navy tracking-tight">
              Comprehensive Hostel Care
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Every complaint is auto-categorized with server-suggested priority and routed to the right maintenance technician.
            </p>
          </div>

          <CategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={(name) => setSelectedCategory(name)}
          />
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-heading font-extrabold text-navy">Transparent 4-Stage Lifecycle</h2>
          <p className="mt-2 text-sm text-slate-600">
            Real-time status updates and immutable audit trails keep students and wardens completely aligned.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto mb-3">1</div>
            <h4 className="font-bold text-navy text-sm">Submitted</h4>
            <p className="text-xs text-slate-500 mt-1">Concurreny-safe reference ID (e.g. HF-2026-0001) logged immediately.</p>
          </div>
          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center mx-auto mb-3">2</div>
            <h4 className="font-bold text-navy text-sm">Assigned</h4>
            <p className="text-xs text-slate-500 mt-1">Warden assigns designated technician with specialization.</p>
          </div>
          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center mx-auto mb-3">3</div>
            <h4 className="font-bold text-navy text-sm">In Progress</h4>
            <p className="text-xs text-slate-500 mt-1">Physical inspection and repair underway on site.</p>
          </div>
          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mx-auto mb-3">4</div>
            <h4 className="font-bold text-navy text-sm">Resolved</h4>
            <p className="text-xs text-slate-500 mt-1">Detailed resolution notes logged and student feedback rating submitted.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sky/30 bg-white/70 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo-icon.png"
              alt="HostelFix Logo"
              className="w-6 h-6 object-contain"
            />
            <span className="font-bold text-navy">HostelFix</span>
            <span className="text-slate-400">| "Your Hostel. Your Voice. Better Living."</span>
          </div>
          <p>© 2026 HostelFix. Smart Hostel Complaint & Maintenance Management System.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
