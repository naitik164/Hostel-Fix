import apiClient from '../api/apiClient';

export const authService = {
  // Student Google Authentication
  googleLogin: async (credential) => {
    const response = await apiClient.post('/auth/google', { credential });
    return response.data;
  },

  // Staff Google Authentication
  staffGoogleLogin: async (credential) => {
    const response = await apiClient.post('/auth/staff/google', { credential });
    return response.data;
  },

  // Staff Credentials Login (Backward-compatible fallback)
  staffLogin: async (credentials) => {
    const response = await apiClient.post('/auth/staff/login', credentials);
    return response.data;
  },

  // Admin / Warden Credentials Login
  adminLogin: async (credentials) => {
    const response = await apiClient.post('/auth/admin/login', credentials);
    return response.data;
  },

  // Verify and retrieve authenticated user profile
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Terminate session
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Student Profile Completion / Onboarding
  completeOnboarding: async (onboardingData) => {
    const response = await apiClient.post('/student/onboarding', onboardingData);
    return response.data;
  },
};

export default authService;
