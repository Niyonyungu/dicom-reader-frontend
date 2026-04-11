/**
 * Audit Service
 * Handles audit log API calls for compliance and tracking
 *
 * Endpoints:
 * - GET /audit-logs - List audit logs (admin only)
 * - GET /audit-logs/user/{id} - Get user's audit logs
 * - GET /audit-logs/study/{id} - Get study audit logs
 * - GET /audit-logs/export - Export audit logs as CSV
 */

import { get, ApiError } from "@/lib/api-client";
import { getAccessToken } from "@/lib/token-storage";

export interface AuditLog {
  id: number;
  user_id: number;
  user_role: string;
  action: string; // STUDY_VIEWED, MEASUREMENT_CREATED, etc
  resource_type: string; // study, measurement, annotation, report
  resource_id?: string;
  study_id?: string;
  details?: Record<string, any>;
  severity: "info" | "warning" | "error" | "critical";
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
}

export interface AuditLogFilters {
  page?: number;
  page_size?: number;
  user_id?: number;
  study_id?: string;
  action?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  resource_type?: string;
}

/**
 * List audit logs (admin only)
 * Requires admin role
 *
 * @param filters - Optional filters
 * @returns Paginated audit logs
 * @throws ApiError on failure (403 if not admin)
 */
export async function listAuditLogs(
  filters?: AuditLogFilters
): Promise<AuditLogListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.user_id) params.append("user_id", filters.user_id.toString());
    if (filters.study_id) params.append("study_id", filters.study_id);
    if (filters.action) params.append("action", filters.action);
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.resource_type) params.append("resource_type", filters.resource_type);
  }

  const queryString = params.toString();
  const url = `/audit-logs${queryString ? `?${queryString}` : ""}`;

  return get<AuditLogListResponse>(url, {
    authToken: token ?? undefined,
  });
}

/**
 * Get audit logs for a specific user
 *
 * @param userId - User ID
 * @param filters - Optional filters
 * @returns Paginated audit logs for user
 */
export async function getUserAuditLogs(
  userId: number,
  filters?: AuditLogFilters
): Promise<AuditLogListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.action) params.append("action", filters.action);
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
  }

  const queryString = params.toString();
  const url = `/audit-logs/user/${userId}${queryString ? `?${queryString}` : ""}`;

  return get<AuditLogListResponse>(url, {
    authToken: token ?? undefined,
  });
}

/**
 * Get audit logs for a specific study
 *
 * @param studyId - Study ID
 * @param filters - Optional filters
 * @returns Paginated audit logs for study
 */
export async function getStudyAuditLogs(
  studyId: string,
  filters?: AuditLogFilters
): Promise<AuditLogListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.action) params.append("action", filters.action);
    if (filters.user_id) params.append("user_id", filters.user_id.toString());
  }

  const queryString = params.toString();
  const url = `/audit-logs/study/${studyId}${queryString ? `?${queryString}` : ""}`;

  return get<AuditLogListResponse>(url, {
    authToken: token ?? undefined,
  });
}

/**
 * Export audit logs as CSV
 * Requires admin role
 *
 * @param filters - Optional filters for export
 * @returns CSV blob data
 */
export async function exportAuditLogs(filters?: AuditLogFilters): Promise<Blob> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.user_id) params.append("user_id", filters.user_id.toString());
    if (filters.study_id) params.append("study_id", filters.study_id);
    if (filters.action) params.append("action", filters.action);
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
  }

  const queryString = params.toString();
  const url = `/audit-logs/export${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1${url}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export audit logs");
  }

  return response.blob();
}
