/**
 * Patients Service
 * Handles patient management API calls
 *
 * Endpoints:
 * - GET /patients - List patients
 * - POST /patients - Create patient
 * - GET /patients/{id} - Get patient details
 * - PUT /patients/{id} - Update patient
 * - DELETE /patients/{id} - Delete patient
 * - GET /patients/search - Search patients
 */

import { get, post, put, del } from "@/lib/api-client";
import { getAccessToken } from "@/lib/token-storage";

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  full_name: string;
  date_of_birth: string;
  gender?: "M" | "F" | "O";
  age?: number;
  contact_info?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  medical_record_number?: string;
  study_count?: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Patient[];
}

export interface PatientCreateRequest {
  patient_id: string;
  full_name: string;
  name?: string; // Legacy support
  date_of_birth: string;
  gender?: "M" | "F" | "O";
  contact_info?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  medical_record_number?: string;
}

export interface PatientUpdateRequest {
  full_name?: string;
  name?: string; // Legacy support
  date_of_birth?: string;
  gender?: "M" | "F" | "O";
  contact_info?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  medical_record_number?: string;
}

export interface PatientFilters {
  page?: number;
  page_size?: number;
  search?: string;
  gender?: "M" | "F" | "O";
  status?: string;
  min_age?: number;
  max_age?: number;
}

/**
 * List patients with optional filters and pagination
 *
 * @param filters - Optional filters and pagination
 *   - page: Page number (default 1, converted to skip/limit for backend)
 *   - page_size: Results per page (default 20)
 *   - search: Search by name, ID, or email
 *   - gender: Filter by gender (M, F, O)
 *   - status: Filter by status
 *   - min_age: Minimum age filter
 *   - max_age: Maximum age filter
 * @returns Paginated patients wrapped in response object
 * 
 * NOTE: Backend returns bare array, frontend wraps it for consistency
 */
export async function listPatients(
  filters?: PatientFilters
): Promise<PatientListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  // Backend uses skip/limit pagination, convert from page-based
  const page = filters?.page || 1;
  const pageSize = filters?.page_size || 20;
  const skip = (page - 1) * pageSize;
  
  params.append("skip", skip.toString());
  params.append("limit", pageSize.toString());

  if (filters) {
    if (filters.search) params.append("q", filters.search); // Backend uses 'q' not 'search'
    if (filters.gender) params.append("gender", filters.gender);
    if (filters.status) params.append("status", filters.status);
    if (filters.min_age !== undefined) params.append("min_age", filters.min_age.toString());
    if (filters.max_age !== undefined) params.append("max_age", filters.max_age.toString());
  }

  const queryString = params.toString();
  const url = `/patients${queryString ? `?${queryString}` : ""}`;

  // Backend returns bare array: PatientResponse[]
  // Frontend wraps it for consistency with other endpoints
  const items = await get<Patient[]>(url, {
    authToken: token ?? undefined,
  });

  // Wrap in response object for consistent UI handling
  return {
    total: items.length, // Approximate; backend doesn't provide actual total
    page,
    page_size: pageSize,
    items: items,
  };
}

/**
 * Get a single patient by ID
 *
 * @param patientId - Patient ID
 * @returns Patient details
 */
export async function getPatient(patientId: string): Promise<Patient> {
  const token = getAccessToken();
  return get<Patient>(`/patients/${patientId}`, {
    authToken: token ?? undefined,
  });
}

/**
 * Create a new patient
 *
 * @param data - Patient creation payload
 * @returns Created patient
 */
export async function createPatient(data: PatientCreateRequest): Promise<Patient> {
  const token = getAccessToken();
  return post<Patient>("/patients", data, {
    authToken: token ?? undefined,
  });
}

/**
 * Update a patient
 *
 * @param patientId - Patient ID
 * @param data - Update payload
 * @returns Updated patient
 */
export async function updatePatient(
  patientId: string,
  data: PatientUpdateRequest
): Promise<Patient> {
  const token = getAccessToken();
  return put<Patient>(`/patients/${patientId}`, data, {
    authToken: token ?? undefined,
  });
}

/**
 * Delete a patient
 *
 * @param patientId - Patient ID
 * @returns void
 */
export async function deletePatient(patientId: string): Promise<void> {
  const token = getAccessToken();
  return del(`/patients/${patientId}`, {
    authToken: token ?? undefined,
  });
}

/**
 * Search patients by name or MRN (uses dedicated /search endpoint)
 *
 * @param query - Search query (min length 1)
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Search results
 */
export async function searchPatients(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PatientListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  // Backend search endpoint uses 'q' parameter
  params.append("q", query);
  
  // Backend uses skip/limit pagination, convert from page-based
  const skip = (page - 1) * pageSize;
  params.append("skip", skip.toString());
  params.append("limit", pageSize.toString());

  const queryString = params.toString();
  const url = `/patients/search${queryString ? `?${queryString}` : ""}`;

  // Backend returns bare array: PatientResponse[]
  const items = await get<Patient[]>(url, {
    authToken: token ?? undefined,
  });

  // Wrap in response object for consistent UI handling
  return {
    total: items.length,
    page,
    page_size: pageSize,
    items: items,
  };
}
