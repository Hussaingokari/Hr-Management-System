import axios from 'axios';
import { store } from '@/store/store';
import { logout } from '@/store/authSlice';

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
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

/*
 * Add access token to every authenticated request.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('accessToken');

      if (token && token !== 'undefined') {
        if (
          config.headers &&
          typeof config.headers.set === 'function'
        ) {
          config.headers.set(
            'Authorization',
            `Bearer ${token}`
          );
        } else {
          config.headers.Authorization =
            `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
 * Handle authentication/session errors.
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || '';

    const requestUrl =
      error.config?.url || 'unknown URL';

    /*
     * Backend sends 401 when:
     * 1. JWT is invalid/expired
     * 2. HRMS inactivity session has expired
     */
    if (
      status === 401 &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/refresh')
    ) {
      if (
        typeof window !== 'undefined' &&
        sessionStorage.getItem('accessToken')
      ) {
        console.error(
          `[Axios Interceptor] 401 Unauthorized: ${requestUrl}`
        );

        /*
         * If backend specifically says the session
         * expired because of inactivity, show that
         * message to the user.
         */
        import('react-hot-toast').then(
          ({ toast }) => {
            if (
              message
                .toLowerCase()
                .includes('session expired')
            ) {
              toast.error(
                'Your session expired due to inactivity. Please login again.',
                {
                  duration: 5000,
                }
              );
            } else {
              toast.error(
                'Your session has expired. Please login again.',
                {
                  duration: 5000,
                }
              );
            }
          }
        );

        /*
         * Use the existing Redux logout.
         * This clears:
         * - Redux authentication
         * - accessToken
         * - user
         */
        store.dispatch(logout());

        /*
         * Redirect to the appropriate login page.
         */
        const currentPath =
          window.location.pathname;

        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/employee/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;