import axios from 'axios';
import { API_URL, API_BASE_URL } from '../config';
import {
  isRequestPending,
  addPendingRequest,
  removePendingRequest,
  cancelPendingRequest,
} from '../utils/requestDeduplication';

// Configure axios
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Global handler for limit reached errors
let limitReachedHandler = null;
let toastHandler = null;

export const setLimitReachedHandler = (handler) => {
  limitReachedHandler = handler;
};

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

// CSRF Token
export const getCsrfToken = async () => {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`);
};

// Helper to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Request deduplication - cancel duplicate requests
    if (isRequestPending(config)) {
      cancelPendingRequest(config);
    }

    // Create cancel token for this request
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;

    // Add to pending requests
    addPendingRequest(config, source);

    // Add XSRF token from cookie to request headers
    const token = getCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }

    // Add auth token if exists
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Remove from pending requests on success
    removePendingRequest(response.config);
    return response;
  },
  (error) => {
    // Remove from pending requests on error (unless it's a cancel)
    if (error.config && !axios.isCancel(error)) {
      removePendingRequest(error.config);
    }

    // Handle cancelled requests silently
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const errorData = error.response?.data;

    if (status === 401) {
      // Handle unauthorized
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';

      // Don't redirect if it's any auth endpoint (let AuthContext handle it)
      // This prevents redirect loop when checking authentication status
      const isAuthEndpoint = requestUrl.includes('/auth/user') ||
                             requestUrl.includes('/auth/login') ||
                             requestUrl.includes('/auth/register');

      if (isAuthEndpoint) {
        // Let AuthContext handle the 401 for auth endpoints
        return Promise.reject(error);
      }

      // Clear auth data on 401 for non-auth endpoints
      localStorage.removeItem('auth_token');
      localStorage.removeItem('cached_user_data');
      localStorage.removeItem('cached_user_timestamp');

      // Only redirect if not already on login/register page
      if (currentPath !== '/login' && currentPath !== '/register') {
        if (toastHandler) {
          toastHandler.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
        // Redirect immediately without delay to avoid multiple requests
        window.location.href = '/login';
      }
    } else if (status === 403) {
      // Handle usage limit reached
      if (errorData?.error === 'Usage limit reached' && limitReachedHandler) {
        // Call the registered handler (usually shows a modal)
        limitReachedHandler(errorData);
      } else if (toastHandler) {
        toastHandler.error(errorData?.message || 'غير مسموح لك بالوصول');
      }
    } else if (status === 404) {
      // Only show toast for 404 if it's not a cancelled request
      // Some 404s are expected (like checking if resource exists)
      const requestUrl = error.config?.url || '';
      
      // Don't show error for certain endpoints that might legitimately return 404
      const silent404Endpoints = [
        '/auth/user', // Handled by AuthContext
      ];
      
      const shouldShowError = !silent404Endpoints.some(endpoint => requestUrl.includes(endpoint));
      
      if (shouldShowError && toastHandler) {
        toastHandler.error(errorData?.message || 'المورد المطلوب غير موجود');
      }
      
      // Log 404 errors for debugging (but don't spam console)
      if (error.config && !error.config.silent404) {
        console.warn('404 Not Found:', requestUrl, errorData);
      }
    } else if (status === 422) {
      // Validation errors - handled by form components
      if (toastHandler && !error.config?.skipToast) {
        const errors = errorData?.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          toastHandler.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          toastHandler.error(errorData?.message || 'خطأ في التحقق من البيانات');
        }
      }
    } else if (status === 429) {
      if (toastHandler) {
        toastHandler.warning('تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً');
      }
    } else if (status >= 500) {
      if (toastHandler) {
        toastHandler.error('حدث خطأ في الخادم. يرجى المحاولة لاحقاً');
      }
    } else if (!error.response) {
      // Network error
      if (toastHandler) {
        toastHandler.error('خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت');
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
