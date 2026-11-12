import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PageTransition } from '../components/common/LoadingSpinner';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, verifRes] = await Promise.allSettled([
          api.get('/admin/notifications'),
          api.get('/admin/verifications'),
        ]);
        if (notifRes.status === 'fulfilled' && notifRes.value.data?.success) {
          setUnreadCount(notifRes.value.data.unreadCount || 0);
        }
        if (verifRes.status === 'fulfilled' && verifRes.value.data?.success) {
          setPendingVerificationsCount(verifRes.value.data.count || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
    {
      to: '/admin/verifications',
      label: 'Pending Verification',
      icon: CheckCircle2,
      badge: pendingVerificationsCount,
    },
    { to: '/admin/staff', label: 'Staff & Assignments', icon: Users },
    { to: '/admin/blocks', label: 'Hostel Blocks', icon: Building2 },
    { to: '/admin/students', label: 'Student Directory', icon: GraduationCap },
    { to: '/admin/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#EBECDE] text-[#2A3F38] relative font-sans w-full">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-electric focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Dark Navy Liquid Glass Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 glass-dark-panel text-white p-5 sticky top-0 h-screen overflow-y-auto z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 pb-6 border-b border-sky/20">
          <img
            src="/logo-icon.webp"
            srcSet="/logo-icon-64.webp 64w, /logo-icon-128.webp 128w"
            sizes="44px"
            alt="HostelFix Logo"
            width="44"
            height="44"
            loading="eager"
            decoding="async"
            className="w-11 h-11 object-contain drop-shadow-md rounded-2xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                Hostel<span className="text-[#C3DC9B] relative inline-block">Fix<svg className="absolute -bottom-0.5 left-0 w-full h-1 overflow-visible" viewBox="0 0 48 6" fill="none"><path d="M 2 2 C 14 5, 34 5, 46 2 C 34 3.5, 14 3.5, 2 2 Z" fill="#C3DC9B" /></svg></span>
              </span>
            </div>
            <span className="text-[10px] tracking-wider uppercase font-bold text-[#E9EDDA] px-2 py-0.5 rounded-full bg-navy-900/60 border border-[#A8B99A]/30">
              Warden Administration
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-6 space-y-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A8B99A]/80 mb-2">
            Main Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-control text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#C3DC9B] text-[#202E22] shadow-sm font-bold'
                      : 'text-slate-200/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-colors" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Warden Profile & Logout */}
        <div className="pt-4 border-t border-sky/20 space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-900/70 border border-sky/20">
            <div className="w-9 h-9 rounded-full bg-[#20543F] border border-[#A8B99A]/50 flex items-center justify-center font-bold text-sm text-[#F7F8F0]">
              {user?.name ? user.name.charAt(0) : 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-[#A8B99A]/80 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-control text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-400/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Warden Session</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar for Warden */}
      <header className="md:hidden flex items-center justify-between p-3.5 sm:p-4 bg-navy text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo-icon-64.webp"
            srcSet="/logo-icon-64.webp 64w, /logo-icon-128.webp 128w"
            sizes="32px"
            alt="HostelFix Logo"
            width="32"
            height="32"
            loading="eager"
            decoding="async"
            className="w-8 h-8 object-contain drop-shadow-md rounded-xl shrink-0"
          />
          <div>
            <span className="font-heading font-extrabold text-base tracking-tight text-white">
              Hostel<span className="text-[#C3DC9B]">Fix</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold text-[#E9EDDA] px-1.5 py-0.5 rounded bg-[#20543F]">
              Warden
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <NavLink
            to="/admin/notifications"
            className="p-2 text-[#A8B99A] relative touch-target flex items-center justify-center"
            aria-label="Warden notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </NavLink>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close Warden Menu' : 'Open Warden Menu'}
            className="p-2 text-white hover:bg-white/10 rounded-lg touch-target flex items-center justify-center"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 max-w-[85vw] glass-dark-panel p-5 flex flex-col h-full overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-sky/20">
              <span className="font-heading font-bold text-white text-lg">Warden Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-300 hover:text-white p-1 touch-target flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold touch-target ${
                        isActive ? 'bg-[#C3DC9B] text-[#202E22] font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 active:bg-white/15'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/20 active:bg-rose-500/30 mt-auto touch-target"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main id="admin-main-content" className="flex-1 flex flex-col p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <footer className="mt-auto shrink-0 py-4 px-4 border-t border-sky/20 bg-white/40 text-center text-xs text-slate-600 font-medium">
          <p>© 2026 HostelFix — Warden Control & Operational Command Center</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
