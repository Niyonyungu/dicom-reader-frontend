/**
 * DICOM Service
 * Handles DICOM file upload and management
 * 
 * Endpoints:
 * - POST /dicom/upload — upload DICOM files (multipart/form-data)
 * - GET /dicom — list DICOM instances (paginated)
 * - GET /dicom/{id} — get single DICOM instance metadata
 * - GET /dicom/{id}/download — download DICOM file (returns binary)
 * - DELETE /dicom/{id} — delete DICOM instance
 * 
 * Permission requirements:
 * - dicom.upload (for POST /dicom/upload)
 * - dicom.read (for GET)
 * - dicom.delete (for DELETE)
 */

import axios, { AxiosProgressEvent } from "axios";
import {
  DicomUploadResponse,
  DicomListResponse,
  DicomListFilters,
  DicomInstance,
  UploadStatusResponse,
  FileValidationResponse,
  BatchValidationResponse,
} from "@/types/clinical-api";
import { getAccessToken } from "@/lib/token-storage";
import { parseApiError, ApiError } from "@/lib/api-errors";
import { post, get, del, request } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_ROOT = `${BASE_URL}/api/v1`;

/**
 * Upload DICOM files to a study
 * 
 * Sends files as multipart/form-data. Progress callback optional for UI feedback.
 * Requires dicom.upload permission
 * 
 * @param studyId - Target study ID
 * @param files - Array of DICOM files to upload
 * @param options - Optional config (series info, progress callback)
 * @returns DicomUploadResponse with instance metadata
 * @throws ApiError on failure (400 for invalid files, 403 for permission, 413 for file too large)
 * 
 * @example
 * ```ts
 * const fileInput = document.querySelector('input[type="file"]');
 * const files = Array.from(fileInput.files || []);
 * 
 * try {
 *   const response = await dicomService.uploadDicom(123, files, {
 *     seriesDescription: 'Chest CT',
 *     onProgress: (percent) => console.log(`${percent}% uploaded`)
 *   });
 *   console.log(`Uploaded ${response.uploaded_count} instances`);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.status === 413) {
 *       console.error('File too large (max 2GB per file)');
 *     } else if (error.status === 400) {
 *       console.error('Invalid DICOM file');
 *     }
 *   }
 * }
 * ```
 */
export async function uploadDicom(
  studyId: number,
  files: File[],
  options?: {
    seriesUid?: string;
    seriesNumber?: number;
    seriesDescription?: string;
    onProgress?: (progressPercent: number) => void;
  }
): Promise<DicomUploadResponse> {
  if (files.length === 0) {
    throw new Error("No files provided for upload");
  }

  const formData = new FormData();
  formData.append("study_id", studyId.toString());

  if (options?.seriesUid) {
    formData.append("series_uid", options.seriesUid);
  }
  if (options?.seriesNumber) {
    formData.append("series_number", options.seriesNumber.toString());
  }
  if (options?.seriesDescription) {
    formData.append("series_description", options.seriesDescription);
  }

  // Append all files
  files.forEach((file) => {
    formData.append("file", file);
  });

  const token = getAccessToken();

  try {
    const response = await post<DicomUploadResponse>(
      "/dicom/upload",
      formData,
      {
        authToken: token || undefined,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            options.onProgress(percent);
          }
        },
        timeout: 600000, // 10 minutes for large uploads
      }
    );

    return response;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    const apiError = parseApiError(error);
    
    // Log request ID in development
    if (process.env.NODE_ENV === "development" && apiError.requestId) {
      console.error(`[DICOM Upload] Request ID: ${apiError.requestId}`);
    }

    throw apiError;
  }
}

/**
 * List DICOM instances with optional filters and pagination
 * 
 * @param filters - Optional filters and pagination params
 * @returns DicomListResponse with paginated instances
 * @throws ApiError on failure (403 if missing dicom.read permission)
 * 
 * @example
 * ```ts
 * const response = await dicomService.listDicom({
 *   study_id: 123,
 *   page: 1,
 *   page_size: 50
 * });
 * ```
 */
export async function listDicom(filters?: DicomListFilters): Promise<DicomListResponse> {
  const token = getAccessToken();

  return get<DicomListResponse>("/dicom", {
    authToken: token || undefined,
    body: filters, // get() helper in api-client uses body for params
  });
}

