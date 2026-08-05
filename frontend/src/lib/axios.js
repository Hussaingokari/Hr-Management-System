import axios from 'axios';
import { store } from '@/store/store';
import { logout } from '@/store/authSlice';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL !== undefined 
  ? process.env.NEXT_PUBLIC_API_BASE_URL 
  : 'http://localhost:8080';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token && token !== 'undefined') {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      if (typeof window !== 'undefined' && sessionStorage.getItem('accessToken')) {
        // Only dispatch logout if we actually had a token that was rejected
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default api;