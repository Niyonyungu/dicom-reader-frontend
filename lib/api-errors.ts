/**
 * API Error Handling and Parsing
 * Utilities for parsing backend error envelopes
 */

import { ApiErrorResponse, ParsedApiError } from "@/types/api";

/**
 * Parse backend error response and extract human-readable message
 * Handles different error types: validation (422), permission (403), auth (401), etc.
 *
 * Priority:
 * 1. error.message from envelope
 * 2. First validation detail message (422)
 * 3. HTTP status text fallback
 *
 * @param errorBody - Parsed JSON from error response
 * @param status - HTTP status code
 * @returns Human-readable error message
 */
export function getApiErrorMessage(
  errorBody: ApiErrorResponse | unknown,
  status: number
): string {
  // If body is not an object, return generic message
  if (!errorBody || typeof errorBody !== "object") {
    return getStatusMessage(status);
  }

  const body = errorBody as Partial<ApiErrorResponse>;

  // Prefer the message field
  if (body.message && typeof body.message === "string") {
    return body.message;
  }

  // For 422 validation errors, return first detail message
  if (status === 422 && Array.isArray(body.details) && body.details.length > 0) {
    const firstDetail = body.details[0];
    if (firstDetail && "msg" in firstDetail && typeof firstDetail.msg === "string") {
      return firstDetail.msg;
    }
  }

  // Fallback to status code message
  return getStatusMessage(status);
}

/**
 * Get human-readable message for HTTP status code
 */
function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Bad request. Please check your input.",
    401: "Your session expired. Please log in again.",
    403: "You do not have permission to perform this action.",
    404: "Resource not found.",
    409: "Conflict. This resource may already exist.",
    422: "Validation error. Please check your input.",
    429: "Too many requests. Please try again later.",
    500: "Server error. Please try again later.",
    503: "Service unavailable. Please try again later.",
  };

  return messages[status] || "An unexpected error occurred.";
}

/**
 * Parse error response into structured format
 * Call this in catch blocks to get consistent error info
 *
 * @param error - Axios error or unknown error
 * @returns Parsed error with status, message, details
 */
export function parseApiError(error: any): ParsedApiError {
  const parsed: ParsedApiError = {
    status: error?.response?.status || 500,
    errorCode: error?.response?.data?.error || "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
    isValidationError: false,
    is401: false,
    is403: false,
    is429: false,
  };

  const status = parsed.status;
  const responseData = error?.response?.data;

  // Extract message
  parsed.message = getApiErrorMessage(responseData, status);

  // Extract request ID for support
  if (responseData?.request_id) {
    parsed.requestId = responseData.request_id;
    // Log request ID in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Error] Request ID: ${parsed.requestId}`);
    }
  }

  // Set error flags
  parsed.isValidationError = status === 422;
  parsed.is401 = status === 401;
  parsed.is403 = status === 403;
  parsed.is429 = status === 429;

  // Store validation details
  if (status === 422 && responseData?.details) {
    parsed.details = responseData.details;
  }

  return parsed;
}

/**
 * Custom error class for API errors
 * Extends Error with parsed API response data
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly details?: any;
  public readonly requestId?: string;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = "ApiError";
    this.status = parsed.status;
    this.errorCode = parsed.errorCode;
    this.details = parsed.details;
    this.requestId = parsed.requestId;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Check if a 422 validation error matches a specific field
 * Useful for field-level error display in forms
 *
 * @param error - Parsed error
 * @param fieldName - Form field name to match
 * @returns Error message if field matches, undefined otherwise
 */
export function getFieldError(error: ParsedApiError, fieldName: string): string | undefined {
  if (!error.details || !Array.isArray(error.details)) {
    return undefined;
  }

  const fieldError = error.details.find((detail: any) => {
    // Match by field name in loc array (e.g., ['body', 'email'])
    if (Array.isArray(detail.loc)) {
      return detail.loc.includes(fieldName);
    }
    return false;
  });

  return fieldError?.msg;
}
