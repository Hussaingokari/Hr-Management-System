import axios from 'axios';
import { store } from '@/store/store';
import { logout } from '@/store/authSlice';

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  'http://localhost:8080';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/*
 * ============================================================
 * REQUEST INTERCEPTOR
 * ============================================================
 *
 * Adds the JWT access token only when one exists.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('accessToken');

      if (token && token !== 'undefined' && token !== 'null') {
        if (
          config.headers &&
          typeof config.headers.set === 'function'
        ) {
          config.headers.set(
            'Authorization',
            `Bearer ${token}`
          );
        } else {
          config.headers = config.headers || {};
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
 * ============================================================
 * RESPONSE INTERCEPTOR
 * ============================================================
 *
 * Handles expired/invalid JWT sessions.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || '';

    const requestUrl =
      error?.config?.url || '';

    /*
     * Ignore login and refresh endpoints.
     *
     * A 401 from login means invalid credentials,
     * not an expired existing session.
     */
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh');

    if (
      status === 401 &&
      !isAuthRequest &&
      typeof window !== 'undefined'
    ) {
      const token =
        sessionStorage.getItem('accessToken');

      if (token) {
        console.error(
          `[Axios Interceptor] 401 Unauthorized: ${requestUrl}`
        );

        /*
         * Show the appropriate session message.
         */
        try {
          const { toast } =
            await import('react-hot-toast');

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
        } catch (toastError) {
          console.error(
            'Unable to display session-expired notification.',
            toastError
          );
        }

        /*
         * Clear Redux/session authentication state.
         */
        store.dispatch(logout());

        /*
         * Redirect according to the current portal.
         */
        const currentPath =
          window.location.pathname;

        if (currentPath.startsWith('/admin')) {
          window.location.replace('/admin/login');
        } else {
          window.location.replace('/employee/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;