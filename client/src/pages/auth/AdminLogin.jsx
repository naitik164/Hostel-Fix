import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowLeft, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setLoginId('admin@hostelfix.edu');
    setPassword('Warden@Secure2026');
    setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-navy-900 font-sans">
      {/* Dark Navy Atmospheric Background & Glows */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-royal/40 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-electric/25 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Decorative dark-glass accents */}
      <div className="hidden lg:block absolute top-24 right-32 w-64 h-24 rounded-3xl bg-white/[0.04] backdrop-blur-md border border-white/10 rotate-6 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sky hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Dark Glass Login Card */}
        <div className="glass-dark-panel p-8 sm:p-10 rounded-card shadow-glass-dark border border-sky/30">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-action mx-auto flex items-center justify-center text-white shadow-lg shadow-electric/40 mb-4 border border-sky/50">
              <Shield className="w-7 h-7 text-ice" />
            </div>
            <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
              Warden Administration
            </h1>
            <p className="mt-1 text-xs text-sky-light/80 font-medium">
              Authorized Hostel Management Portal
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-3 rounded-control bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Warden Login ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky/70">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin@hostelfix.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-control text-xs font-medium bg-navy-900/80 border border-sky/40 text-white placeholder-slate-400 focus:outline-none focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky/70">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-control text-xs font-medium bg-navy-900/80 border border-sky/40 text-white placeholder-slate-400 focus:outline-none focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sky/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-control text-xs font-bold text-white bg-gradient-action hover:shadow-glow-electric border border-sky/50 transition-all flex items-center justify-center gap-2"
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

          {/* Demo Autofill Helper */}
          <div className="mt-6 pt-5 border-t border-sky/20 text-center">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="w-full py-2 rounded-control text-xs font-semibold text-sky-light bg-royal/40 hover:bg-royal/60 border border-sky/30 transition-colors"
            >
              ⚡ Auto-Fill Seeded Warden Credentials
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-400">
            <span>Are you a student resident? </span>
            <Link to="/student/login" className="font-bold text-sky hover:underline">
              Student Google Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
