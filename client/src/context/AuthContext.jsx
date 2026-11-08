import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authCheckInProgressRef = useRef(false);

  // Check and restore auth session asynchronously in the background
  const checkAuth = useCallback(async (abortSignal) => {
    // Prevent redundant duplicate in-flight requests
    if (authCheckInProgressRef.current) return;
    authCheckInProgressRef.current = true;

    try {
      const res = await api.get('/auth/me', {
        signal: abortSignal,
        timeout: 7000, // 7s safeguard timeout for initial auth verification
      });
      if (res.data && res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // Ignore AbortController cancellations; otherwise set unauthenticated
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        setUser(null);
      }
    } finally {
      authCheckInProgressRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    checkAuth(controller.signal);

    return () => {
      controller.abort();
    };
  }, [checkAuth]);

  // Google Student Login
  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data?.message || 'Google authentication failed');
  };

  // Google Staff Login
  const loginStaffWithGoogle = async (credential) => {
    const res = await api.post('/auth/staff/google', { credential });
    if (res.data && res.data.success) {
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data?.message || 'Staff authentication failed');
  };

  // Warden Admin Login
  const loginAsAdmin = async (loginId, password) => {
    const res = await api.post('/auth/admin/login', { loginId, password });
    if (res.data && res.data.success) {
      setUser(res.data.user);
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
      setUser(null);
    }
  };

  // Update profile
  const updateUserProfile = async (profileData) => {
    const res = await api.patch('/student/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to update profile');
  };

  // Complete student onboarding
  const completeStudentOnboarding = async (formData) => {
    const res = await api.post('/student/onboarding', formData);
    if (res.data && res.data.success) {
      setUser(res.data.user);
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
