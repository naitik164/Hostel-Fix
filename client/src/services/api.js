import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000, // 10s default safeguard timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
