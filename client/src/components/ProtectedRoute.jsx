import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice-pale">
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-electric animate-spin" />
          <div>
            <p className="font-semibold text-navy">Securing session...</p>
            <p className="text-xs text-secondary">Verifying credentials with HostelFix</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If attempting to access admin route, redirect to admin login, otherwise student login
    const targetLogin = location.pathname.startsWith('/admin') ? '/admin/login' : '/student/login';
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to respective dashboard if authorized under a different role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
