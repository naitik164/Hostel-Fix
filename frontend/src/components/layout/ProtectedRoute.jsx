import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBECDE] text-[#2A3F38] relative overflow-hidden font-sans">
        <div className="ambient-glow" />
        <div className="ambient-glow-bottom" />
        <main className="glass-card p-8 sm:p-10 max-w-sm w-full mx-4 flex flex-col items-center text-center shadow-glass-hover border-[#A8B99A]/30 relative z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-action p-2.5 flex items-center justify-center text-white shadow-lg shadow-[#20543F]/25 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep pointer-events-none" />
            <img
              src="/hostelfix-icon.webp"
              srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w"
              sizes="44px"
              alt="HostelFix"
              width="44"
              height="44"
              loading="eager"
              decoding="async"
              className="w-11 h-11 object-contain drop-shadow select-none"
            />
          </div>
          <h1 className="text-lg font-bold text-navy font-heading">Securing Session</h1>
          <p className="text-xs text-slate-600 font-medium mt-1">Verifying encrypted credentials with HostelFix...</p>
          <div className="w-full h-1.5 bg-[#A8B99A]/20 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-[#20543F] via-[#00A878] to-[#A8B99A] rounded-full animate-shimmer-sweep w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    let targetLogin = '/student/login';
    if (location.pathname.startsWith('/admin')) {
      targetLogin = '/admin/login';
    } else if (location.pathname.startsWith('/staff')) {
      targetLogin = '/staff/login';
    }
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to respective dashboard if authorized under a different role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  // Mandatory Student Onboarding Access Control
  if (user && user.role === 'student') {
    const isProfileComplete = Boolean(user.profileCompleted || user.isProfileComplete);
    const isOnboardingRoute = location.pathname === '/student/onboarding';

    if (!isProfileComplete && !isOnboardingRoute) {
      return <Navigate to="/student/onboarding" replace />;
    }

    if (isProfileComplete && isOnboardingRoute) {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
