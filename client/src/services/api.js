import axios from 'axios';

/**
 * Determines and formats the base API URL dynamically.
 * Handles both relative '/api' (local Vite proxy / same-origin reverse proxy)
 * and full external URLs (e.g. https://api.render.com/api) without duplicate '/api' prefixes.
 */
const getBaseURL = () => {
  const rawUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (!rawUrl) {
    return '/api';
  }

  // Remove trailing slashes
  const cleanUrl = rawUrl.replace(/\/+$/, '');

  // If already ends in /api, use as-is; otherwise append /api
  if (cleanUrl.endsWith('/api')) {
    return cleanUrl;
  }

  return `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Always transmit secure HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
  },
});

// Response interceptor for sanitized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.response?.status === 401 ? 'Session expired or unauthenticated. Please log in.' : null) ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject(new Error(message));
  }
);

export default api;
