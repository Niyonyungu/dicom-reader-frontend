/**
 * Clinical API Hooks
 * React hooks for using clinical services with permission gates and error handling
 * 
 * These hooks provide:
 * - Permission checking before API calls
 * - Loading and error states
 * - 403 permission error handling
 * - Network error handling
 * - Automatic token attachment
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-client";
import {
  Study,
  StudyListResponse,
  StudyCreateRequest,
  StudyUpdateRequest,
  StudyListFilters,
  DicomInstance,
  DicomListResponse,
  DicomListFilters,
  Measurement,
  MeasurementListResponse,
  MeasurementCreateRequest,
  MeasurementListFilters,
} from "@/types/clinical-api";
import { studiesService } from "@/services/studies-service";
import { dicomService } from "@/services/dicom-service";
import { measurementsService } from "@/services/measurements-service";

// ============================================================================
// TYPES
// ============================================================================

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  hasPermission: boolean;
}

interface UseAsyncActions<T> {
  retry: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// STUDIES HOOKS
// ============================================================================

/**
 * Hook: Fetch list of studies
 * 
 * Handles:
 * - Permission checking (study.read)
 * - Loading and error states
 * - Network error handling
 * - 403 permission errors
 * 
 * @param filters - Optional filters (pagination, modality, date range, etc.)
 * @param skip - If true, skip loading initially (useful for conditional loads)
 * 
 * @example
 * ```tsx
 * const { data, loading, error, hasPermission, retry } = useStudies({ modality: 'CT' });
 * 
 * if (!hasPermission) return <div>You don't have permission to view studies</div>;
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} onRetry={retry} />;
 * 
 * return <StudiesTable studies={data?.items || []} />;
 * ```
 */
export function useStudies(
  filters?: StudyListFilters,
  skip?: boolean
): UseAsyncState<StudyListResponse> & UseAsyncActions<void> {
  const { can } = useAuth();
  const [data, setData] = useState<StudyListResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const hasPermission = can("study.read");

  const fetch = useCallback(async () => {
    if (!hasPermission) {
      setError(new Error("Missing permission: study.read"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await studiesService.listStudies(filters);
      setData(response);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 403) {
        setError(new Error("You don't have permission to view studies"));
      } else {
        setError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, hasPermission]);

  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [skip, fetch]);

  return {
    data,
    loading,
    error,
    hasPermission,
    retry: fetch,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

/**
 * Hook: Fetch single study by ID
 * 
 * @param studyId - Study ID to fetch
 * @param skip - If true, skip loading initially
 * 
 * @example
 * ```tsx
 * const { data: study, loading, error } = useStudy(123);
 * ```
 */
export function useStudy(
  studyId?: number,
  skip?: boolean
): UseAsyncState<Study> & UseAsyncActions<void> {
  const { can } = useAuth();
  const [data, setData] = useState<Study | null>(null);
  const [loading, setLoading] = useState(!skip && !!studyId);
  const [error, setError] = useState<Error | null>(null);
  const hasPermission = can("study.read");

  const fetch = useCallback(async () => {
    if (!studyId || !hasPermission) {
      setError(
        new Error(
          !hasPermission
            ? "Missing permission: study.read"
            : "No study ID provided"
        )
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const study = await studiesService.getStudy(studyId);
      setData(study);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 403) {
        setError(new Error("You don't have permission to view this study"));
      } else if (apiError.status === 404) {
        setError(new Error("Study not found"));
      } else {
        setError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [studyId, hasPermission]);

  useEffect(() => {
    if (!skip && studyId) {
      fetch();
    }
  }, [skip, studyId, fetch]);

  return {
    data,
    loading,
    error,
    hasPermission,
    retry: fetch,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

// ============================================================================
// DICOM HOOKS
// ============================================================================

/**
 * Hook: Fetch list of DICOM instances
 * 
 * @param filters - Optional filters (study_id, series_uid, modality, pagination)
 * @param skip - If true, skip loading initially
 * 
 * @example
 * ```tsx
 * const { data, loading } = useDicom({ study_id: 123, page_size: 50 });
 * ```
 */
export function useDicom(
  filters?: DicomListFilters,
  skip?: boolean
): UseAsyncState<DicomListResponse> & UseAsyncActions<void> {
  const { can } = useAuth();
  const [data, setData] = useState<DicomListResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const hasPermission = can("dicom.read");

  const fetch = useCallback(async () => {
    if (!hasPermission) {
      setError(new Error("Missing permission: dicom.read"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await dicomService.listDicom(filters);
      setData(response);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 403) {
        setError(new Error("You don't have permission to view DICOM files"));
      } else {
        setError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, hasPermission]);

  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [skip, fetch]);

  return {
    data,
    loading,
    error,
    hasPermission,
    retry: fetch,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

/**
 * Hook: Upload DICOM files
 * 
 * @param studyId - Target study ID for upload
 * 
 * @example
 * ```tsx
 * const { upload, loading, error, progress } = useDicomUpload(123);
 * 
 * const handleFileSelect = async (files: File[]) => {
 *   try {
 *     const result = await upload(files, { seriesDescription: 'Chest' });
 *     console.log(`Uploaded ${result.uploaded_count} instances`);
 *   } catch (err) {
 *     console.error('Upload failed:', err);
 *   }
 * };
 * ```
 */
export function useDicomUpload(studyId: number) {
  const { can } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const hasPermission = can("dicom.upload");

  const upload = useCallback(
    async (
      files: File[],
      options?: {
        seriesUid?: string;
        seriesNumber?: number;
        seriesDescription?: string;
      }
    ) => {
      if (!hasPermission) {
        const err = new Error("Missing permission: dicom.upload");
        setError(err);
        throw err;
      }

      try {
        setLoading(true);
        setError(null);
        setProgress(0);

        const response = await dicomService.uploadDicom(studyId, files, {
          ...options,
          onProgress: (percent) => setProgress(percent),
        });

        setProgress(100);
        return response;
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 403) {
          setError(new Error("You don't have permission to upload DICOM files"));
        } else if (apiError.status === 413) {
          setError(new Error("File too large (max 2GB per file)"));
        } else if (apiError.status === 400) {
          setError(new Error("Invalid DICOM file format"));
        } else {
          setError(apiError);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [studyId, hasPermission]
  );

  return {
    upload,
    loading,
    error,
    progress,
    hasPermission,
    reset: () => {
      setError(null);
      setProgress(0);
    },
  };
}

// ============================================================================
// MEASUREMENTS HOOKS
// ============================================================================

/**
 * Hook: Fetch list of measurements
 * 
 * @param filters - Optional filters (study_id, instance_id, measurement_type)
 * @param skip - If true, skip loading initially
 * 
 * @example
 * ```tsx
 * const { data, loading } = useMeasurements({ study_id: 123 });
 * ```
 */
export function useMeasurements(
  filters?: MeasurementListFilters,
  skip?: boolean
): UseAsyncState<MeasurementListResponse> & UseAsyncActions<void> {
  const { can } = useAuth();
  const [data, setData] = useState<MeasurementListResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const hasPermission = can("measurement.read");

  const fetch = useCallback(async () => {
    if (!hasPermission) {
      setError(new Error("Missing permission: measurement.read"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await measurementsService.listMeasurements(filters);
      setData(response);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 403) {
        setError(new Error("You don't have permission to view measurements"));
      } else {
        setError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, hasPermission]);

  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [skip, fetch]);

  return {
    data,
    loading,
    error,
    hasPermission,
    retry: fetch,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

export const clinicalHooks = {
  useStudies,
  useStudy,
  useDicom,
  useDicomUpload,
  useMeasurements,
};
