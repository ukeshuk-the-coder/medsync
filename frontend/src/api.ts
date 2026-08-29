import axios from 'axios';

// In local dev, Vite's proxy forwards /api to localhost:4000 (see vite.config.ts).
// In production, set VITE_API_URL to your deployed backend's URL (e.g. Render).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return Promise.reject(new Error('Expected JSON from API but received HTML - check VITE_API_URL.'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
