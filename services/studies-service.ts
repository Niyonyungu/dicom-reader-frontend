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
};
