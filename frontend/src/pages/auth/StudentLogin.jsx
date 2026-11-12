import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../../components/common';
import { ArrowLeft, Shield, AlertCircle, Sparkles } from 'lucide-react';

const StudentLogin = () => {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from?.pathname;

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        const isComplete = Boolean(user.profileCompleted || user.isProfileComplete);
        if (!isComplete) {
          navigate('/student/onboarding', { replace: true });
        } else {
          const dest = fromPath && !fromPath.startsWith('/admin') && !fromPath.startsWith('/staff') && fromPath !== '/student/onboarding'
            ? fromPath
            : '/student/dashboard';
          navigate(dest, { replace: true });
        }
      }
    }
  }, [user, authLoading, navigate, fromPath]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const authRes = await loginWithGoogle(credentialResponse.credential);
      const isComplete = Boolean(authRes?.user?.profileCompleted || authRes?.user?.isProfileComplete);
      if (!isComplete) {
        navigate('/student/onboarding', { replace: true });
      } else {
        const dest = fromPath && !fromPath.startsWith('/admin') && !fromPath.startsWith('/staff') && fromPath !== '/student/onboarding'
          ? fromPath
          : '/student/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed to initialize.');
  };

  const loginContent = (
    <div className="min-h-[100dvh] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gradient-dark font-sans">
      {/* Layered liquid-glass atmospheric shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#20543F]/40 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#00A878]/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#A8B99A]/20 rounded-full filter blur-2xl pointer-events-none" />

      {/* Main Centered Frosted-Glass Card Landmark */}
      <main className="relative z-10 w-full max-w-md my-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ice hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#E9EDDA]" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-card p-5 sm:p-8 lg:p-10 shadow-glass-dark border border-white/80">
          {/* Logo & Header */}
          <header className="text-center">
            <img
              src="/logo-icon.webp"
              srcSet="/logo-icon-64.webp 64w, /logo-icon-128.webp 128w"
              sizes="64px"
              alt="HostelFix Logo"
              width="64"
              height="64"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-16 h-16 mx-auto mb-4 object-contain filter drop-shadow-md"
            />
            <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight">
              Student Sign In
            </h1>
            <p className="mt-1 text-xs text-[#6A8A64] font-medium">
              Complaint • Maintenance • Resolution
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Section */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col items-center justify-center">
              {googleClientId ? (
                <div className="w-full flex justify-center min-h-[44px]">
                  <GoogleSignInButton
                    clientId={googleClientId}
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    shape="pill"
                    theme="filled_blue"
                    size="large"
                    text="continue_with"
                  />
                </div>
              ) : (
                <div className="w-full text-center p-3.5 bg-[#E8EFD3]/60 border border-[#A7B88C]/40 rounded-control text-xs text-[#20543F]">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#20543F]" />
                    <span>Google OAuth GIS Ready</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Connect real Google Client ID in <code className="bg-white/80 px-1 py-0.5 rounded">.env</code> to enable live Google Sign-In.
                  </p>
                </div>
              )}
            </div>

            {/* Secure Authentication Information */}
            <div className="mt-6 p-4 rounded-control bg-[#E8EFD3]/50 border border-[#A7B88C]/35 text-center">
              <p className="text-xs font-semibold text-navy flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#20543F]" />
                <span>Verified Google Student Sign-In</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Sign in with your verified institutional Google account to submit complaints, upload photo evidence, and track real-time resolution updates.
              </p>
            </div>
          </div>

          {/* Footer note */}
          <footer className="mt-8 pt-6 border-t border-ice text-center text-xs text-slate-500">
            <span>Are you a Hostel Warden or Administrator? </span>
            <Link to="/admin/login" className="font-bold text-[#20543F] hover:underline">
              Warden Portal
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );

  return loginContent;
};

export default StudentLogin;
