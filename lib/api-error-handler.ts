/**
 * API Error Handler
 * Centralized error handling for API responses, especially 403 permission errors
 *
 * Usage in components:
 * ```tsx
 * try {
 *   const result = await apiClient.post('/studies', data);
 * } catch (error) {
 *   const handled = handleApiError(error);
 *   if (handled.isForbidden) {
 *     showForbiddenMessage(handled.message);
 *   }
 * }
 * ```
 */

import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

export interface HandledApiError {
  /** HTTP status code */
  status: number;
  /** Human-readable error message */
  message: string;
  /** Whether this is a 403 Forbidden error */
  isForbidden: boolean;
  /** Whether this is a 404 Not Found error */
  isNotFound: boolean;
  /** Whether this is a 422 Validation error */
  isValidation: boolean;
  /** Whether this is a 429 Rate Limit error */
  isRateLimit: boolean;
  /** Whether this is a 401 Unauthorized error */
  isUnauthorized: boolean;
  /** Original error for debugging */
  originalError: any;
  /** Request ID for support reference */
  requestId?: string;
  /** Field-level validation errors for forms */
  fieldErrors?: Record<string, string>;
}

/**
 * Extract permission from 403 error message
 * Matches strings like "Missing permission: study.read"
 */
function extractMissingPermission(message: string): string | null {
  const match = message.match(/Missing permission:\s*([a-z_\.]+)/i);
  return match ? match[1] : null;
}

/**
 * Handle API errors and extract useful information
 * Particularly handles 403 permission denied messages
 *
 * @param error - Error from API call
 * @param options - Additional handling options
 * @returns Handled error object with extracted details
 *
 * @example
 * ```tsx
 * try {
 *   const report = await apiClient.patch(`/reports/${id}`, data);
 * } catch (error) {
 *   const handled = handleApiError(error);
 *   if (handled.isForbidden) {
 *     showPermissionDeniedUI(handled.message);
 *   }
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  options: {
    showToast?: boolean;
    context?: string; // e.g., "Failed to create report"
  } = {}
): HandledApiError {
  const { showToast = true, context } = options;

  const apiError = error as ApiError;
  const status = apiError.status || 500;
  let message = apiError.message || "An error occurred";

  // Extract permission info from 403 message
  const missingPermission = extractMissingPermission(message);

  // Format 403 message for UI
  if (status === 403) {
    if (missingPermission) {
      message = `You don't have the required permission: ${missingPermission}`;
    } else {
      message = "You don't have permission to perform this action";
    }
  }

  // Parse field-level validation errors (422)
  const fieldErrors: Record<string, string> = {};
  if (status === 422 && apiError.details) {
    const details = apiError.details as any[];
    if (Array.isArray(details)) {
      details.forEach((err: any) => {
        if (err.loc && err.msg) {
          const fieldPath = (err.loc as (string | number)[])
            .slice(1) // Remove 'body'
            .join(".");
          fieldErrors[fieldPath] = err.msg;
        }
      });
    }
  }

  const handled: HandledApiError = {
    status,
    message,
    isForbidden: status === 403,
    isNotFound: status === 404,
    isValidation: status === 422,
    isRateLimit: status === 429,
    isUnauthorized: status === 401,
    originalError: error,
    requestId: apiError.requestId,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };

  // Show toast if requested
  if (showToast) {
    const toastMessage = context ? `${context}: ${message}` : message;
    const toastType = handled.isForbidden ? "error" : "error";

    if (typeof window !== "undefined") {
      // Using toast would require importing it, which we may not want here
      // Instead, just log for now
      console.error(`[API Error] ${toastType.toUpperCase()}: ${toastMessage}`);
    }
  }

  return handled;
}

/**
 * Check if error is a permission denied error
 */
export function isPermissionDenied(error: unknown): boolean {
  const apiError = error as ApiError;
  return apiError.status === 403;
}

/**
 * Get user-friendly message for specific error scenarios
 */
export function getErrorMessage(
  error: HandledApiError,
  defaultMessage: string = "Something went wrong"
): string {
  if (error.isForbidden) {
    return error.message || "You don't have permission to do this";
  }
  if (error.isNotFound) {
    return "The resource was not found";
  }
  if (error.isValidation) {
    return error.message || "Please check your input and try again";
  }
  if (error.isRateLimit) {
    return "Too many requests. Please try again later";
  }
  if (error.isUnauthorized) {
    return "Your session has expired. Please log in again";
  }
  return error.message || defaultMessage;
}
