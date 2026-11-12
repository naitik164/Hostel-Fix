import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowLeft, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const { user, loading: authLoading, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from?.pathname;

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        const dest = fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin/dashboard';
        navigate(dest, { replace: true });
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate, fromPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please provide both your Warden Login ID and Password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await loginAsAdmin(loginId, password);
      const dest = fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {/* Soft cream/sage glassmorphic card */}
        <div className="bg-[#F7F8F0]/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-[28px] sm:rounded-[32px] border border-[#C8D5BC] shadow-[0_20px_50px_rgba(23,61,48,0.08)] hover:shadow-[0_25px_60px_rgba(23,61,48,0.12)] transition-all duration-300">
          {/* Header */}
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
              className="w-16 h-16 mx-auto mb-4 object-contain filter drop-shadow-md rounded-2xl"
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173D30] font-heading tracking-tight">
              Warden Administration
            </h1>
            <p className="mt-1.5 text-xs text-[#647568] font-medium tracking-wide">
              Complaint • Maintenance • Resolution
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#20543F] mb-1.5">
                Warden Login ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#20543F]">
                  <Mail className="w-4 h-4 text-[#20543F]" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin@hostelfix.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#FFFFFF] border border-[#D2DDC7] text-[#173D30] placeholder-[#829184] focus:outline-none focus:border-[#20543F] focus:ring-2 focus:ring-[#A8B99A]/30 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#20543F] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#20543F]">
                  <Lock className="w-4 h-4 text-[#20543F]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold bg-[#FFFFFF] border border-[#D2DDC7] text-[#173D30] placeholder-[#829184] focus:outline-none focus:border-[#20543F] focus:ring-2 focus:ring-[#A8B99A]/30 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#20543F] hover:text-[#173D30] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#20543F] hover:bg-[#173D30] shadow-[0_4px_14px_rgba(32,84,63,0.3)] hover:shadow-[0_6px_20px_rgba(32,84,63,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Authenticate as Warden</span>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3.5 rounded-2xl bg-[#E9EDDA]/65 border border-[#C8D5BC] text-center">
            <p className="text-xs text-[#173D30] font-medium flex items-center justify-center gap-2 leading-relaxed">
              <Shield className="w-4 h-4 text-[#20543F] shrink-0" />
              <span>Administrative access is strictly restricted to authorized hostel wardens.</span>
            </p>
          </div>

          <footer className="mt-6 pt-5 border-t border-[#C8D5BC]/60 text-center text-xs text-[#647568] font-medium">
            <span>Are you a student resident? </span>
            <Link
              to="/student/login"
              className="font-bold text-[#20543F] hover:text-[#173D30] hover:underline transition-colors ml-1"
            >
              Student Google Login
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
