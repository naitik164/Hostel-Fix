import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ProblemCarousel3D from '../../components/landing/ProblemCarousel3D';
import {
  Wrench,
  Shield,
  ArrowRight,
  ArrowDown,
  HardHat,
  Menu,
  X,
  CheckCircle2,
  FileText,
  Lock,
  Zap,
  Camera,
  Activity,
  UserCheck,
  ClipboardList,
  BarChart3,
  Repeat,
  Check,
  XCircle,
  Eye,
  UserPlus,
  User,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard showcase interactive reveal and animated counters
  const [showcaseRevealed, setShowcaseRevealed] = useState(false);
  const [showcaseCounts, setShowcaseCounts] = useState({
    total: 0,
    review: 0,
    progress: 0,
    resolved: 0,
  });
  const showcaseRef = useRef(null);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard';

  // Full-width to floating navbar transformation state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    checkResponsive();
    window.addEventListener('resize', checkResponsive, { passive: true });

    const handleScroll = () => {
      const scrollY =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement.scrollTop ??
        0;
      // At window.scrollY <= 50: isScrolled = false; at window.scrollY > 50: isScrolled = true
      setIsScrolled(scrollY > 50);
    };

    // Run immediately on mount to establish accurate initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkResponsive);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dedicated Intersection Observer for Dashboard Showcase (triggers when 20% in view)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShowcaseRevealed(true);
      setShowcaseCounts({ total: 14, review: 1, progress: 2, resolved: 11 });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShowcaseRevealed(true);
      setShowcaseCounts({ total: 14, review: 1, progress: 2, resolved: 11 });
      return;
    }

    const currentEl = showcaseRef.current;
    if (!currentEl) return;

    const showcaseObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowcaseRevealed(true);
            obs.unobserve(entry.target); // Trigger only once
          }
        });
      },
      {
        threshold: 0.20, // Exactly 20% viewport threshold
        rootMargin: '0px 0px -40px 0px',
      }
    );

    showcaseObserver.observe(currentEl);

    return () => {
      showcaseObserver.disconnect();
    };
  }, []);

  // Micro-animation: Counter rollout for Dashboard statistics
  useEffect(() => {
    if (!showcaseRevealed) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShowcaseCounts({ total: 14, review: 1, progress: 2, resolved: 11 });
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    const animateShowcaseNumbers = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);

      setShowcaseCounts({
        total: Math.round(14 * ease),
        review: Math.round(1 * ease),
        progress: Math.round(2 * ease),
        resolved: Math.round(11 * ease),
      });

      if (progress < 1) {
        requestAnimationFrame(animateShowcaseNumbers);
      }
    };

    // Stagger slightly so numbers count up in sync with card reveal
    const timer = setTimeout(() => {
      requestAnimationFrame(animateShowcaseNumbers);
    }, 280);

    return () => clearTimeout(timer);
  }, [showcaseRevealed]);

  // Intersection Observer for scroll-triggered reveal animations across general sections
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target); // Animate once only
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#EBECDE] text-[#2A3F38] relative overflow-x-clip font-sans w-full">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:px-4 focus:py-2.5 focus:bg-electric focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow" />
        <div className="ambient-glow-bottom" />
      </div>

      {/* Invisible spacer to maintain natural document flow and prevent layout shifts (100px tall) */}
      <div className="h-[100px] w-full shrink-0" aria-hidden="true" />

      {/* Top Navbar: Full-Width to Floating Glass Morphing Header */}
      <motion.header
        id="main-navbar"
        style={{
          position: 'fixed',
          left: '50%',
          zIndex: 9999,
          borderStyle: 'solid',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
        }}
        initial={false}
        animate={{
          x: '-50%',
          top: isScrolled ? 16 : 0,
          width: isScrolled
            ? isMobile
              ? 'calc(100% - 24px)'
              : 'calc(100% - 80px)'
            : '100%',
          maxWidth: isScrolled ? '1520px' : '100%',
          height: isScrolled ? (isMobile ? 64 : 76) : isMobile ? 84 : 100,
          borderRadius: isScrolled ? 20 : 0,
          backgroundColor: isScrolled
            ? 'rgba(249, 251, 246, 0.92)'
            : 'rgba(235, 236, 222, 0.95)',
          borderColor: isScrolled ? 'rgba(167, 184, 140, 0.4)' : '#DADFB9',
          borderTopWidth: isScrolled ? '1px' : '0px',
          borderLeftWidth: isScrolled ? '1px' : '0px',
          borderRightWidth: isScrolled ? '1px' : '0px',
          borderBottomWidth: '1px',
          boxShadow: isScrolled
            ? '0 8px 35px rgba(32, 46, 34, 0.08)'
            : '0 0 0 0 rgba(0, 0, 0, 0)',
          paddingLeft: isScrolled ? (isMobile ? 16 : 28) : isMobile ? 16 : 36,
          paddingRight: isScrolled ? (isMobile ? 16 : 28) : isMobile ? 16 : 36,
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.4, ease: 'easeInOut' }
        }
        className="flex flex-col justify-center overflow-visible"
      >
        <div className="w-full flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            <img
              src="/hostelfix-icon.webp"
              srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w"
              sizes="(max-width: 640px) 36px, 48px"
              alt="HostelFix Logo"
              width="48"
              height="48"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`object-contain drop-shadow-sm select-none group-hover:scale-105 transition-all duration-300 ${
                isScrolled
                  ? 'w-8.5 h-8.5 sm:w-9 sm:h-9'
                  : 'w-11 h-11 sm:w-12 sm:h-12'
              }`}
            />
            <div>
              <span
                className={`font-heading font-extrabold text-[#2A3F38] tracking-tight transition-all duration-300 ${
                  isScrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                Hostel<span className="text-[#22503B] relative inline-block">Fix<svg className="absolute -bottom-1 left-0 w-full h-1.5 overflow-visible" viewBox="0 0 48 6" fill="none"><path d="M 2 2 C 14 5, 34 5, 46 2 C 34 3.5, 14 3.5, 2 2 Z" fill="#C3DC9B" /></svg></span>
              </span>
              {!isScrolled && (
                <p className="text-[10px] sm:text-[11px] text-[#6A8A64] font-medium hidden xs:block transition-all duration-300">
                  Complaint • Maintenance • Resolution
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links with subtle hover indicator & pill transition */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-semibold text-slate-600">
            {[
              { id: 'problem', label: 'The Problem' },
              { id: 'solution', label: 'Our Solution' },
              { id: 'portals', label: 'Portals' },
              { id: 'features', label: 'Features' },
              { id: 'why-us', label: 'Why HostelFix' },
              { id: 'how-it-works', label: 'Workflow' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-navy transition-colors duration-200 group cursor-pointer"
              >
                <span className="relative z-10">{item.label}</span>
                {/* Subtle hover background pill */}
                <span className="absolute inset-0 rounded-full bg-[#20543F]/0 group-hover:bg-[#20543F]/6 transition-all duration-200" />
                {/* Smooth hover underline accent */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#20543F] rounded-full group-hover:w-4 transition-all duration-250 ease-out" />
              </button>
            ))}
          </nav>

          {/* Desktop Action Button */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className={`btn-action flex items-center gap-2 rounded-full font-bold shadow-md shadow-[#20543F]/20 hover:shadow-lg hover:shadow-[#20543F]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                  isScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-xs'
                }`}
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={() => scrollToSection('portals')}
                className={`btn-action flex items-center gap-2 rounded-full font-bold shadow-md shadow-[#20543F]/20 hover:shadow-lg hover:shadow-[#20543F]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                  isScrolled ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-xs'
                }`}
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className={`btn-action rounded-lg font-bold flex items-center gap-1 shadow-sm ${
                  isScrolled ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                }`}
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className={`rounded-xl text-navy hover:bg-white/80 active:bg-[#E9EDDA]/50 transition-all border border-[#A8B99A]/30 touch-target flex items-center justify-center cursor-pointer ${
                isScrolled ? 'p-2' : 'p-2.5'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer: floats cleanly underneath navbar */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl border border-[#A7B88C]/40 bg-[#F9FBF6]/95 backdrop-blur-2xl p-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 z-[9999]">
            {/* Quick Section Anchor Links */}
            <nav aria-label="Mobile section navigation" className="grid grid-cols-2 gap-1.5 pb-3 border-b border-[#A8B99A]/20 text-xs font-semibold text-slate-700">
              <button
                onClick={() => scrollToSection('problem')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors"
              >
                The Problem
              </button>
              <button
                onClick={() => scrollToSection('solution')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors"
              >
                Our Solution
              </button>
              <button
                onClick={() => scrollToSection('portals')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors text-[#20543F] font-bold"
              >
                Login Portals
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors"
              >
                Product Features
              </button>
              <button
                onClick={() => scrollToSection('why-us')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors"
              >
                Why HostelFix
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#E9EDDA]/50 transition-colors"
              >
                How It Works
              </button>
            </nav>

            {isAuthenticated ? (
              <div className="p-3.5 rounded-2xl bg-[#E9EDDA]/50 border border-[#A8B99A]/40 flex items-center justify-between">
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
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                  Access Portal
                </p>

                {/* Student Login */}
                <Link
                  to="/student/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-semibold text-xs active:bg-[#E9EDDA] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shrink-0 border border-[#A8B99A]/30">
                      <Wrench className="w-4 h-4 text-[#20543F]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#173D30]">Resident Student Portal</div>
                      <div className="text-xs text-slate-600 font-medium">Student Google Sign In</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20543F]" />
                </Link>

                {/* Staff Login */}
                <Link
                  to="/staff/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-semibold text-xs active:bg-[#E9EDDA] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shrink-0 border border-[#A8B99A]/30">
                      <HardHat className="w-4 h-4 text-[#20543F]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#173D30]">Maintenance Staff Portal</div>
                      <div className="text-xs text-slate-600 font-medium">Staff Google Sign In</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20543F]" />
                </Link>

                {/* Warden Login */}
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-semibold text-xs active:bg-[#E9EDDA] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shrink-0 border border-[#A8B99A]/30">
                      <Shield className="w-4 h-4 text-[#20543F]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#173D30]">Warden Admin Center</div>
                      <div className="text-xs text-slate-600 font-medium">Warden ID & Pass Sign In</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20543F]" />
                </Link>
              </div>
            )}
          </div>
        )}
      </motion.header>

      {/* Primary Page Content Landmark */}
      <main id="main-content" className="flex-1 w-full min-w-0">
        {/* =========================================================================
            1. HERO SECTION – INTRODUCING HOSTELFIX
            ========================================================================= */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="scroll-reveal max-w-4xl mx-auto">
          {/* Logo Brand Accent */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#F9FBF6] p-2 shadow-glass border border-[#A7B88C]/40 hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="/hostelfix-icon.webp"
                srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w"
                sizes="(max-width: 640px) 64px, 80px"
                alt="HostelFix Logo"
                width="80"
                height="80"
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain select-none"
              />
            </div>
          </div>

          {/* Required Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#2A3F38] tracking-tight leading-[1.15]">
            Hostel Maintenance, <br />
            <span className="bg-gradient-to-r from-[#22503B] via-[#2A3F38] to-[#6A8A64] bg-clip-text text-transparent">
              Finally Under Control.
            </span>
          </h1>

          {/* Required Subheadline */}
          <p className="mt-5 sm:mt-7 text-sm sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A smarter way to report, track and resolve hostel maintenance issues. Bringing students, wardens and maintenance staff together on one transparent platform.
          </p>

          {/* CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <button
              onClick={() => scrollToSection('problem')}
              className="btn-action w-full sm:w-auto px-7 py-3.5 rounded-control text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-electric/25 hover:shadow-electric/40 transition-all cursor-pointer"
            >
              <span>Explore HostelFix</span>
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('portals')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-control text-sm font-bold bg-[#F9FBF6] text-[#2A3F38] hover:bg-[#E8EFD3] border border-[#A7B88C]/60 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-[#20543F]" />
            </button>
          </div>
        </div>

        {/* Realistic Product Dashboard Mockup Preview with Cinematic Scroll Entrance & Interactive Hover */}
        <div
          ref={showcaseRef}
          className="mt-12 sm:mt-16 max-w-5xl mx-auto relative"
        >
          {/* Main Dashboard Container with 900ms Fade-Up, 0.97 Scale Entrance & Soft Blue Glow Hover */}
          <div
            className={`dashboard-showcase-container relative rounded-2xl sm:rounded-3xl p-2 sm:p-3 bg-[#F9FBF6]/90 backdrop-blur-2xl border border-[#A7B88C]/40 shadow-2xl shadow-[#202E22]/15 overflow-hidden transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showcaseRevealed
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-[45px] scale-[0.97]'
              }`}
          >
            {/* Animated Subtle Frame Shine on Entrance */}
            {showcaseRevealed && <div className="animate-frame-shine" />}

            {/* macOS / SaaS Browser Chrome (Downward-to-normal entrance) */}
            <div
              className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 bg-[#E8EFD3]/80 rounded-t-xl sm:rounded-t-2xl border-b border-[#A7B88C]/25 text-xs text-[#2A3F38]/70 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100 ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400 inline-block transition-transform hover:scale-125 duration-150" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 inline-block transition-transform hover:scale-125 duration-150" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 inline-block transition-transform hover:scale-125 duration-150" />
              </div>
              <div className="px-3 sm:px-4 py-1 rounded-full bg-[#F9FBF6] border border-[#A7B88C]/40 text-[11px] sm:text-xs font-mono text-[#2A3F38] flex items-center gap-1.5 shadow-2xs max-w-xs truncate">
                <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">hostelfix.app/student/dashboard</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>

            {/* Dashboard Inner Canvas */}
            <div className="p-4 sm:p-7 bg-gradient-to-b from-[#F9FBF6] to-[#EBECDE]/60 rounded-b-xl sm:rounded-b-2xl text-left space-y-5">
              {/* Mockup Header (Student Profile Section with scale-in avatar & sequential fade-in) */}
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky/20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-200 ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-action text-white font-bold flex items-center justify-center text-sm shadow-md transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${showcaseRevealed ? 'scale-100' : 'scale-[0.85]'
                      }`}
                  >
                    NA
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-extrabold text-[#173D30] text-sm sm:text-base">
                        Naitik Anand
                      </p>
                      <span className="px-2 py-0.5 rounded-md bg-[#E9EDDA] text-[#20543F] text-xs font-bold border border-[#A8B99A]/40">
                        STUDENT
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Visvesvaraya Block • Room D-101</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-[#E9EDDA] text-[#173D30] font-semibold border border-[#A8B99A]/40 flex items-center gap-1.5 shadow-2xs">
                    <Activity className="w-3.5 h-3.5 text-[#00A878] animate-pulse" />
                    <span>Real-time Maintenance Tracking</span>
                  </span>
                </div>
              </div>

              {/* 4 Stat Cards Mini Grid (120ms Staggered Entrance, Animated Counters, 5px Lift on Hover) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Stat 01: Total Complaints */}
                <div
                  className={`dashboard-stat-card p-3 sm:p-4 rounded-xl bg-[#F9FBF6] border border-[#A7B88C]/35 shadow-2xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[250ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                  <p className="text-xs text-slate-700 font-semibold">Total Complaints</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#173D30] mt-1 tabular-nums">
                    {showcaseCounts.total}
                  </p>
                  <p className="text-xs text-[#00A878] font-semibold mt-0.5">Lifetime logged</p>
                </div>

                {/* Stat 02: Awaiting Review */}
                <div
                  className={`dashboard-stat-card p-3 sm:p-4 rounded-xl bg-[#F9FBF6] border border-[#A7B88C]/35 shadow-2xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[370ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                  <p className="text-xs text-slate-700 font-semibold">Awaiting Review</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">
                    {showcaseCounts.review}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">Warden triage queue</p>
                </div>

                {/* Stat 03: In Progress */}
                <div
                  className={`dashboard-stat-card p-3 sm:p-4 rounded-xl bg-[#F9FBF6] border border-[#A7B88C]/35 shadow-2xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[490ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                  <p className="text-xs text-slate-700 font-semibold">In Progress</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#20543F] mt-1 tabular-nums">
                    {showcaseCounts.progress}
                  </p>
                  <p className="text-xs text-[#173D30] font-semibold mt-0.5">Assigned to staff</p>
                </div>

                {/* Stat 04: Verified Resolved */}
                <div
                  className={`dashboard-stat-card p-3 sm:p-4 rounded-xl bg-[#F9FBF6] border border-[#A7B88C]/35 shadow-2xs transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[610ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                  <p className="text-xs text-slate-700 font-semibold">Verified Resolved</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#00A878] mt-1 tabular-nums">
                    {showcaseCounts.resolved}
                  </p>
                  <p className="text-xs text-[#00A878] font-semibold mt-0.5">Photo proof signed</p>
                </div>
              </div>

              {/* Live Ticket Card Inside Mockup (Smooth Fade-Up & 4px Hover Lift) */}
              <div
                className={`dashboard-ticket-card p-3.5 sm:p-4 rounded-2xl bg-[#F9FBF6] border border-[#A7B88C]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[550ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shrink-0 mt-0.5 border border-[#A8B99A]/40">
                    <Wrench className="w-5 h-5 text-[#20543F]" />
                  </div>
                  <div>
                    {/* ID and priority badge (appear first) */}
                    <div
                      className={`flex flex-wrap items-center gap-2 transition-all duration-500 delay-[650ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}
                    >
                      <span className="font-mono text-xs font-bold text-[#20543F]">HF-2026-0048</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold">
                        High Priority
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E9EDDA] border border-[#A8B99A]/40 text-[#20543F] text-xs font-bold">
                        Plumbing & Washroom
                      </span>
                    </div>

                    {/* Title and technician details (follow smoothly) */}
                    <div
                      className={`transition-all duration-500 delay-[750ms] ${showcaseRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                        }`}
                    >
                      <p className="font-heading font-bold text-navy text-sm sm:text-base mt-1">
                        Water Leakage in 3rd Floor Restroom
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Technician assigned: <strong className="text-navy">Ramesh Kumar (Master Plumber)</strong> • Visvesvaraya Block
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge with Scale-In Animation */}
                <div
                  className={`flex items-center gap-2 self-start md:self-center shrink-0 transition-all duration-500 delay-[850ms] ${showcaseRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
                >
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 drop-shadow-xs" />
                    <span>In Progress • Photo Attached</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Glassmorphic Depth Badge 1: Bottom-Left (Before & After Photo Proof with independent upward entrance & continuous slow float) */}
          <div
            className={`dashboard-floating-badge animate-floating-badge-1 hidden sm:flex absolute -bottom-5 -left-4 p-3 rounded-2xl bg-[#F9FBF6]/95 backdrop-blur-xl border border-[#A7B88C]/50 shadow-xl shadow-[#202E22]/10 items-center gap-2.5 text-xs font-bold text-[#2A3F38] transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[750ms] ${showcaseRevealed ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : 'opacity-0 -translate-x-3 translate-y-4 scale-90'
              }`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#00A878] text-white flex items-center justify-center shadow-md">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="leading-tight">Before & After Photo Proof</p>
              <p className="text-xs text-slate-600 font-medium">Warden verified resolution</p>
            </div>
          </div>

          {/* Floating Glassmorphic Depth Badge 2: Top-Right (First Response with independent top-right entrance & continuous slow float) */}
          <div
            className={`dashboard-floating-badge animate-floating-badge-2 hidden sm:flex absolute -top-4 -right-4 p-3 rounded-2xl bg-[#F9FBF6]/95 backdrop-blur-xl border border-[#A7B88C]/50 shadow-xl shadow-[#202E22]/10 items-center gap-2.5 text-xs font-bold text-[#2A3F38] transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[650ms] ${showcaseRevealed ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : 'opacity-0 translate-x-4 -translate-y-3 scale-90'
              }`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#20543F] text-white flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="leading-tight">&lt; 2h First Response</p>
              <p className="text-xs text-slate-600 font-medium">Fast-tracked priority triage</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. THE PROBLEM – SCROLL-DRIVEN 3D CAROUSEL EXPERIENCE
          ========================================================================= */}
      <ProblemCarousel3D />

      {/* =========================================================================
          3. OUR SOLUTION – INTRODUCING HOSTELFIX
          ========================================================================= */}
      <section id="solution" className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-navy tracking-tight">
            Meet HostelFix. One Platform. Complete Accountability.
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 leading-relaxed">
            HostelFix connects students, wardens and maintenance staff through a centralized complaint and maintenance management system.
          </p>

          {/* Three Visual Role Indicators with Connecting Lines */}
          <div className="mt-8 sm:mt-10 p-4 sm:p-6 rounded-2xl bg-white/80 border border-[#A8B99A]/40 shadow-sm flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-bold text-xs sm:text-sm shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shadow-xs border border-[#A8B99A]/30">
                <User className="w-4 h-4 text-[#20543F]" />
              </div>
              <span>STUDENTS</span>
            </div>

            <div className="flex items-center text-[#20543F]">
              <span className="hidden md:inline font-bold text-xs uppercase tracking-wider text-slate-600 px-2">Reports Issue</span>
              <ArrowRight className="w-4 h-4 text-[#20543F]" />
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-bold text-xs sm:text-sm shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shadow-xs border border-[#A8B99A]/30">
                <Shield className="w-4 h-4 text-[#20543F]" />
              </div>
              <span>WARDENS</span>
            </div>

            <div className="flex items-center text-[#20543F]">
              <span className="hidden md:inline font-bold text-xs uppercase tracking-wider text-slate-600 px-2">Assigns Task</span>
              <ArrowRight className="w-4 h-4 text-[#20543F]" />
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F7F8F0] border border-[#A8B99A]/40 text-[#173D30] font-bold text-xs sm:text-sm shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#E9EDDA] text-[#20543F] flex items-center justify-center shadow-xs border border-[#A8B99A]/30">
                <HardHat className="w-4 h-4 text-[#20543F]" />
              </div>
              <span>MAINTENANCE STAFF</span>
            </div>
          </div>
        </div>

        {/* How the platform works: 6 Structured Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="scroll-reveal-scale delay-100">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <FileText className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  1. Student Submission
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Students submit complaints with descriptions, categories and photographs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Instant reference ID generation</span>
              </div>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-200">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <UserCheck className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  2. Warden Triage
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Wardens review complaints and assign tasks.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Smart trade specialization matching</span>
              </div>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-300">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <ClipboardList className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  3. Staff Task Execution
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Staff manage assigned maintenance work.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Real-time status updates from field</span>
              </div>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-400">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <Camera className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  4. Proof Upload
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Staff upload completion photographs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Mandatory visual sign-off evidence</span>
              </div>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-500">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <CheckCircle2 className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  5. Warden Inspection
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Wardens inspect proof and approve resolutions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Only verified repairs marked resolved</span>
              </div>
            </div>
          </div>

          <div className="scroll-reveal-scale delay-600">
            <div className="portal-card p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <BarChart3 className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-navy">
                  6. Analytics & Insights
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Analytics help identify recurring maintenance issues.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#A8B99A]/20 text-[11px] font-semibold text-[#173D30] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Block-by-block trend identification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. LOGIN PORTALS – ACCESS HOSTELFIX
          ========================================================================= */}
      <section id="portals" className="relative z-10 py-16 sm:py-24 bg-[#EBECDE]/60 border-y border-[#A7B88C]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-navy tracking-tight">
              One Platform for Everyone.
            </h2>
            <p className="mt-3 text-xs sm:text-base text-slate-600">
              Choose your portal and get started.
            </p>
          </div>

          {/* 3 Unified Portal Cards with Identical Dimensions & Bottom Button Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* CARD 1: Resident Student Portal */}
            <div className="scroll-reveal-scale delay-100 h-full flex flex-col">
              <div className="portal-card p-6 text-left flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40 shrink-0 group-hover:scale-105 transition-transform">
                    <Wrench className="w-6 h-6 text-[#20543F]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold text-navy tracking-tight leading-snug">
                    Resident Student Portal
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Sign in with Google, report facility complaints, track maintenance milestones, and rate resolution quality.
                  </p>
                </div>
                <div className="mt-6 pt-1">
                  <Link
                    to={isAuthenticated && user?.role === 'student' ? '/student/dashboard' : '/student/login'}
                    className="btn-action w-full flex items-center justify-center gap-2 py-3 px-4 rounded-control text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg cursor-pointer transition-all"
                  >
                    <span>{isAuthenticated && user?.role === 'student' ? 'Open Student Dashboard' : 'Student Google Sign In'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 2: Maintenance Staff Portal */}
            <div className="scroll-reveal-scale delay-250 h-full flex flex-col">
              <div className="portal-card p-6 text-left flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40 shrink-0 group-hover:scale-105 transition-transform">
                    <HardHat className="w-6 h-6 text-[#20543F]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold text-navy tracking-tight leading-snug">
                    Maintenance Staff Portal
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Authorized field technicians sign in with approved Google accounts, manage assigned tasks, and submit photo proof for sign-off.
                  </p>
                </div>
                <div className="mt-6 pt-1">
                  <Link
                    to={isAuthenticated && user?.role === 'staff' ? '/staff/dashboard' : '/staff/login'}
                    className="btn-action w-full flex items-center justify-center gap-2 py-3 px-4 rounded-control text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg cursor-pointer transition-all"
                  >
                    <span>{isAuthenticated && user?.role === 'staff' ? 'Open Staff Dashboard' : 'Staff Google Sign In'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 3: Warden Admin Center */}
            <div className="scroll-reveal-scale delay-400 h-full flex flex-col">
              <div className="portal-card p-6 text-left flex flex-col justify-between h-full group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40 shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="w-6 h-6 text-[#20543F]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold text-navy tracking-tight leading-snug">
                    Warden Admin Center
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Assign tasks, inspect before/after photo proof, approve resolutions, register staff, and monitor MongoDB analytics.
                  </p>
                </div>
                <div className="mt-6 pt-1">
                  <Link
                    to={isAuthenticated && user?.role === 'admin' ? '/admin/dashboard' : '/admin/login'}
                    className="btn-action w-full flex items-center justify-center gap-2 py-3 px-4 rounded-control text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg cursor-pointer transition-all"
                  >
                    <span>{isAuthenticated && user?.role === 'admin' ? 'Open Warden Admin Center' : 'Warden ID & Pass Sign In'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PRODUCT FEATURES – WHAT HOSTELFIX PROVIDES
          ========================================================================= */}
      <section id="features" className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-navy tracking-tight">
            Everything You Need to Manage Hostel Maintenance.
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600">
            A complete suite of purpose-built features engineered directly for Indian campus dormitories and residential blocks.
          </p>
        </div>

        {/* 8 Required Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {/* Feature 01 */}
          <div className="scroll-reveal-scale delay-100">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <FileText className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  01. Smart Complaint Reporting
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Submit complaints with category, description and photographs.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="scroll-reveal-scale delay-150">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <Camera className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  02. Photo-Based Documentation
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Attach images to help explain maintenance problems.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="scroll-reveal-scale delay-200">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <Activity className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  03. Complaint Status Tracking
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Monitor progress from submission to resolution.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 04 */}
          <div className="scroll-reveal-scale delay-250">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <UserCheck className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  04. Warden Task Assignment
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Assign complaints to appropriate maintenance staff.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 05 */}
          <div className="scroll-reveal-scale delay-300">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <ClipboardList className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  05. Staff Task Management
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Allow staff to view and manage their assigned work.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 06 */}
          <div className="scroll-reveal-scale delay-350">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <CheckCircle2 className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  06. Before/After Photo Verification
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Staff upload completion proof for warden inspection.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 07 */}
          <div className="scroll-reveal-scale delay-400">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <BarChart3 className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  07. Resolution Analytics
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Monitor complaint statistics and resolution performance.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 08 */}
          <div className="scroll-reveal-scale delay-450">
            <div className="portal-card p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#E9EDDA] text-[#20543F] flex items-center justify-center mb-4 shadow-sm border border-[#A8B99A]/40">
                  <Repeat className="w-5 h-5 text-[#20543F]" />
                </div>
                <h3 className="text-base font-heading font-bold text-navy">
                  08. Recurring Issue Identification
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Identify frequently reported issues across hostel blocks and categories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. WHY HOSTELFIX – WHAT MAKES US DIFFERENT
          ========================================================================= */}
      <section id="why-us" className="relative z-10 py-16 sm:py-24 bg-[#E8EFD3]/80 border-y border-[#A7B88C]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-navy tracking-tight">
              Not Just Complaint Registration. Complete Accountability.
            </h2>
            <p className="mt-3 text-xs sm:text-base text-slate-600">
              Compare traditional hostel maintenance procedures with the unified digital standard of HostelFix.
            </p>
          </div>

          {/* Side-by-Side Comparison Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Traditional Method Column */}
            <div className="scroll-reveal-scale delay-100">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-rose-200/80 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 mb-5 border-b border-rose-100">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                        Traditional Hostel Maintenance
                      </h3>
                      <p className="text-xs text-rose-700 font-semibold">Paper-based & unverified</p>
                    </div>
                  </div>

                  <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Manual complaint reporting.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Unclear complaint progress.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Verbal task assignments.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>No standardized visual verification.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Scattered maintenance records.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Limited performance insights.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-rose-100 text-xs text-slate-600 font-medium italic">
                  High resident frustration, unverified closures, recurring breakdowns.
                </div>
              </div>
            </div>

            {/* HostelFix Method Column */}
            <div className="scroll-reveal-scale delay-200">
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#EBECDE]/80 to-[#F9FBF6] border-2 border-[#22503B]/40 shadow-lg shadow-[#22503B]/10 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#20543F] text-white text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
                  Modern SaaS
                </div>
                <div>
                  <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#A8B99A]/30">
                    <div className="w-10 h-10 rounded-xl bg-[#00A878] text-white flex items-center justify-center font-bold shadow-md shadow-[#00A878]/20">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-base sm:text-lg text-navy">
                        HostelFix Digital Platform
                      </h3>
                      <p className="text-xs text-[#173D30] font-semibold">Transparent, verified & audited</p>
                    </div>
                  </div>

                  <ul className="space-y-4 text-xs sm:text-sm text-navy font-medium">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Digital complaint reporting.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Transparent status tracking.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Structured staff assignments.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Before/after photo proof.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Centralized complaint history.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                      <span>Maintenance analytics and insights.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#A8B99A]/30 text-[11px] text-[#173D30] font-semibold">
                  Guaranteed student satisfaction, verifiable trade work, executive visibility.
                </div>
              </div>
            </div>
          </div>

          {/* Highlighted Main Differentiator Callout Box */}
          <div className="scroll-reveal delay-300 mt-10 max-w-4xl mx-auto">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#20543F]/10 via-[#2E6F54]/10 to-[#A8B99A]/20 border border-[#20543F]/30 text-center shadow-sm">
              <p className="text-sm sm:text-lg md:text-xl font-heading font-bold text-navy leading-relaxed">
                "HostelFix connects the entire maintenance lifecycle — from student complaint to verified resolution — in one platform."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. HOW IT WORKS – COMPLETE WORKFLOW
          ========================================================================= */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="scroll-reveal text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-navy tracking-tight">
            From Complaint to Resolution.
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600">
            A clear, 5-stage sequential process guaranteeing every ticket is logged, triaged, completed and verified.
          </p>
        </div>

        {/* 5-Step Connected Workflow (Horizontal on Desktop, Vertical on Mobile) */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4 relative">
            {/* Step 01 */}
            <div className="scroll-reveal-scale delay-100 relative">
              <div className="portal-card p-5 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-[#E9EDDA] text-[#20543F]">
                      01
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      STUDENT
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    STEP 01 – REPORT
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Student submits a complaint with category, description and photos.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-[#A8B99A]/20 flex items-center gap-1.5 text-xs text-[#173D30] font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#20543F]" />
                  <span>Ticket Logged</span>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="scroll-reveal-scale delay-200 relative">
              <div className="portal-card p-5 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-[#E9EDDA] text-[#20543F]">
                      02
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      WARDEN
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    STEP 02 – REVIEW
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Warden reviews the reported issue.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-[#A8B99A]/20 flex items-center gap-1.5 text-xs text-[#173D30] font-semibold">
                  <Eye className="w-3.5 h-3.5 text-[#20543F]" />
                  <span>Priority Assessed</span>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="scroll-reveal-scale delay-300 relative">
              <div className="portal-card p-5 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-[#E9EDDA] text-[#20543F]">
                      03
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      WARDEN
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    STEP 03 – ASSIGN
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Warden assigns the maintenance task to staff.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-[#A8B99A]/20 flex items-center gap-1.5 text-xs text-[#173D30] font-semibold">
                  <UserPlus className="w-3.5 h-3.5 text-[#20543F]" />
                  <span>Staff Assigned</span>
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="scroll-reveal-scale delay-400 relative">
              <div className="portal-card p-5 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-[#E9EDDA] text-[#20543F]">
                      04
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      STAFF
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    STEP 04 – RESOLVE
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Staff completes the work and uploads photographic proof.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-[#A8B99A]/20 flex items-center gap-1.5 text-xs text-[#173D30] font-semibold">
                  <Camera className="w-3.5 h-3.5 text-[#20543F]" />
                  <span>Proof Uploaded</span>
                </div>
              </div>
            </div>

            {/* Step 05 */}
            <div className="scroll-reveal-scale delay-500 relative">
              <div className="portal-card p-5 h-full flex flex-col justify-between text-left border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg bg-[#00A878]/15 text-[#00A878]">
                      05
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00A878]">
                      WARDEN
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    STEP 05 – VERIFY
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    Warden reviews the submitted proof and approves the resolution.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-emerald-100 flex items-center gap-1.5 text-xs text-[#173D30] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                  <span>Ticket Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION
          ========================================================================= */}
      <section id="cta" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="scroll-reveal rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-[#202E22]/30 bg-gradient-to-br from-[#202E22] via-[#2A3F38] to-[#22503B]">
            {/* Ambient decorative glowing orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#C3DC9B]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#A7B88C]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <img
                  src="/hostelfix-icon-64.webp"
                  srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w"
                  sizes="56px"
                  alt="HostelFix"
                  width="56"
                  height="56"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain select-none"
                />
              </div>

              {/* Required Headline */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight leading-tight">
                A Better Hostel Starts With Better Management.
              </h2>

              {/* Required Description */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base text-[#DADFB9] leading-relaxed">
                Bring transparency, accountability and smarter maintenance management to your hostel with HostelFix.
              </p>

              {/* Primary CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => scrollToSection('portals')}
                  className="w-full sm:w-auto px-8 py-4 rounded-control text-sm font-bold bg-[#C3DC9B] text-[#202E22] hover:bg-[#F9FBF6] hover:text-[#202E22] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] duration-200"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-[#202E22]" />
                </button>
              </div>

              {/* Required Secondary Text */}
              <p className="mt-5 text-xs text-[#C1CEA6] font-medium">
                One platform. Better hostel management.
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* =========================================================================
          9. FOOTER
          ========================================================================= */}
      <footer className="scroll-reveal mt-auto shrink-0 border-t border-[#A7B88C]/30 bg-[#EBECDE]/90 backdrop-blur-md py-10 text-xs text-[#6A8A64] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-6 pb-8 border-b border-sky/20">
            {/* Brand & Tagline */}
            <div className="flex items-center gap-3 text-center">
              <img
                src="/hostelfix-icon-64.webp"
                srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w"
                sizes="32px"
                alt="HostelFix Logo"
                width="32"
                height="32"
                loading="lazy"
                decoding="async"
                className="w-8 h-8 object-contain select-none"
              />
              <div>
                <span className="font-heading font-extrabold text-base text-[#2A3F38]">
                  Hostel<span className="text-[#22503B] relative inline-block">Fix<svg className="absolute -bottom-0.5 left-0 w-full h-1 overflow-visible" viewBox="0 0 48 6" fill="none"><path d="M 2 2 C 14 5, 34 5, 46 2 C 34 3.5, 14 3.5, 2 2 Z" fill="#C3DC9B" /></svg></span>
                </span>
                <p className="text-[11px] text-[#6A8A64] font-medium">
                  Complaint • Maintenance • Resolution
                </p>
              </div>
            </div>

            {/* Section Quick Links */}
            <nav className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => scrollToSection('problem')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                The Problem
              </button>
              <button
                onClick={() => scrollToSection('solution')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                Our Solution
              </button>
              <button
                onClick={() => scrollToSection('portals')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                Login Portals
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                Product Features
              </button>
              <button
                onClick={() => scrollToSection('why-us')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                Why HostelFix
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-[#20543F] transition-colors cursor-pointer"
              >
                Workflow
              </button>
            </nav>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex items-center justify-center text-center text-xs text-slate-600 font-medium">
            <p>© {new Date().getFullYear()} HostelFix. Smart Hostel Complaint & Maintenance Management System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
