import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../../components/common';
import { ArrowLeft, Shield, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const StaffLogin = () => {
  const { user, loading: authLoading, loginStaffWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from?.pathname;

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'staff') {
        const dest = fromPath && fromPath.startsWith('/staff') ? fromPath : '/staff/dashboard';
        navigate(dest, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate, fromPath]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await loginStaffWithGoogle(credentialResponse.credential);
      const dest = fromPath && fromPath.startsWith('/staff') ? fromPath : '/staff/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please contact the hostel warden.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed to initialize.');
  };

  const loginContent = (
    <div className="min-h-[100dvh] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gradient-dark font-sans">
      {/* Liquid-glass atmospheric background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-royal/40 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-electric/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-sky/20 rounded-full filter blur-2xl pointer-events-none" />

      {/* Main Glass Login Card Landmark */}
      <main className="relative z-10 w-full max-w-md my-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ice hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
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
              Maintenance Staff Portal
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              HostelFix — Field Operations & Work Verification
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <div className="mt-6 p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold">Access Denied</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
                {error.toLowerCase().includes('warden') && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    Tip: Ask your hostel warden to register your Google email under Staff Management.
                  </p>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 p-4 rounded-control bg-sky/20 border border-sky/30 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-electric border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-royal">Authenticating with Google...</span>
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
                <div className="w-full text-center p-3.5 bg-[#E8EFD3]/60 border border-[#A7B88C]/40 rounded-control text-xs text-royal">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-electric" />
                    <span>Google Identity Services Configured</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Connect real Google Client ID in <code className="bg-white/80 px-1 py-0.5 rounded">.env</code> to sign in with your approved Google account.
                  </p>
                </div>
              )}
            </div>

            {/* Authorization Policy Note */}
            <div className="mt-6 p-4 rounded-control bg-[#E8EFD3]/50 border border-[#A7B88C]/35">
              <p className="text-xs font-semibold text-navy flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-royal" />
                <span>Authorized Staff Verification Policy</span>
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-royal shrink-0 mt-0.5" />
                  <span>Your Google email must be pre-registered by the Hostel Warden.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-royal shrink-0 mt-0.5" />
                  <span>Access is restricted strictly to maintenance technicians and hostel tradesmen.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-royal shrink-0 mt-0.5" />
                  <span>Passwords are never used for staff login; authentication uses official Google OAuth.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Navigation */}
          <footer className="mt-8 pt-6 border-t border-ice text-center text-xs text-slate-500 space-y-1">
            <p>
              Are you a Student?{' '}
              <Link to="/student/login" className="font-bold text-royal hover:underline">
                Student Portal
              </Link>
            </p>
            <p>
              Hostel Warden or Administrator?{' '}
              <Link to="/admin/login" className="font-bold text-royal hover:underline">
                Warden Portal
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );

  return loginContent;
};

export default StaffLogin;
