/**
 * API Request/Response Interceptor
 * Handles:
 * - Attaching bearer token to all requests
 * - Auto-refreshing token on 401 response
 * - Retrying the original request after successful refresh
 * - Clearing session if refresh fails
 *
 * Integration:
 * Call setupApiInterceptor() once during app initialization,
 * typically in a layout or app wrapper after AuthProvider setup.
 *
 * Example:
 * ```tsx
 * useEffect(() => {
 *   setupApiInterceptor();
 * }, []);
 * ```
 */

import { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, clearStorage } from "@/lib/token-storage";
import { authService } from "@/services/auth-service";
import { apiClient } from "@/lib/api-client";

// Track whether we're currently refreshing to avoid multiple simultaneous refreshes
let isRefreshing = false;

// Queue of requests waiting for token refresh
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Notify queued requests that token has been refreshed
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Add a callback to be called when token is refreshed
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Setup request interceptor to attach auth token
 */
function setupRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

/**
 * Setup response interceptor to handle 401 and refresh token
 */
function setupResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };

      // Only handle 401 errors
      if (error.response?.status !== 401 || !originalRequest) {
        return Promise.reject(error);
      }

      // Prevent infinite retry loops
      if (originalRequest._retry) {
        clearStorage();
        // Redirect to login is handled by auth guard component
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Refresh the token
        const response = await authService.refresh(refreshToken);
        const newAccessToken = response.access_token;

        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        isRefreshing = false;
        onRefreshed(newAccessToken);

        // Retry the original request with new token
        return instance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearStorage();

        // Log the error for debugging
        console.error("[API] Token refresh failed:", refreshError);

        // Return the original error so error boundary can handle it
        return Promise.reject(error);
      }
    }
  );
}

/**
 * Initialize API interceptors
 * Must be called once during app initialization
 *
 * Typically called in a useEffect in the root layout or app wrapper:
 * ```tsx
 * useEffect(() => {
 *   setupApiInterceptor();
 * }, []);
 * ```
 */
export function setupApiInterceptor() {
  setupRequestInterceptor(apiClient);
  setupResponseInterceptor(apiClient);
}
