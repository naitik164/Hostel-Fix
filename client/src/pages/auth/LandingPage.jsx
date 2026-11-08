import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CategorySelector from '../../components/CategorySelector';
import {
  Wrench,
  Shield,
  ArrowRight,
  HardHat,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ThumbsUp,
  FileCheck,
  ShieldCheck,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Food Quality & Mess');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Statistics animated counter state
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({
    resolutionRate: 0,
    categoriesCount: 0,
    satisfaction: 0,
  });

  const statsSectionRef = useRef(null);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard';

  // Intersection Observer for scroll-triggered reveal animations
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale').forEach((el) => {
        el.classList.add('is-revealed');
      });
      setStatsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // If the statistics section is revealed, start the number counter animation
            if (entry.target.getAttribute('data-section') === 'stats') {
              setStatsVisible(true);
            }
            obs.unobserve(entry.target); // Animate once only
          }
        });
      },
      {
        threshold: 0.15, // Triggers when 15%–20% enters viewport
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  // Smooth number counter animation for Statistics Section
  useEffect(() => {
    if (!statsVisible) return;

    const duration = 1200;
    const startTime = performance.now();

    const animateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts({
        resolutionRate: Math.round(98 * ease),
        categoriesCount: Math.round(12 * ease),
        satisfaction: (4.8 * ease).toFixed(1),
      });

      if (progress < 1) {
        requestAnimationFrame(animateCounters);
      }
    };

    requestAnimationFrame(animateCounters);
  }, [statsVisible]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F5F9FF] text-navy relative overflow-hidden font-sans w-full">
      {/* Dynamic ambient lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow" />
        <div className="ambient-glow-bottom" />
      </div>

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

          {/* Desktop Actions: Clean minimal header (removed the 3 cluttered login buttons as requested) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="btn-action flex items-center gap-2 px-5 py-2.5 rounded-control text-xs font-bold shadow-md"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ice/50 border border-sky/30 text-royal">
                  <Sparkles className="w-3.5 h-3.5 text-electric animate-spin-slow" />
                  <span>Campus Maintenance Portal</span>
                </span>
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
              className="p-2.5 rounded-xl text-navy hover:bg-white/80 active:bg-ice/50 transition-colors border border-sky/30 touch-target flex items-center justify-center cursor-pointer"
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

      {/* 1. HERO SECTION (Scroll Reveal: Fade-in + slight upward movement) */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="scroll-reveal max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ice/60 border border-sky/40 text-royal text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-electric animate-spin-slow" />
            <span>Next-Generation Hostel Facility Care</span>
          </div>

          <h1 className="text-[32px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-navy tracking-tight leading-[1.18]">
            Your Hostel. Your Voice. <br />
            <span className="bg-gradient-to-r from-royal via-electric to-blue bg-clip-text text-transparent">
              Better Living.
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Empowering hostel residents to log issues in seconds with photo evidence and live status tracking,
            enabling technicians to manage tasks with photo proof, and providing wardens with complete verification controls.
          </p>
        </div>

        {/* 2. FEATURES SECTION: Portal Entry Cards (Staggered Reveal: 100ms, 250ms, 400ms) */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {/* Student Card */}
          <div className="scroll-reveal-scale delay-100 h-full">
            <div className="glass-card p-5 sm:p-6 text-left flex flex-col justify-between h-full hover:shadow-glass-hover transition-all border-sky/40">
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
                  className="btn-action w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold cursor-pointer"
                >
                  <span>Student Google Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Staff Card */}
          <div className="scroll-reveal-scale delay-250 h-full">
            <div className="glass-card p-5 sm:p-6 text-left flex flex-col justify-between h-full hover:shadow-glass-hover transition-all border-sky/40 bg-gradient-to-b from-white/90 to-blue-50/50">
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold bg-royal text-white hover:bg-electric transition-all shadow-md cursor-pointer"
                >
                  <span>Staff Google Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Warden Card */}
          <div className="scroll-reveal-scale delay-400 h-full">
            <div className="glass-dark-panel p-5 sm:p-6 text-left flex flex-col justify-between h-full rounded-card shadow-glass-dark text-white">
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-control text-xs font-bold bg-white text-navy hover:bg-ice transition-all shadow-md cursor-pointer"
                >
                  <span>Warden ID & Pass Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATISTICS SECTION (Animated Counters when scrolling into view) */}
      <section
        ref={statsSectionRef}
        data-section="stats"
        className="scroll-reveal relative z-10 py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="glass-card p-5 sm:p-6 hover:shadow-glass-hover transition-all">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-electric flex items-center justify-center mx-auto mb-2.5">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-navy font-heading tracking-tight">
              &lt; 2 hrs
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Average First Response</p>
          </div>

          <div className="glass-card p-5 sm:p-6 hover:shadow-glass-hover transition-all">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-emerald-600 font-heading tracking-tight">
              {counts.resolutionRate}%
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Resolution Rate</p>
          </div>

          <div className="glass-card p-5 sm:p-6 hover:shadow-glass-hover transition-all">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-royal flex items-center justify-center mx-auto mb-2.5">
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-navy font-heading tracking-tight">
              {counts.categoriesCount}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Specialized Categories</p>
          </div>

          <div className="glass-card p-5 sm:p-6 hover:shadow-glass-hover transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-4xl font-extrabold text-royal font-heading tracking-tight">
              {counts.satisfaction} / 5
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">Resident Satisfaction</p>
          </div>
        </div>
      </section>

      {/* 4. COMPLAINT CATEGORIES (Staggered Card Reveal on Scroll) */}
      <section className="relative z-10 py-12 sm:py-20 bg-white/60 border-y border-sky/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal text-center max-w-2xl mx-auto mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-navy tracking-tight">
              Comprehensive Hostel Care
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-600 leading-relaxed">
              Every complaint is auto-categorized with server-suggested priority and routed to the right maintenance technician.
            </p>
          </div>

          {/* Category Cards with Staggered Scroll-Reveal Animation */}
          <CategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={(name) => setSelectedCategory(name)}
            enableScrollReveal={true}
          />
        </div>
      </section>

      {/* 5. HOW IT WORKS: 4-Stage Lifecycle (Sequential Scroll Reveal) */}
      <section className="relative z-10 py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
            Transparent 4-Stage Lifecycle
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real-time status updates and immutable audit trails keep students and wardens completely aligned.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="scroll-reveal-scale delay-100">
            <div className="glass-card p-5 sm:p-6 relative h-full hover:shadow-glass-hover transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto mb-3 shadow-sm">
                1
              </div>
              <h4 className="font-bold text-navy text-sm">Submitted</h4>
              <p className="text-xs text-slate-500 mt-1">
                Concurrency-safe reference ID (e.g. HF-2026-0001) logged immediately.
              </p>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-200">
            <div className="glass-card p-5 sm:p-6 relative h-full hover:shadow-glass-hover transition-all">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center mx-auto mb-3 shadow-sm">
                2
              </div>
              <h4 className="font-bold text-navy text-sm">Assigned</h4>
              <p className="text-xs text-slate-500 mt-1">
                Warden assigns designated technician with trade specialization.
              </p>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-300">
            <div className="glass-card p-5 sm:p-6 relative h-full hover:shadow-glass-hover transition-all">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center mx-auto mb-3 shadow-sm">
                3
              </div>
              <h4 className="font-bold text-navy text-sm">In Progress</h4>
              <p className="text-xs text-slate-500 mt-1">
                Physical inspection and repair underway on site.
              </p>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-400">
            <div className="glass-card p-5 sm:p-6 relative h-full hover:shadow-glass-hover transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mx-auto mb-3 shadow-sm">
                4
              </div>
              <h4 className="font-bold text-navy text-sm">Resolved</h4>
              <p className="text-xs text-slate-500 mt-1">
                Photo evidence verified and student feedback rating submitted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BENEFITS & TRUST SECTION (Scroll Reveal with Staggered Features) */}
      <section className="relative z-10 py-12 sm:py-16 bg-gradient-to-b from-white/70 to-blue-50/40 border-t border-sky/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-sky/30 text-royal text-xs font-bold mb-3 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-electric" />
              <span>Campus Security & Accountability</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
              Engineered for Campus Reliability
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Modern digital infrastructure built for educational institutions to eliminate verbal complaints and lost requests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="scroll-reveal-scale delay-100 h-full">
              <div className="glass-card p-6 h-full flex flex-col justify-between hover:shadow-glass-hover transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-ice text-royal flex items-center justify-center mb-4 border border-sky/40">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy">Photo Proof Verification</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Technicians are required to submit before & after photo evidence on completion, eliminating disputes and ensuring genuine repairs.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-ice/60 text-[11px] font-semibold text-royal flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Sign-off</span>
                </div>
              </div>
            </div>

            <div className="scroll-reveal-scale delay-250 h-full">
              <div className="glass-card p-6 h-full flex flex-col justify-between hover:shadow-glass-hover transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-ice text-royal flex items-center justify-center mb-4 border border-sky/40">
                    <Zap className="w-5 h-5 text-electric" />
                  </div>
                  <h3 className="text-base font-bold text-navy">Smart Urgency Engine</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Categorization rules calculate suggested priorities instantly, escalating electrical hazards and drinking water outages automatically.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-ice/60 text-[11px] font-semibold text-royal flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-time Triage</span>
                </div>
              </div>
            </div>

            <div className="scroll-reveal-scale delay-400 h-full">
              <div className="glass-card p-6 h-full flex flex-col justify-between hover:shadow-glass-hover transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-ice text-royal flex items-center justify-center mb-4 border border-sky/40">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy">Institutional Security</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Google OAuth student verification and warden-authorized staff profiles ensure zero spoofing and strictly protected data privacy.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-ice/60 text-[11px] font-semibold text-royal flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Google SSO Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER (Smooth Fade-in on Scroll) */}
      <footer className="scroll-reveal mt-auto shrink-0 border-t border-sky/30 bg-white/70 py-8 text-center text-xs text-slate-500 relative z-10">
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
          <p>© {new Date().getFullYear()} HostelFix. Smart Hostel Complaint & Maintenance Management System.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
