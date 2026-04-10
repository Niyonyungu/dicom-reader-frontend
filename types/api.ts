/**
 * API Response and Error Types
 * Shared types for all API interactions
 */

/**
 * Standard error envelope from backend
 * Used in all error responses (422, 403, 401, 500, etc.)
 */
export interface ApiErrorResponse {
  error: string; // e.g., "VALIDATION_ERROR", "HTTP_ERROR", "INTERNAL_SERVER_ERROR"
  message: string; // Human-readable message
  details?: {
    loc?: (string | number)[]; // 422 validation: property path
    msg?: string; // 422 validation: error message
    type?: string; // 422 validation: error type
  }[];
  request_id?: string; // Correlation ID for support
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response body
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: CurrentUserResponse;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Current user info (from /auth/me)
 */
export interface CurrentUserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Generic API request options
 */
export interface ApiRequestOptions {
  body?: any;
  authToken?: string;
  headers?: Record<string, string>;
}

/**
 * Parsed error details for error handling
 */
export interface ParsedApiError {
  status: number;
  errorCode: string;
  message: string;
  details?: any;
  requestId?: string;
  isValidationError: boolean;
  is401: boolean;
  is403: boolean;
  is429: boolean;
}
