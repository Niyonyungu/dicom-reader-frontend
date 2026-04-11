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
  name: string;
  date_of_birth: string;
  gender?: "M" | "F" | "O";
  age?: number;
  contact_info?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  medical_record_number?: string;
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
  name: string;
  date_of_birth: string;
  gender?: "M" | "F" | "O";
  contact_info?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  medical_record_number?: string;
}

export interface PatientUpdateRequest {
  name?: string;
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
  gender?: string;
}

/**
 * List patients with optional filters
 *
 * @param filters - Optional filters and pagination
 * @returns Paginated patients
 */
export async function listPatients(
  filters?: PatientFilters
): Promise<PatientListResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.gender) params.append("gender", filters.gender);
  }

  const queryString = params.toString();
  const url = `/patients${queryString ? `?${queryString}` : ""}`;

  return get<PatientListResponse>(url, {
    authToken: token ?? undefined,
  });
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
 * Search patients by name or MRN
 *
 * @param query - Search query
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
  return listPatients({
    search: query,
    page,
    page_size: pageSize,
  });
}
