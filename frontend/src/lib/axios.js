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
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;