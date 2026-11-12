import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PageTransition } from '../components/common/LoadingSpinner';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/student/notifications');
        if (res.data && res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/complaints', label: 'My Complaints', icon: ClipboardList },
    { to: '/student/complaints/new', label: 'Raise Issue', icon: PlusCircle, isAction: true },
    { to: '/student/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#EBECDE] text-[#2A3F38] relative font-sans w-full">
      {/* Skip to Main Content Link for accessibility */}
      <a
        href="#student-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-electric focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none text-xs font-bold"
      >
        Skip to main content
      </a>

      {/* Ambient background glows - contained to prevent layout expansion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow" />
        <div className="ambient-glow-bottom" />
      </div>

      {/* Top Frosted Glass Navbar */}
      <header className="sticky top-0 z-40 bg-[#F9FBF6]/90 backdrop-blur-xl border-b border-[#A7B88C]/30 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand Logo & Tagline */}
            <Link to="/student/dashboard" className="flex items-center gap-3 group">
              <img
                src="/logo-icon.webp"
                srcSet="/logo-icon-64.webp 64w, /logo-icon-128.webp 128w"
                sizes="40px"
                alt="HostelFix Logo"
                width="40"
                height="40"
                loading="eager"
                decoding="async"
                className="w-10 h-10 object-contain drop-shadow-md rounded-xl group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-xl text-navy tracking-tight">
                    Hostel<span className="text-electric">Fix</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-ice text-royal border border-sky/40">
                    Student
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium hidden sm:block">
                  Your Hostel. Your Voice. Better Living.
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                if (item.isAction) {
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="ml-2 btn-action flex items-center gap-1.5 px-3.5 py-2 rounded-control text-xs font-semibold shadow-md"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3 py-2 rounded-control text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-ice text-royal shadow-sm border border-sky/50'
                          : 'text-slate-600 hover:text-navy hover:bg-white/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-electric text-white text-[10px] font-bold rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile Menu */}
            <div className="hidden md:flex items-center gap-3 relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-white/80 transition-all border border-transparent hover:border-ice"
              >
                <UserAvatar
                  src={user?.profilePhoto}
                  name={user?.name}
                  size="sm"
                />
                <div className="text-left text-xs">
                  <div className="font-semibold text-navy leading-tight">{user?.name}</div>
                  <div className="text-xs text-slate-600 font-medium">
                    {user?.hostelBlock ? `${user.hostelBlock} • ${user.roomNumber || ''}` : 'Complete Profile'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-14 w-52 glass-card p-2 shadow-xl border border-white z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-ice/60 mb-1">
                    <p className="text-xs font-semibold text-navy truncate">{user?.name}</p>
                    <p className="text-xs text-slate-600 font-medium truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/student/profile"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-ice/50 rounded-lg"
                  >
                    <User className="w-4 h-4 text-royal" />
                    <span>Edit Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
              <NavLink
                to="/student/notifications"
                className="relative p-2.5 rounded-xl text-slate-600 hover:bg-white/80 touch-target flex items-center justify-center"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-electric rounded-full animate-pulse" />
                )}
              </NavLink>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                className="p-2.5 rounded-xl text-navy hover:bg-white/80 touch-target flex items-center justify-center"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 top-[73px] bg-black/40 backdrop-blur-sm z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="md:hidden relative z-40 border-t border-ice bg-white/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-73px)] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-ice/40 rounded-2xl mb-3">
                <img
                  src={
                    user?.profilePhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  }
                  alt={user?.name || 'User avatar'}
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full object-cover border border-sky shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-navy truncate">{user?.name}</p>
                  <p className="text-xs text-slate-600 font-medium truncate">
                    {user?.hostelBlock ? `${user.hostelBlock} • ${user.roomNumber || ''}` : 'Student'}
                  </p>
                </div>
              </div>

              <nav aria-label="Mobile navigation" className="space-y-2">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold touch-target ${
                          isActive
                            ? 'bg-gradient-action text-white shadow-md shadow-electric/25'
                            : 'text-slate-700 hover:bg-ice/50 active:bg-ice/70'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-electric text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 mt-2 touch-target"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main id="student-main-content" className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 relative z-10 min-w-0">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Footer */}
      <footer className="mt-auto shrink-0 py-6 border-t border-ice/60 bg-white/40 text-center text-xs text-slate-600 font-medium relative z-10">
        <p>© 2026 HostelFix. Smart Hostel Complaint & Maintenance Management System.</p>
        <p className="mt-1 text-xs text-slate-600 font-medium">Tagline: "Your Hostel. Your Voice. Better Living."</p>
      </footer>
    </div>
  );
};

export default StudentLayout;
