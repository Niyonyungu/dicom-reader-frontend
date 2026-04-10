/**
 * API Client - Centralized HTTP layer
 * All API requests go through this client
 * Handles:
 * - Environment-based base URL
 * - Bearer token attachment
 * - Error parsing and logging
 * - Request/response interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { parseApiError, ApiError } from "./api-errors";
import { ApiRequestOptions } from "@/types/api";

/**
 * Create axios instance with base URL from env
 * Base URL is derived from NEXT_PUBLIC_API_BASE_URL
 */
function createApiClient(): AxiosInstance {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const apiRoot = `${baseUrl}/api/v1`;

  const client = axios.create({
    baseURL: apiRoot,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: attach auth token if available
  client.interceptors.request.use(
    (config) => {
      // Token will be attached via authToken parameter in request()
      // This is a placeholder for Prompt 2 integration
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: log request IDs in development
  client.interceptors.response.use(
    (response) => {
      // Optional: log successful responses
      return response;
    },
    (error: AxiosError) => {
      // Parse and log error details
      const parsed = parseApiError(error);
      if (process.env.NODE_ENV === "development") {
        console.error(`[API Error] ${parsed.status} ${parsed.errorCode}:`, parsed.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// Create singleton instance
const apiClient = createApiClient();

/**
 * Make an API request with centralized error handling
 *
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path - Endpoint path (relative to /api/v1, e.g., "/auth/login")
 * @param options - Request options (body, authToken, headers)
 * @returns Promise resolving to typed response data
 * @throws ApiError with parsed error details on failure
 *
 * @example
 * ```ts
 * try {
 *   const response = await apiClient.request('POST', '/auth/login', {
 *     body: { email: 'user@example.com', password: '...' },
 *   });
 *   console.log(response.access_token);
 * } catch (error) {
 *   const apiError = error as ApiError;
 *   console.error(apiError.message, apiError.status);
 * }
 * ```
 */
export async function request<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const config: AxiosRequestConfig = {
    method,
    url: path,
  };

  // Add body for non-GET requests
  if (options.body && method !== "GET") {
    config.data = options.body;
  } else if (options.body && method === "GET") {
    // For GET with params, use params instead
    config.params = options.body;
  }

  // Attach auth token to headers if provided
  if (options.authToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${options.authToken}`,
    };
  }

  // Merge additional headers
  if (options.headers) {
    config.headers = {
      ...config.headers,
      ...options.headers,
    };
  }

  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    // Parse error and throw ApiError
    const parsed = parseApiError(error);
    throw new ApiError(parsed);
  }
}

/**
 * GET request helper
 */
export function get<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("GET", path, options);
}

/**
 * POST request helper
 */
export function post<T = any>(
  path: string,
  body?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return request<T>("POST", path, { ...options, body });
}

/**
 * PUT request helper
 */
export function put<T = any>(
  path: string,
  body?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return request<T>("PUT", path, { ...options, body });
}

/**
 * DELETE request helper
 */
export function del<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>("DELETE", path, options);
}

/**
 * PATCH request helper
 */
export function patch<T = any>(
  path: string,
  body?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return request<T>("PATCH", path, { ...options, body });
}

/**
 * Health check - verify backend is reachable
 * Endpoint: GET /health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await get<{ status: string }>("/health");
    return response?.status === "ok";
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Health Check] Backend unreachable");
    }
    return false;
  }
}

/**
 * Export singleton client for advanced use cases
 */
export { apiClient };

/**
 * Export error utilities
 */
export { parseApiError, ApiError, getApiErrorMessage } from "./api-errors";