/**
 * Get metadata for a single DICOM instance
 * 
 * @param instanceId - DICOM instance ID
 * @returns DicomInstance metadata
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * const instance = await dicomService.getDicom(456);
 * console.log(instance.file_size, instance.modality);
 * ```
 */
export async function getDicom(instanceId: number): Promise<DicomInstance> {
  const token = getAccessToken();

  return get<DicomInstance>(`/dicom/${instanceId}`, {
    authToken: token || undefined,
  });
}

/**
 * Download a DICOM file as binary
 * 
 * Returns the raw DICOM file data suitable for loading into a viewer.
 * 
 * @param instanceId - DICOM instance ID
 * @returns Binary DICOM file data (Blob)
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * const dicomBlob = await dicomService.downloadDicom(456);
 * // Send to viewer or save to disk
 * const url = URL.createObjectURL(dicomBlob);
 * ```
 */
export async function downloadDicom(instanceId: number): Promise<Blob> {
  const token = getAccessToken();

  return request<Blob>("GET", `/dicom/${instanceId}/download`, {
    authToken: token || undefined,
    responseType: "blob",
    headers: {
      Accept: "application/dicom, application/octet-stream",
    },
  });
}

/**
 * Delete a DICOM instance
 * Requires dicom.delete permission
 * 
 * @param instanceId - DICOM instance ID to delete
 * @throws ApiError on failure (404 if not found, 403 for permission)
 * 
 * @example
 * ```ts
 * await dicomService.deleteDicom(456);
 * console.log('Instance deleted');
 * ```
 */
export async function deleteDicom(instanceId: number): Promise<void> {
  const token = getAccessToken();

  return del(`/dicom/${instanceId}`, {
    authToken: token || undefined,
  });
}

/**
 * Get all DICOM instances for a study
 * Convenience method combining listDicom with study filter
 * 
 * @param studyId - Study ID
 * @param page - Page number (default: 1)
 * @param pageSize - Instances per page (default: 50)
 * @returns DicomListResponse filtered to study
 * 
 * @example
 * ```ts
 * const instances = await dicomService.getStudyDicom(123, 1, 50);
 * ```
 */
export async function getStudyDicom(
  studyId: number,
  page?: number,
  pageSize?: number
): Promise<DicomListResponse> {
  return listDicom({
    study_id: studyId,
    page,
    page_size: pageSize,
  });
}

/**
 * Get all DICOM instances for a series
 * Convenience method for series filtering
 * 
 * @param seriesUid - Series UID
 * @param page - Page number (default: 1)
 * @param pageSize - Instances per page (default: 50)
 * @returns DicomListResponse filtered by series
 * 
 * @example
 * ```ts
 * const seriesInstances = await dicomService.getSeriesDicom('1.2.3.4');
 * ```
 */
export async function getSeriesDicom(
  seriesUid: string,
  page?: number,
  pageSize?: number
): Promise<DicomListResponse> {
  return listDicom({
    series_uid: seriesUid,
    page,
    page_size: pageSize,
  });
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate DICOM files before upload
 * 
 * Quick validation to check files are valid DICOM before starting upload.
 * Useful for UX feedback before triggering expensive upload process.
 * 
 * @param files - Files to validate
 * @returns BatchValidationResponse with validation results
 * @throws ApiError on validation failure
 * 
 * @example
 * ```ts
 * const fileInput = document.querySelector('input[type="file"]');
 * const files = Array.from(fileInput.files || []);
 * 
 * const validation = await dicomService.validateDicom(files);
 * console.log(`Valid: ${validation.valid_count}/${validation.total}`);
 * 
 * if (validation.invalid_count > 0) {
 *   console.log('Invalid files:');
 *   validation.results.filter(r => !r.valid).forEach(r => {
 *     console.log(`${r.filename}: ${r.error}`);
 *   });
 * }
 * ```
 */
export async function validateDicom(files: File[]): Promise<BatchValidationResponse> {
  if (files.length === 0) {
    throw new Error("No files provided for validation");
  }

  // Log file details for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`[DICOM Validate] Validating ${files.length} files:`, 
      files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    );
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("file", file);
  });

  const token = getAccessToken();

  try {
    const response = await post<BatchValidationResponse>(
      "/dicom/validate",
      formData,
      {
        authToken: token || undefined,
        timeout: 30000, // 30 seconds for validation
      }
    );

    return response;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    const apiError = parseApiError(error);
    
    // Log full error details for debugging
    if (process.env.NODE_ENV === "development") {
      console.error(`[DICOM Validate] Request failed:`, {
        status: apiError.status,
        errorCode: apiError.errorCode,
        message: apiError.message,
        details: apiError.details,
        requestId: apiError.requestId,
      });
    }

    throw apiError;
  }
}

