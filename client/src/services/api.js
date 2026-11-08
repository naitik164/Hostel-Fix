import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000, // 15s default timeout for standard API operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Format cold-start / timeout errors into clear, actionable messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      error.message = 'The server is taking longer than expected to respond. Render may be waking up from sleep. Please try again.';
    } else if (!error.response && error.message === 'Network Error') {
      error.message = 'Unable to reach the HostelFix server. Please check your network connection or verify backend availability.';
    }
    return Promise.reject(error);
  }
);

// Proactive background pre-warming: wakes up Render Free tier immediately upon app load
export const prewarmBackend = () => {
  if (typeof window !== 'undefined') {
    // Fire-and-forget ping to /api/health
    api.get('/health', { timeout: 35000 }).catch(() => {
      // Non-critical; ignore background wake-up errors
    });
  }
};

export default api;

