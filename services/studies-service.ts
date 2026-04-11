/**
 * Studies Service
 * Handles all study-related API calls
 * 
 * Endpoints:
 * - GET /studies — list studies (paginated)
 * - POST /studies — create study (admin/service)
 * - GET /studies/{id} — get single study
 * - PUT /studies/{id} — update study
 * - DELETE /studies/{id} — delete study
 * 
 * Permission requirements:
 * - study.read (for GET)
 * - study.write (for POST/PUT)
 * - study.delete (for DELETE)
 */

import { get, post, put, del, ApiError } from "@/lib/api-client";
import {
  Study,
  StudyListResponse,
  StudyCreateRequest,
  StudyUpdateRequest,
  StudyListFilters,
  Series,
  SeriesListResponse,
  DicomInstance,
  DicomListResponse,
  DicomListFilters,
  AuditLog,
  AuditLogListResponse,
  AuditLogFilters,
} from "@/types/clinical-api";
import { getAccessToken } from "@/lib/token-storage";

/**
 * List studies with optional filters and pagination
 * 
 * @param filters - Optional filters and pagination params
 * @returns StudyListResponse with paginated results
 * @throws ApiError on failure (403 if missing study.read permission)
 * 
 * @example
 * ```ts
 * const response = await studiesService.listStudies({
 *   page: 1,
 *   page_size: 20,
 *   modality: 'CT',
 *   status: 'completed'
 * });
 * ```
 */
export async function listStudies(filters?: StudyListFilters): Promise<StudyListResponse> {
  const token = getAccessToken();
  return get<StudyListResponse>("/studies", { 
    authToken: token ?? undefined,
    body: filters,
  });
}

/**
 * Get a single study by ID
 * 
 * @param studyId - Study ID
 * @returns Study object
 * @throws ApiError on failure (404 if not found, 403 if no permission)
 * 
 * @example
 * ```ts
 * const study = await studiesService.getStudy(123);
 * console.log(study.modality, study.study_date);
 * ```
 */
export async function getStudy(studyId: number): Promise<Study> {
  const token = getAccessToken();
  return get<Study>(`/studies/${studyId}`, { authToken: token ?? undefined });
}

/**
 * Create a new study
 * Requires study.write permission
 * 
 * @param data - Study creation payload
 * @returns Newly created Study object
 * @throws ApiError on failure (400 for validation, 403 for permission)
 * 
 * @example
 * ```ts
 * const study = await studiesService.createStudy({
 *   patient_id: 1,
 *   study_uid: '1.2.3.4.5',
 *   study_date: '2024-01-15',
 *   modality: 'CT'
 * });
 * ```
 */
export async function createStudy(data: StudyCreateRequest): Promise<Study> {
  const token = getAccessToken();
  return post<Study>("/studies", data, { authToken: token ?? undefined });
}

/**
 * Update an existing study
 * Requires study.write permission
 * 
 * @param studyId - Study ID to update
 * @param data - Update payload (all fields optional)
 * @returns Updated Study object
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * const updated = await studiesService.updateStudy(123, {
 *   description: 'Updated description',
 *   study_status: 'completed'
 * });
 * ```
 */
export async function updateStudy(
  studyId: number,
  data: StudyUpdateRequest
): Promise<Study> {
  const token = getAccessToken();
  return put<Study>(`/studies/${studyId}`, data, { authToken: token ?? undefined });
}

/**
 * Delete a study
 * Requires study.delete permission
 * 
 * @param studyId - Study ID to delete
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * await studiesService.deleteStudy(123);
 * console.log('Study deleted');
 * ```
 */
export async function deleteStudy(studyId: number): Promise<void> {
  const token = getAccessToken();
  return del(`/studies/${studyId}`, { authToken: token ?? undefined });
}

/**
 * Get studies for a specific patient
 * Convenience method combining listStudies with patient filter
 * 
 * @param patientId - Patient ID
 * @param page - Page number (default: 1)
 * @param pageSize - Studies per page (default: 20)
 * @returns StudyListResponse filtered to patient
 * 
 * @example
 * ```ts
 * const response = await studiesService.getPatientStudies(42, 1, 10);
 * ```
 */
export async function getPatientStudies(
  patientId: number,
  page?: number,
  pageSize?: number
): Promise<StudyListResponse> {
  return listStudies({
    patient_id: patientId,
    page,
    page_size: pageSize,
  });
}

/**
 * Get studies by modality
 * Convenience method for filtering by modality
 * 
 * @param modality - DICOM modality code (e.g., 'CT', 'MR', 'XR')
 * @param page - Page number (default: 1)
 * @param pageSize - Studies per page (default: 20)
 * @returns StudyListResponse filtered by modality
 * 
 * @example
 * ```ts
 * const ctStudies = await studiesService.getStudiesByModality('CT');
 * ```
 */
export async function getStudiesByModality(
  modality: string,
  page?: number,
  pageSize?: number
): Promise<StudyListResponse> {
  return listStudies({
    modality,
    page,
    page_size: pageSize,
  });
}

