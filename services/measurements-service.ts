/**
 * Measurements Service
 * Handles measurement CRUD operations
 * 
 * Endpoints:
 * - GET /measurements — list measurements (paginated)
 * - POST /measurements — create measurement
 * - GET /measurements/{id} — get single measurement
 * - PUT /measurements/{id} — update measurement
 * - DELETE /measurements/{id} — delete measurement
 * 
 * Permission requirements:
 * - measurement.read (for GET)
 * - measurement.write (for POST/PUT)
 * - measurement.delete (for DELETE)
 */

import { get, post, put, del } from "@/lib/api-client";
import {
  Measurement,
  MeasurementListResponse,
  MeasurementCreateRequest,
  MeasurementUpdateRequest,
  MeasurementListFilters,
} from "@/types/clinical-api";
import { getAccessToken } from "@/lib/token-storage";

/**
 * List measurements with optional filters and pagination
 * 
 * @param filters - Optional filters and pagination params
 * @returns MeasurementListResponse with paginated results
 * @throws ApiError on failure (403 if missing measurement.read permission)
 * 
 * @example
 * ```ts
 * const response = await measurementsService.listMeasurements({
 *   study_id: 123,
 *   measurement_type: 'distance',
 *   page: 1
 * });
 * ```
 */
export async function listMeasurements(
  filters?: MeasurementListFilters
): Promise<MeasurementListResponse> {
  const token = getAccessToken();
  return get<MeasurementListResponse>("/measurements", {
    authToken: token ?? undefined,
    body: filters,
  });
}

/**
 * Get a single measurement by ID
 * 
 * @param measurementId - Measurement ID
 * @returns Measurement object
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * const measurement = await measurementsService.getMeasurement(789);
 * console.log(measurement.value, measurement.unit);
 * ```
 */
export async function getMeasurement(measurementId: number): Promise<Measurement> {
  const token = getAccessToken();
  return get<Measurement>(`/measurements/${measurementId}`, { authToken: token ?? undefined });
}

/**
 * Create a new measurement
 * Requires measurement.write permission
 * 
 * @param data - Measurement creation payload
 * @returns Newly created Measurement object
 * @throws ApiError on failure (400 for validation, 403 for permission)
 * 
 * @example
 * ```ts
 * const measurement = await measurementsService.createMeasurement({
 *   instance_id: 456,
 *   study_id: 123,
 *   measurement_type: 'distance',
 *   points: [
 *     { x: 100, y: 200 },
 *     { x: 150, y: 250 }
 *   ],
 *   unit: 'mm',
 *   value: 70.5
 * });
 * ```
 */
export async function createMeasurement(
  data: MeasurementCreateRequest
): Promise<Measurement> {
  const token = getAccessToken();
  return post<Measurement>("/measurements", data, { authToken: token ?? undefined });
}

/**
 * Update an existing measurement
 * Requires measurement.write permission
 * 
 * @param measurementId - Measurement ID to update
 * @param data - Update payload (all fields optional)
 * @returns Updated Measurement object
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * const updated = await measurementsService.updateMeasurement(789, {
 *   label: 'Tumor diameter',
 *   radiologist_note: 'Increased from last study'
 * });
 * ```
 */
export async function updateMeasurement(
  measurementId: number,
  data: MeasurementUpdateRequest
): Promise<Measurement> {
  const token = getAccessToken();
  return put<Measurement>(`/measurements/${measurementId}`, data, {
    authToken: token ?? undefined,
  });
}

/**
 * Delete a measurement
 * Requires measurement.delete permission
 * 
 * @param measurementId - Measurement ID to delete
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * await measurementsService.deleteMeasurement(789);
 * console.log('Measurement deleted');
 * ```
 */
export async function deleteMeasurement(measurementId: number): Promise<void> {
  const token = getAccessToken();
  return del(`/measurements/${measurementId}`, { authToken: token ?? undefined });
}

/**
 * Get all measurements for a study
 * Convenience method combining listMeasurements with study filter
 * 
 * @param studyId - Study ID
 * @param page - Page number (default: 1)
 * @param pageSize - Measurements per page (default: 20)
 * @returns MeasurementListResponse filtered to study
 * 
 * @example
 * ```ts
 * const measurements = await measurementsService.getStudyMeasurements(123);
 * ```
 */
export async function getStudyMeasurements(
  studyId: number,
  page?: number,
  pageSize?: number
): Promise<MeasurementListResponse> {
  return listMeasurements({
    study_id: studyId,
    page,
    page_size: pageSize,
  });
}

/**
 * Get all measurements for an instance
 * Convenience method for instance filtering
 * 
 * @param instanceId - DICOM instance ID
 * @param page - Page number (default: 1)
 * @param pageSize - Measurements per page (default: 20)
 * @returns MeasurementListResponse filtered by instance
 * 
 * @example
 * ```ts
 * const measurements = await measurementsService.getInstanceMeasurements(456);
 * ```
 */
export async function getInstanceMeasurements(
  instanceId: number,
  page?: number,
  pageSize?: number
): Promise<MeasurementListResponse> {
  return listMeasurements({
    instance_id: instanceId,
    page,
    page_size: pageSize,
  });
}

/**
 * Get measurements of a specific type
 * Convenience method for type filtering
 * 
 * @param measurementType - Type of measurement (distance, angle, area, roi, hounsfield_unit, volume)
 * @param page - Page number (default: 1)
 * @param pageSize - Measurements per page (default: 20)
 * @returns MeasurementListResponse filtered by type
 * 
 * @example
 * ```ts
 * const distances = await measurementsService.getMeasurementsByType('distance');
 * ```
 */
export async function getMeasurementsByType(
  measurementType: string,
  page?: number,
  pageSize?: number
): Promise<MeasurementListResponse> {
  return listMeasurements({
    measurement_type: measurementType as any,
    page,
    page_size: pageSize,
  });
}

/**
 * Search measurements by text query
 * Searches in label, notes, etc.
 * 
 * @param query - Search text
 * @param page - Page number (default: 1)
 * @param pageSize - Measurements per page (default: 20)
 * @returns MeasurementListResponse with matching results
 * 
 * @example
 * ```ts
 * const results = await measurementsService.searchMeasurements('tumor');
 * ```
 */
export async function searchMeasurements(
  query: string,
  page?: number,
  pageSize?: number
): Promise<MeasurementListResponse> {
  return listMeasurements({
    search: query,
    page,
    page_size: pageSize,
  });
}

export const measurementsService = {
  listMeasurements,
  getMeasurement,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
  getStudyMeasurements,
  getInstanceMeasurements,
  getMeasurementsByType,
  searchMeasurements,
};
