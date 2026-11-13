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
    <div
      className="min-h-[100dvh] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, #E9EDDA 0%, #F7F8F0 45%, #DCE6D5 100%)',
      }}
    >
      {/* Subtle organic ambient gradients & forest-green lighting for depth */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#20543F]/8 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full bg-[#00A878]/8 filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-[#A8B99A]/20 filter blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-[#C3DC9B]/15 filter blur-[80px] pointer-events-none" />

      {/* Main Centered Frosted-Glass Card Landmark */}
      <main className="relative z-10 w-full max-w-md my-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#20543F] hover:text-[#173D30] mb-5 transition-all group"
        >
          <div className="w-7 h-7 rounded-full bg-[#E9EDDA] border border-[#A8B99A]/40 flex items-center justify-center group-hover:bg-[#E9EDDA]/90 group-hover:-translate-x-0.5 transition-all shadow-xs">
            <ArrowLeft className="w-3.5 h-3.5 text-[#20543F]" />
          </div>
          <span>Back to Home</span>
        </Link>

        {/* Soft cream/off-white glassmorphic card */}
        <div className="bg-[#F7F8F0]/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-[28px] sm:rounded-[32px] border border-[#A8B99A]/45 shadow-[0_20px_50px_rgba(23,61,48,0.08)] hover:shadow-[0_25px_60px_rgba(23,61,48,0.12)] transition-all duration-300">
          {/* Logo & Header */}
          <header className="text-center">
            <img
              src="/hostelfix-icon.webp"
              srcSet="/hostelfix-icon-64.webp 64w, /hostelfix-icon-128.webp 128w, /hostelfix-icon-256.webp 256w"
              sizes="64px"
              alt="HostelFix Logo"
              width="64"
              height="64"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-16 h-16 mx-auto mb-4 object-contain filter drop-shadow-md select-none"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173D30] font-heading tracking-tight">
              Student Sign In
            </h1>
            <p className="mt-1.5 text-xs text-[#526D60] font-medium tracking-wide">
              Complaint • Maintenance • Resolution
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-6 p-3.5 rounded-2xl bg-[#E9EDDA]/60 border border-[#A8B99A]/40 flex items-center justify-center gap-3 animate-in fade-in">
              <div className="w-4 h-4 border-2 border-[#20543F] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#20543F]">Authenticating with Google...</span>
            </div>
          )}

          {/* Google OAuth Section */}
          <div className="mt-7 space-y-4">
            <div className="flex flex-col items-center justify-center">
              {googleClientId ? (
                <div className="w-full flex justify-center min-h-[44px]">
                  <div className="inline-flex items-center justify-center p-[2px] rounded-full bg-white border border-[#A8B99A]/50 shadow-xs hover:shadow-md hover:border-[#20543F]/40 transition-all duration-200 hover:-translate-y-0.5">
                    <GoogleSignInButton
                      clientId={googleClientId}
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      shape="pill"
                      theme="outline"
                      size="large"
                      text="continue_with"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full text-center p-3.5 bg-[#E9EDDA]/70 border border-[#A8B99A]/40 rounded-2xl text-xs text-[#20543F]">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#00A878]" />
                    <span>Google OAuth GIS Ready</span>
                  </p>
                  <p className="text-[11px] text-[#526D60] mt-1 font-medium">
                    Connect real Google Client ID in <code className="bg-white/80 px-1 py-0.5 rounded text-[#173D30]">.env</code> to enable live Google Sign-In.
                  </p>
                </div>
              )}
            </div>

            {/* Verification Information Box */}
            <div className="mt-6 p-4 rounded-2xl bg-[#E9EDDA]/65 border border-[#A8B99A]/40 text-center">
              <p className="text-xs font-bold text-[#173D30] flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 text-[#20543F]" />
                <span>Verified Google Student Sign-In</span>
              </p>
              <p className="text-[11px] text-[#526D60] mt-1.5 leading-relaxed font-medium">
                Sign in with your verified institutional Google account to submit complaints, upload photo evidence, and track real-time resolution updates.
              </p>
            </div>
          </div>

          {/* Footer Navigation */}
          <footer className="mt-8 pt-5 border-t border-[#A8B99A]/30 text-center text-xs text-[#526D60] font-medium">
            <span>Are you a Hostel Warden or Administrator? </span>
            <Link
              to="/admin/login"
              className="font-bold text-[#20543F] hover:text-[#173D30] hover:underline transition-colors ml-1"
            >
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
