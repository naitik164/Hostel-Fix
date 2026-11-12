// Frontend Application Configuration

export const APP_CONFIG = {
  appName: 'HostelFix',
  appVersion: '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiTimeout: 15000,
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export default APP_CONFIG;
