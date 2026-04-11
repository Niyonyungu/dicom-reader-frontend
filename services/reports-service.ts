/**
 * Reports Service
 * Handles report API calls for radiologist findings
 *
 * Endpoints:
 * - GET /reports - List reports
 * - POST /reports - Create report
 * - GET /reports/{id} - Get report
 * - PUT /reports/{id} - Update report
 * - DELETE /reports/{id} - Delete report
 * - POST /reports/{id}/approve - Approve report
 * - POST /reports/{id}/sign - Sign/finalize report
 */

import { get, post, put, del } from "@/lib/api-client";
import { getAccessToken } from "@/lib/token-storage";

export interface Report {
  id: string;
  study_id: string;
  patient_id: string;
  radiologist_id: number;
  radiologist_name?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  status: "draft" | "completed" | "signed" | "approved";
  signed_by_id?: number;
  signed_by_name?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Report[];
}

export interface ReportCreateRequest {
  study_id: string;
  patient_id: string;
  findings: string;
  impression: string;
  recommendations?: string;
}

export interface ReportUpdateRequest {
  findings?: string;
  impression?: string;
  recommendations?: string;
}

export interface ReportFilters {
  page?: number;
  page_size?: number;
  study_id?: string;
  patient_id?: string;
  status?: "draft" | "completed" | "signed" | "approved";
  radiologist_id?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * List reports with optional filters
 *
 * @param filters - Optional filters and pagination
 * @returns Paginated reports
 */
export async function listReports(
  filters?: ReportFilters
): Promise<ReportListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.study_id) params.append("study_id", filters.study_id);
    if (filters.patient_id) params.append("patient_id", filters.patient_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.radiologist_id)
      params.append("radiologist_id", filters.radiologist_id.toString());
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
  }

  const queryString = params.toString();
  const url = `/reports${queryString ? `?${queryString}` : ""}`;

  return get<ReportListResponse>(url, {
    authToken: token ?? undefined,
  });
}

/**
 * Get a single report by ID
 *
 * @param reportId - Report ID
 * @returns Report details
 */
export async function getReport(reportId: string): Promise<Report> {
  const token = getAccessToken();
  return get<Report>(`/reports/${reportId}`, {
    authToken: token ?? undefined,
  });
}

/**
 * Create a new report
 *
 * @param data - Report creation payload
 * @returns Created report
 */
export async function createReport(data: ReportCreateRequest): Promise<Report> {
  const token = getAccessToken();
  return post<Report>("/reports", data, {
    authToken: token ?? undefined,
  });
}

/**
 * Update a report (draft only)
 *
 * @param reportId - Report ID
 * @param data - Update payload
 * @returns Updated report
 */
export async function updateReport(
  reportId: string,
  data: ReportUpdateRequest
): Promise<Report> {
  const token = getAccessToken();
  return put<Report>(`/reports/${reportId}`, data, {
    authToken: token ?? undefined,
  });
}

/**
 * Delete a report (draft only)
 *
 * @param reportId - Report ID
 * @returns void
 */
export async function deleteReport(reportId: string): Promise<void> {
  const token = getAccessToken();
  return del(`/reports/${reportId}`, {
    authToken: token ?? undefined,
  });
}

/**
 * Approve a report (senior radiologist)
 *
 * @param reportId - Report ID
 * @returns Approved report
 */
export async function approveReport(reportId: string): Promise<Report> {
  const token = getAccessToken();
  return post<Report>(`/reports/${reportId}/approve`, {}, {
    authToken: token ?? undefined,
  });
}

/**
 * Sign/finalize a report
 *
 * @param reportId - Report ID
 * @returns Signed report
 */
export async function signReport(reportId: string): Promise<Report> {
  const token = getAccessToken();
  return post<Report>(`/reports/${reportId}/sign`, {}, {
    authToken: token ?? undefined,
  });
}

/**
 * Get all reports for a study
 *
 * @param studyId - Study ID
 * @returns List of reports for study
 */
export async function getStudyReports(studyId: string): Promise<Report[]> {
  const token = getAccessToken();
  return get<Report[]>(`/reports/study/${studyId}`, {
    authToken: token ?? undefined,
  });
}