// ============================================================================
// UPLOAD STATUS TRACKING
// ============================================================================

/**
 * Check upload status with real-time progress
 * 
 * Poll this endpoint to get progress on an ongoing upload.
 * Backend processes files asynchronously; use the upload_id returned
 * from uploadDicom() to track progress.
 * 
 * @param uploadId - Upload ID from uploadDicom response
 * @param taskId - Optional task ID for backend job tracking
 * @returns UploadStatusResponse with current progress
 * @throws ApiError on failure (404 if upload not found, 410 if expired)
 * 
 * @example
 * ```ts
 * // Start upload
 * const uploadResponse = await dicomService.uploadDicom(123, files);
 * const uploadId = uploadResponse.id; // if returned
 * 
 * // Poll for progress
 * const pollInterval = setInterval(async () => {
 *   const status = await dicomService.checkUploadStatus(uploadId);
 *   console.log(`Progress: ${status.progress_percent}%`);
 *   console.log(`Processing: ${status.current_file}`);
 *   
 *   if (status.status === 'completed') {
 *     clearInterval(pollInterval);
 *     console.log(`Done! Uploaded ${status.uploaded_count} instances`);
 *   } else if (status.status === 'failed') {
 *     clearInterval(pollInterval);
 *     console.error(`Upload failed: ${status.error_message}`);
 *   }
 * }, 1000); // Poll every second
 * ```
 */
export async function checkUploadStatus(
  uploadId: string,
  taskId?: string
): Promise<UploadStatusResponse> {
  const token = getAccessToken();

  try {
    const params = new URLSearchParams();
    if (taskId) {
      params.append("task_id", taskId);
    }

    const url = `${API_ROOT}/dicom/upload-status/${uploadId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await axios.get<UploadStatusResponse>(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return response.data;
  } catch (error: any) {
    const apiError = parseApiError(error);
    
    if (process.env.NODE_ENV === "development" && apiError.requestId) {
      console.error(
        `[DICOM Status] Request ID: ${apiError.requestId}`,
        `Upload ID: ${uploadId}`
      );
    }

    throw apiError;
  }
}

/**
 * Poll upload status until completion
 * 
 * Convenience method that polls status endpoint continuously until
 * upload completes or fails. Returns when final state is reached.
 * 
 * @param uploadId - Upload ID
 * @param onProgress - Callback for progress updates
 * @param pollIntervalMs - Poll interval in milliseconds (default: 1000)
 * @returns Final UploadStatusResponse (completed or failed)
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * try {
 *   const finalStatus = await dicomService.waitForUpload(
 *     uploadId,
 *     (status) => {
 *       console.log(`${status.progress_percent}%: ${status.current_file}`);
 *     }
 *   );
 *   
 *   if (finalStatus.status === 'completed') {
 *     console.log(`Uploaded ${finalStatus.uploaded_count} instances`);
 *   }
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 * ```
 */
export async function waitForUpload(
  uploadId: string,
  onProgress?: (status: UploadStatusResponse) => void,
  pollIntervalMs: number = 1000
): Promise<UploadStatusResponse> {
  let status = await checkUploadStatus(uploadId);
  
  while (status.status === 'pending' || status.status === 'processing') {
    if (onProgress) {
      onProgress(status);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    // Get updated status
    status = await checkUploadStatus(uploadId);
  }

  // Final callback with completed state
  if (onProgress) {
    onProgress(status);
  }

  return status;
}

export const dicomService = {
  uploadDicom,
  validateDicom,
  checkUploadStatus,
  waitForUpload,
  listDicom,
  getDicom,
  downloadDicom,
  deleteDicom,
  getStudyDicom,
  getSeriesDicom,
};
