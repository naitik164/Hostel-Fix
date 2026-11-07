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
  Menu,
  X,
  Sparkles,
  User,
  CheckCircle2,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Food Quality & Mess');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard';

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-navy relative overflow-hidden font-sans">
      {/* Dynamic ambient lights */}
      <div className="ambient-glow" />
      <div className="ambient-glow-bottom" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            <img
              src="/logo-icon.png"
              alt="HostelFix Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md rounded-2xl group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-navy tracking-tight">
                Hostel<span className="text-electric">Fix</span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden xs:block">
                Smart Complaint & Maintenance System
              </p>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="btn-action flex items-center gap-2 px-4 py-2.5 rounded-control text-xs font-bold"
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

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className="btn-action px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className="p-2.5 rounded-xl text-navy hover:bg-white/80 active:bg-ice/50 transition-colors border border-sky/30 touch-target flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-sky/20 bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            {isAuthenticated ? (
              <div className="p-3.5 rounded-2xl bg-ice/50 border border-sky/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-navy">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{user?.role} Account</p>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-action px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Open Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                  Select User Portal
                </p>

                {/* Student Login */}
                <Link
                  to="/student/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-white border border-sky/40 text-navy font-semibold text-xs active:bg-sky/20 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-action text-white flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-navy">Resident Student Portal</div>
                      <div className="text-[11px] text-slate-500">Google OAuth Sign-In</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-royal" />
                </Link>

                {/* Staff Login */}
                <Link
                  to="/staff/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-white border border-sky/40 text-navy font-semibold text-xs active:bg-sky/20 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-royal text-white flex items-center justify-center shrink-0">
                      <HardHat className="w-4 h-4 text-ice" />
                    </div>
                    <div>
                      <div className="font-bold text-navy">Maintenance Staff Portal</div>
                      <div className="text-[11px] text-slate-500">Field Technicians & Proof</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-royal" />
                </Link>

                {/* Warden Login */}
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl glass-dark-panel text-white font-semibold text-xs active:opacity-90 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-action text-white flex items-center justify-center shrink-0 border border-sky/40">
                      <Shield className="w-4 h-4 text-ice" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Warden Administration</div>
                      <div className="text-[11px] text-sky-light/80">Command & Control Center</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sky" />
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-[32px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-navy tracking-tight max-w-4xl mx-auto leading-[1.18]">
          Your Hostel. Your Voice. <br />
          <span className="bg-gradient-to-r from-royal via-electric to-blue bg-clip-text text-transparent">
            Better Living.
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering hostel residents to log issues in seconds with photo evidence and live status tracking,
          enabling technicians to manage tasks with photo proof, and providing wardens with complete verification controls.
        </p>

        {/* Portal Entry Cards: Responsive Grid (1 col on mobile, 3 col on tablet/desktop) */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {/* Student Card */}
          <div className="glass-card p-5 sm:p-6 text-left flex flex-col justify-between hover:shadow-glass-hover transition-all border-sky/40">
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
                className="btn-action w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold"
              >
                <span>Student Google Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Staff Card */}
          <div className="glass-card p-5 sm:p-6 text-left flex flex-col justify-between hover:shadow-glass-hover transition-all border-sky/40 bg-gradient-to-b from-white/90 to-blue-50/50">
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold bg-royal text-white hover:bg-electric transition-all shadow-md"
              >
                <span>Staff Google Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Warden Card */}
          <div className="glass-dark-panel p-5 sm:p-6 text-left flex flex-col justify-between rounded-card shadow-glass-dark text-white">
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold bg-white text-navy hover:bg-ice transition-all shadow-md"
              >
                <span>Warden ID & Pass Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="relative z-10 py-12 sm:py-20 bg-white/60 border-y border-sky/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-navy tracking-tight">
              Comprehensive Hostel Care
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-600 leading-relaxed">
              Every complaint is auto-categorized with server-suggested priority and routed to the right maintenance technician.
            </p>
          </div>

          <CategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={(name) => setSelectedCategory(name)}
          />
        </div>
      </section>

      {/* Workflow Section: 4-Stage Lifecycle */}
      <section className="relative z-10 py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
            Transparent 4-Stage Lifecycle
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real-time status updates and immutable audit trails keep students and wardens completely aligned.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="glass-card p-5 sm:p-6 relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto mb-3">1</div>
            <h4 className="font-bold text-navy text-sm">Submitted</h4>
            <p className="text-xs text-slate-500 mt-1">Concurrency-safe reference ID (e.g. HF-2026-0001) logged immediately.</p>
          </div>
          <div className="glass-card p-5 sm:p-6 relative">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center mx-auto mb-3">2</div>
            <h4 className="font-bold text-navy text-sm">Assigned</h4>
            <p className="text-xs text-slate-500 mt-1">Warden assigns designated technician with trade specialization.</p>
          </div>
          <div className="glass-card p-5 sm:p-6 relative">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center mx-auto mb-3">3</div>
            <h4 className="font-bold text-navy text-sm">In Progress</h4>
            <p className="text-xs text-slate-500 mt-1">Physical inspection and repair underway on site.</p>
          </div>
          <div className="glass-card p-5 sm:p-6 relative">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mx-auto mb-3">4</div>
            <h4 className="font-bold text-navy text-sm">Resolved</h4>
            <p className="text-xs text-slate-500 mt-1">Photo evidence verified and student feedback rating submitted.</p>
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
