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
// SERIES
// ============================================================================

export interface Series {
  id?: number;
  study_id?: number;
  series_uid: string;
  series_number: number;
  series_description?: string;
  modality: string;
  instance_count: number; // Number of instances in series
  file_size?: number; // Total file size in bytes
  created_at?: string;
  updated_at?: string;
}

export interface SeriesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Series[];
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

// Upload status tracking (from backend job queue)
export interface UploadStatusResponse {
  upload_id: string;
  task_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  uploaded_count: number;
  failed_count: number;
  total_count: number;
  current_file?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  results?: DicomUploadResponse;
}

// File validation response
export interface FileValidationResponse {
  valid: boolean;
  filename: string;
  file_size: number;
  error?: string;
  warning?: string;
}

// Batch validation response
export interface BatchValidationResponse {
  total: number;
  valid_count: number;
  invalid_count: number;
  results: FileValidationResponse[];
}

// ============================================================================
// DICOM RENDERING & VIEWING
// ============================================================================

export type RenderPreset = 'lung' | 'bone' | 'brain' | 'mediastinum';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type RotationAngle = 0 | 90 | 180 | 270;
export type FilterType = 'none' | 'sharpen' | 'smooth' | 'edge_detect';

export interface DicomTag {
  tag: string; // e.g., "0008,0020" (group,element in hex)
  keyword?: string; // e.g., "StudyDate"
  vr?: string; // Value Representation (e.g., "DA", "SH", "UI")
  vm?: string; // Value Multiplicity (e.g., "1", "1-n")
  value: any; // The actual value (string, number, array, or complex)
  description?: string; // Human-readable description
}

export interface DicomInfo {
  instance_uid: string;
  instance_number: number;
  sop_class_uid: string;
  modality: string;
  manufacturer?: string;
  manufacturer_model_name?: string;
  study_date?: string;
  study_time?: string;
  series_number?: number;
  series_description?: string;
  patient_name?: string;
  patient_id?: string;
  patient_birth_date?: string;
  patient_age?: string;
  patient_sex?: string;
  body_part_examined?: string;
  anatomical_orientation_type?: string;
  tags: DicomTag[];
}

export interface RenderParams {
  format?: ImageFormat; // Default: 'png'
  preset?: RenderPreset; // Quick presets or custom HU values
  window_center?: number; // Custom window center in HU
  window_width?: number; // Custom window width in HU
  zoom?: number; // 1.0 to 4.0, default 1.0
  rotate?: RotationAngle; // 0, 90, 180, 270, default 0
  flip_horizontal?: boolean;
  flip_vertical?: boolean;
  filter?: FilterType; // Default: 'none'
}

export interface InstanceImageResponse {
  url: string; // Rendered image URL with ETag
  format: ImageFormat;
  etag?: string; // For cache validation
  cache_key?: string; // For client-side cache
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
// AUDIT LOGS
// ============================================================================

export interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: string; // e.g., 'VIEW_STUDY', 'CREATE_MEASUREMENT', 'DELETE_INSTANCE'
  entity_type: string; // e.g., 'Study', 'Instance', 'Measurement'
  entity_id?: number;
  details?: Record<string, any>; // Additional context
  timestamp: string;
  ip_address?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditLog[];
}

export interface AuditLogFilters extends PaginationParams {
  user_id?: number;
  action?: string;
  entity_type?: string;
  entity_id?: number;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  date_from?: string; // ISO date
  date_to?: string; // ISO date
  search?: string;
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
