// Frontend Application Configuration
import { getApiBaseUrl } from '../services/api/apiClient';

export const APP_CONFIG = {
  appName: 'HostelFix',
  appVersion: '1.0.0',
  apiUrl: getApiBaseUrl(),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiTimeout: 15000,
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export default APP_CONFIG;
