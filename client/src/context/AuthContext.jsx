import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const AUTH_CACHE_KEY = 'hostelfix_user_cache';
const AUTH_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes client cache TTL

// Retrieve safe cached user profile from localStorage to prevent flash of loading
const getCachedUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.user || !parsed.cachedAt) return null;
    if (Date.now() - parsed.cachedAt > AUTH_CACHE_TTL_MS) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return parsed.user;
  } catch {
    return null;
  }
};

const setCachedUser = (userData) => {
  if (typeof window === 'undefined') return;
  try {
    if (userData) {
      localStorage.setItem(
        AUTH_CACHE_KEY,
        JSON.stringify({
          user: userData,
          cachedAt: Date.now(),
        })
      );
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Storage quota or private browsing mode safeguard
  }
};

const clearCachedUser = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {}
};

// Singleton in-flight request promise & timestamp cache to deduplicate /auth/me calls
let inFlightAuthPromise = null;
let lastSuccessfulAuthTime = 0;

export const AuthProvider = ({ children }) => {
  const cachedInitialUser = getCachedUser();
  const [user, setUser] = useState(cachedInitialUser);
  const [loading, setLoading] = useState(() => !cachedInitialUser);

  // Check and restore auth session asynchronously in the background
  const checkAuth = useCallback(async (options = {}) => {
    const { force = false } = options;

    // If session was verified recently and we already have a user in state, avoid redundant network requests
    if (!force && user && Date.now() - lastSuccessfulAuthTime < 20000) {
      return user;
    }

    // Deduplicate concurrent or React StrictMode in-flight requests
    if (inFlightAuthPromise) {
      return inFlightAuthPromise;
    }

    inFlightAuthPromise = (async () => {
      try {
        const res = await api.get('/auth/me', {
          timeout: 15000, // 15s timeout tolerance for Render cold-starts
        });

        if (res.data && res.data.success && res.data.user) {
          const validatedUser = res.data.user;
          setUser(validatedUser);
          setCachedUser(validatedUser);
          lastSuccessfulAuthTime = Date.now();
          return validatedUser;
        } else {
          setUser(null);
          clearCachedUser();
          return null;
        }
      } catch (err) {
        // If 401 Unauthorized or 403 Forbidden, session cookie is invalid or expired
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setUser(null);
          clearCachedUser();
        } else {
          // If server was waking up or network hiccup, log warning without crashing
          console.warn('[AuthContext] Auth verification notice:', err.message);
        }
        return null;
      } finally {
        inFlightAuthPromise = null;
        setLoading(false);
      }
    })();

    return inFlightAuthPromise;
  }, [user]);

  useEffect(() => {
    // Avoid blocking or firing network calls on the public landing page when no cached session exists
    const isLandingPage = typeof window !== 'undefined' && window.location.pathname === '/';
    if (!isLandingPage || cachedInitialUser) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Google Student Login (with dedicated 25s auth timeout for cold-start tolerance)
  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential }, { timeout: 25000 });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      setCachedUser(res.data.user);
      lastSuccessfulAuthTime = Date.now();
      return res.data;
    }
    throw new Error(res.data?.message || 'Google authentication failed');
  };

  // Google Staff Login (with dedicated 25s auth timeout for cold-start tolerance)
  const loginStaffWithGoogle = async (credential) => {
    const res = await api.post('/auth/staff/google', { credential }, { timeout: 25000 });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      setCachedUser(res.data.user);
      lastSuccessfulAuthTime = Date.now();
      return res.data;
    }
    throw new Error(res.data?.message || 'Staff authentication failed');
  };

  // Warden Admin Login (with dedicated 25s auth timeout for cold-start tolerance)
  const loginAsAdmin = async (loginId, password) => {
    const res = await api.post('/auth/admin/login', { loginId, password }, { timeout: 25000 });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      setCachedUser(res.data.user);
      lastSuccessfulAuthTime = Date.now();
      return res.data;
    }
    throw new Error(res.data?.message || 'Admin login failed');
  };

  // Logout - clears server session cookie and local state
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      clearCachedUser();
      setUser(null);
      lastSuccessfulAuthTime = 0;
      inFlightAuthPromise = null;
    }
  };

  // Update profile
  const updateUserProfile = async (profileData) => {
    const res = await api.patch('/student/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      setCachedUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to update profile');
  };

  // Complete student onboarding
  const completeStudentOnboarding = async (formData) => {
    const res = await api.post('/student/onboarding', formData);
    if (res.data && res.data.success) {
      setUser(res.data.user);
      setCachedUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Failed to complete profile onboarding');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isStudent: user?.role === 'student',
        isStaff: user?.role === 'staff',
        isAdmin: user?.role === 'admin',
        loginWithGoogle,
        loginStaffWithGoogle,
        loginAsAdmin,
        logout,
        checkAuth,
        updateUserProfile,
        completeStudentOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
