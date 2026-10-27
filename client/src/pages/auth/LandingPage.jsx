import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Wrench,
  Shield,
  ArrowRight,
  Sparkles,
  Zap,
  Droplets,
  Utensils,
  Wifi,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user, loginAsDemoStudent, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [stats, setStats] = useState({
    totalComplaints: 128,
    resolvedRate: 94.2,
    avgResolution: '18.4 hrs',
    activeBlocks: 5,
  });

  useEffect(() => {
    // If already logged in, show quick redirection link
  }, []);

  const handleDemoStudent = async () => {
    try {
      setDemoLoading(true);
      await loginAsDemoStudent('aarav.sharma@hostelfix.edu');
      navigate('/student/dashboard');
    } catch (e) {
      alert('Demo student login error: ' + e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDemoWarden = async () => {
    try {
      setDemoLoading(true);
      await loginAsAdmin('admin@hostelfix.edu', 'Warden@Secure2026');
      navigate('/admin/dashboard');
    } catch (e) {
      alert('Demo warden login error: ' + e.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const categories = [
    { name: 'Food Quality & Mess', icon: Utensils, desc: 'Meal hygiene, freshness, cooking feedback' },
    { name: 'Drinking Water', icon: Droplets, desc: 'RO cooler maintenance, water filter purity' },
    { name: 'Electrical & Lighting', icon: Zap, desc: 'Short circuits, corridor lights, fan repairs' },
    { name: 'Plumbing & Washrooms', icon: Wrench, desc: 'Drainage leaks, flush repairs, tap fixtures' },
    { name: 'Internet & Wi-Fi', icon: Wifi, desc: 'Access point outages, LAN socket fixes' },
    { name: 'Safety & Security', icon: ShieldCheck, desc: 'Biometric turnstiles, locks, fire safety' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-navy relative overflow-hidden font-sans">
      {/* Dynamic ambient lights */}
      <div className="ambient-glow" />
      <div className="ambient-glow-bottom" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-action flex items-center justify-center text-white shadow-lg shadow-electric/25">
              <Wrench className="w-5 h-5" />
            </div>
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
                to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="btn-action flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/student/login"
                  className="btn-secondary px-4 py-2 rounded-control text-xs font-bold"
                >
                  Student Login
                </Link>
                <Link
                  to="/admin/login"
                  className="btn-action px-4 py-2 rounded-control text-xs font-bold shadow-md"
                >
                  Warden Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ice/60 border border-sky/50 text-royal text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-electric" />
          <span>Next-Gen Liquid-Glass Hostel Operations Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-navy tracking-tight max-w-4xl mx-auto leading-tight">
          Your Hostel. Your Voice. <br />
          <span className="bg-gradient-to-r from-royal via-electric to-blue bg-clip-text text-transparent">
            Better Living.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering hostel residents to log issues in seconds with photo evidence and live status tracking,
          while providing wardens with comprehensive task automation and real-time analytics.
        </p>

        {/* Portal Entry Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Student Card */}
          <div className="glass-card p-7 text-left flex flex-col justify-between hover:shadow-glass-hover transition-all border-sky/40">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center mb-4 shadow-md">
                <Wrench className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-heading font-bold text-navy">Resident Student Portal</h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Authenticate via Google, lodge complaints across 12 categories, attach photos, and receive live resolution updates with technician notes.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Link
                to="/student/login"
                className="btn-action w-full flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold"
              >
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDemoStudent}
                disabled={demoLoading}
                className="w-full py-2 rounded-control text-xs font-semibold text-royal bg-ice/50 hover:bg-ice border border-sky/30 transition-colors"
              >
                ⚡ 1-Click Demo Student Access
              </button>
            </div>
          </div>

          {/* Warden Card */}
          <div className="glass-dark-panel p-7 text-left flex flex-col justify-between rounded-card shadow-glass-dark text-white">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-action text-white flex items-center justify-center mb-4 shadow-md border border-sky/50">
                <Shield className="w-6 h-6 text-ice" />
              </div>
              <h2 className="text-xl font-heading font-bold text-white">Warden Admin Center</h2>
              <p className="mt-2 text-xs text-slate-200/80 leading-relaxed">
                Dedicated management center to assign technicians, prioritize emergency alerts, inspect audit trails, and review real-time MongoDB analytics.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Link
                to="/admin/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold bg-white text-navy hover:bg-ice transition-all shadow-md"
              >
                <span>Warden ID & Password Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDemoWarden}
                disabled={demoLoading}
                className="w-full py-2 rounded-control text-xs font-semibold text-ice bg-navy-900/60 hover:bg-navy-900 border border-sky/30 transition-colors"
              >
                ⚡ 1-Click Demo Warden Access
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-navy font-heading">100%</p>
            <p className="text-xs text-slate-500 font-medium mt-1">MongoDB Atlas Backed</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-royal font-heading">&lt; 24 Hrs</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Average Resolution</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-electric font-heading">12</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Specialized Categories</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">4.8 / 5</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Resident Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="relative z-10 py-16 bg-white/50 border-y border-sky/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-heading font-extrabold text-navy">Comprehensive Hostel Care</h2>
            <p className="mt-2 text-sm text-slate-600">
              Every complaint is auto-categorized with server-suggested priority and routed to the right maintenance technician.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="glass-card p-6 flex items-start gap-4 hover:shadow-glass-hover transition-all">
                  <div className="w-12 h-12 rounded-xl bg-ice text-royal flex items-center justify-center shrink-0 border border-sky/40">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
            <div className="w-6 h-6 rounded-lg bg-royal flex items-center justify-center text-white">
              <Wrench className="w-3.5 h-3.5" />
            </div>
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