/**
 * Get studies between specific dates
 * Convenience method for date range filtering
 * 
 * @param fromDate - Start date (ISO format: YYYY-MM-DD)
 * @param toDate - End date (ISO format: YYYY-MM-DD)
 * @param page - Page number (default: 1)
 * @param pageSize - Studies per page (default: 20)
 * @returns StudyListResponse filtered by date range
 * 
 * @example
 * ```ts
 * const jan2024 = await studiesService.getStudiesByDateRange(
 *   '2024-01-01',
 *   '2024-01-31'
 * );
 * ```
 */
export async function getStudiesByDateRange(
  fromDate: string,
  toDate: string,
  page?: number,
  pageSize?: number
): Promise<StudyListResponse> {
  return listStudies({
    study_date_from: fromDate,
    study_date_to: toDate,
    page,
    page_size: pageSize,
  });
}

/**
 * Search studies by text query
 * Searches in study description, study UID, institution name, etc.
 * 
 * @param query - Search text
 * @param page - Page number (default: 1)
 * @param pageSize - Studies per page (default: 20)
 * @returns StudyListResponse with matching results
 * 
 * @example
 * ```ts
 * const results = await studiesService.searchStudies('chest ct');
 * ```
 */
export async function searchStudies(
  query: string,
  page?: number,
  pageSize?: number
): Promise<StudyListResponse> {
  return listStudies({
    search: query,
    page,
    page_size: pageSize,
  });
}

/**
 * Get all series in a study
 * 
 * @param studyId - Study ID
 * @param page - Page number (default: 1)
 * @param pageSize - Series per page (default: 50)
 * @returns SeriesListResponse with paginated series
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * const response = await studiesService.getStudySeries(123);
 * console.log(response.items); // Array of Series
 * ```
 */
export async function getStudySeries(
  studyId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<SeriesListResponse> {
  const token = getAccessToken();
  return get<SeriesListResponse>(
    `/studies/${studyId}/series?page=${page}&page_size=${pageSize}`,
    { authToken: token ?? undefined }
  );
}

/**
 * Get all instances (DICOM files) in a study
 * 
 * @param studyId - Study ID
 * @param page - Page number (default: 1)
 * @param pageSize - Instances per page (default: 50)
 * @returns DicomListResponse with paginated instances
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * const response = await studiesService.getStudyInstances(123);
 * console.log(response.items); // Array of DicomInstance
 * ```
 */
export async function getStudyInstances(
  studyId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<DicomListResponse> {
  const token = getAccessToken();
  return get<DicomListResponse>(
    `/studies/${studyId}/instances?page=${page}&page_size=${pageSize}`,
    { authToken: token ?? undefined }
  );
}

/**
 * Get all instances in a specific series
 * 
 * @param studyId - Study ID
 * @param seriesUid - Series UID
 * @param page - Page number (default: 1)
 * @param pageSize - Instances per page (default: 50)
 * @returns DicomListResponse with instances in the series
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * const response = await studiesService.getSeriesInstances(123, '1.2.3.4');
 * ```
 */
export async function getSeriesInstances(
  studyId: number,
  seriesUid: string,
  page: number = 1,
  pageSize: number = 50
): Promise<DicomListResponse> {
  const token = getAccessToken();
  return get<DicomListResponse>(
    `/studies/${studyId}/series/${encodeURIComponent(seriesUid)}/instances?page=${page}&page_size=${pageSize}`,
    { authToken: token ?? undefined }
  );
}

/**
 * Get audit logs for a specific study
 * Requires audit_log.read permission
 * 
 * @param studyId - Study ID
 * @param filters - Optional filters
 * @returns AuditLogListResponse with audit trail
 * @throws ApiError on failure (403 if missing audit_log.read permission)
 * 
 * @example
 * ```ts
 * const auditLogs = await studiesService.getStudyAuditLogs(123);
 * console.log(auditLogs.items); // Access history
 * ```
 */
export async function getStudyAuditLogs(
  studyId: number,
  filters?: AuditLogFilters
): Promise<AuditLogListResponse> {
  const token = getAccessToken();
  let url = `/studies/${studyId}/audit`;
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.severity) params.append('severity', filters.severity);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  return get<AuditLogListResponse>(url, { authToken: token ?? undefined });
}

/**
 * Archive a study (soft delete, only admins)
 * Requires admin role
 * 
 * @param studyId - Study ID
 * @returns Archived study object
 * @throws ApiError on failure (403 if not admin, 404 if not found)
 * 
 * @example
 * ```ts
 * const archived = await studiesService.archiveStudy(123);
 * console.log(archived.study_status); // 'archived'
 * ```
 */
export async function archiveStudy(studyId: number): Promise<Study> {
  const token = getAccessToken();
  return del<Study>(`/studies/${studyId}`, { authToken: token ?? undefined });
}

export const studiesService = {
  listStudies,
  getStudy,
  createStudy,
  updateStudy,
  deleteStudy,
  getPatientStudies,
  getStudiesByModality,
  getStudiesByDateRange,
  searchStudies,
  getStudySeries,
  getStudyInstances,
  getSeriesInstances,
  getStudyAuditLogs,
  archiveStudy,
};
