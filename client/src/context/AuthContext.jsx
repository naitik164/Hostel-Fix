import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check and restore auth session on initial mount through backend GET /api/auth/me
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
        updateUserProfile,
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
