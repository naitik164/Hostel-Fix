import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Wrench, ArrowLeft, Shield, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';

const StudentLogin = () => {
  const { loginWithGoogle, loginAsDemoStudent } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(credentialResponse.credential);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed to initialize.');
  };

  const handleDemoStudentLogin = async (email) => {
    try {
      setLoading(true);
      setError('');
      await loginAsDemoStudent(email);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-dark font-sans">
      {/* Layered liquid-glass atmospheric shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-royal/40 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-electric/30 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-sky/20 rounded-full filter blur-2xl pointer-events-none" />

      {/* Decorative glass pills */}
      <div className="hidden lg:block absolute top-20 left-20 w-44 h-16 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 rotate-12 pointer-events-none shadow-glass" />
      <div className="hidden lg:block absolute bottom-24 right-28 w-52 h-20 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 -rotate-12 pointer-events-none shadow-glass" />

      {/* Main Centered Frosted-Glass Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ice hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-card p-8 sm:p-10 shadow-glass-dark border border-white/80">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-action mx-auto flex items-center justify-center text-white shadow-lg shadow-electric/35 mb-4 border border-sky/40">
              <Wrench className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-navy font-heading tracking-tight">
              Student Sign In
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              HostelFix — "Your Hostel. Your Voice. Better Living."
            </p>
          </div>

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
                <div className="w-full flex justify-center">
                  <GoogleLogin
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
                <div className="w-full text-center p-3.5 bg-blue-50/70 border border-sky/40 rounded-control text-xs text-royal">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-electric" />
                    <span>Google OAuth GIS Ready</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Connect real Google Client ID in <code className="bg-white/80 px-1 py-0.5 rounded">.env</code> to enable live Google Sign-In.
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sky/20" />
              </div>
              <div className="relative bg-white/80 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold rounded-full">
                Instant Demo Access
              </div>
            </div>

            {/* Quick Demo Student Logins */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoStudentLogin('aarav.sharma@hostelfix.edu')}
                disabled={loading}
                className="w-full btn-action flex items-center justify-center gap-2 py-2.5 rounded-control text-xs font-bold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign in as Aarav Sharma (Block A)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDemoStudentLogin('priya.patel@hostelfix.edu')}
                disabled={loading}
                className="w-full py-2 rounded-control text-xs font-semibold text-royal bg-ice/60 hover:bg-ice border border-sky/40 transition-colors"
              >
                Sign in as Priya Patel (Block E)
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-ice text-center text-xs text-slate-500">
            <span>Are you a Hostel Warden or Administrator? </span>
            <Link to="/admin/login" className="font-bold text-royal hover:underline">
              Warden Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
