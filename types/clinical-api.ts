/**
 * Clinical API Types
 * Aligned with FastAPI backend responses (snake_case in JSON)
 */

// ============================================================================
// STUDIES
// ============================================================================

export interface Study {
  id: number;
  patient_id: number;
  study_uid: string;
  study_date: string; // ISO date format
  study_time?: string;
  modality: string; // e.g., CT, MR, XR, US, NM, PT, RT, etc.
  description?: string;
  institution_name?: string;
  referring_physician?: string;
  study_status: 'pending' | 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  instance_count?: number; // Number of DICOM instances in study
}

export interface StudyListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Study[];
}

export interface StudyCreateRequest {
  patient_id: number;
  study_uid: string;
  study_date: string;
  study_time?: string;
  modality: string;
  description?: string;
  institution_name?: string;
  referring_physician?: string;
}

export interface StudyUpdateRequest {
  study_date?: string;
  study_time?: string;
  description?: string;
  institution_name?: string;
  referring_physician?: string;
  study_status?: 'pending' | 'in_progress' | 'completed' | 'archived';
}

// ============================================================================
// DICOM (Files/Instances)
// ============================================================================

export interface DicomInstance {
  id: number;
  study_id: number;
  series_uid: string;
  series_number: number;
  series_description?: string;
  instance_uid: string;
  instance_number: number;
  sop_class_uid: string;
  modality: string;
  file_path: string;
  file_size: number; // in bytes
  created_at: string;
  updated_at: string;
  // Metadata from DICOM tags (optional, may vary by backend)
  patient_position?: string;
  image_type?: string;
  body_part_examined?: string;
}

export interface DicomListResponse {
  total: number;
  page: number;
  page_size: number;
  items: DicomInstance[];
}

export interface DicomUploadRequest {
  study_id: number;
  series_uid?: string;
  series_number?: number;
  series_description?: string;
  // Files are sent as multipart/form-data
  // Field name: "files" (array of File objects)
}

export interface DicomUploadResponse {
  success: boolean;
  uploaded_count: number;
  failed_count: number;
  instances: DicomInstance[];
  errors?: Array<{
    filename: string;
    error: string;
  }>;
}

// ============================================================================
// MEASUREMENTS
// ============================================================================

export type MeasurementType = 
  | 'distance' 
  | 'angle' 
  | 'area' 
  | 'roi' 
  | 'hounsfield_unit' 
  | 'volume';

export interface Measurement {
  id: number;
  instance_id: number;
  study_id: number;
  measurement_type: MeasurementType;
  label?: string;
  points: Array<{ x: number; y: number; z?: number }>;
  value?: number; // Measurement result (distances in mm, angles in degrees, areas in mm², volumes in mm³)
  unit?: string; // e.g., 'mm', 'degrees', 'mm²', 'mm³'
  tool_settings?: Record<string, any>; // Tool-specific settings
  radiologist_note?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // User who created measurement
}

export interface MeasurementListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Measurement[];
}

export interface MeasurementCreateRequest {
  instance_id: number;
  study_id: number;
  measurement_type: MeasurementType;
  label?: string;
  points: Array<{ x: number; y: number; z?: number }>;
  value?: number;
  unit?: string;
  tool_settings?: Record<string, any>;
  radiologist_note?: string;
}

export interface MeasurementUpdateRequest {
  label?: string;
  points?: Array<{ x: number; y: number; z?: number }>;
  value?: number;
  tool_settings?: Record<string, any>;
  radiologist_note?: string;
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number; // Default: 1
  page_size?: number; // Default: 20, max: 100
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface StudyListFilters extends PaginationParams {
  patient_id?: number;
  modality?: string;
  study_date_from?: string; // ISO date
  study_date_to?: string; // ISO date
  status?: 'pending' | 'in_progress' | 'completed' | 'archived';
  search?: string; // Search in description, patient name, etc.
}

export interface DicomListFilters extends PaginationParams {
  study_id?: number;
  series_uid?: string;
  modality?: string;
  search?: string;
}

export interface MeasurementListFilters extends PaginationParams {
  study_id?: number;
  instance_id?: number;
  measurement_type?: MeasurementType;
  search?: string;
}
