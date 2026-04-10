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
  DicomInstance,
  DicomListResponse,
  DicomUploadResponse,
  DicomListFilters,
} from "@/types/clinical-api";
import { getAccessToken } from "@/lib/token-storage";
import { parseApiError, ApiError } from "@/lib/api-errors";

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
    formData.append("files", file);
  });

  const token = getAccessToken();

  try {
    const response = await axios.post<DicomUploadResponse>(
      `${API_ROOT}/dicom/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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

    return response.data;
  } catch (error: any) {
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

  try {
    const response = await axios.get<DicomListResponse>(`${API_ROOT}/dicom`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      params: filters,
    });

    return response.data;
  } catch (error: any) {
    throw parseApiError(error);
  }
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

  try {
    const response = await axios.get<DicomInstance>(
      `${API_ROOT}/dicom/${instanceId}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw parseApiError(error);
  }
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

  try {
    const response = await axios.get(
      `${API_ROOT}/dicom/${instanceId}/download`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        responseType: "blob",
      }
    );

    return response.data;
  } catch (error: any) {
    throw parseApiError(error);
  }
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

  try {
    await axios.delete(`${API_ROOT}/dicom/${instanceId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  } catch (error: any) {
    throw parseApiError(error);
  }
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

export const dicomService = {
  uploadDicom,
  listDicom,
  getDicom,
  downloadDicom,
  deleteDicom,
  getStudyDicom,
  getSeriesDicom,
};
