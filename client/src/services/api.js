import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000, // 15s default timeout for standard API operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Format cold-start / timeout / network errors into clear, actionable messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.message && (error.message.toLowerCase().includes('timeout') || error.message.includes('ERR_TIMED_OUT')));

    if (isTimeout) {
      error.message = 'The server is taking longer than expected to respond. The service may be waking up from sleep. Please try again.';
    } else if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
      error.message = 'Unable to reach the HostelFix server. Please check your network connection or verify service status.';
    }
    return Promise.reject(error);
  }
);

// Deprecated: In accordance with production guidelines, do not perform frontend pings
// to artificially keep Render awake or cause unnecessary Lighthouse timeouts on the landing page.
export const prewarmBackend = () => {
  // Safe no-op
};

export default api;

