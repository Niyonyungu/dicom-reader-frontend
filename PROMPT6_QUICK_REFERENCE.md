# Prompt 6 Quick Reference

## What Was Built

Three production-ready service layers for clinical features:

### 1. **Studies Service** (`services/studies-service.ts`)

CRUD for medical studies

```typescript
import { studiesService } from "@/services/studies-service";

// List all studies
const response = await studiesService.listStudies({ modality: "CT", page: 1 });

// Create study
const study = await studiesService.createStudy({
  patient_id: 1,
  study_uid: "1.2.3.4.5",
  study_date: "2024-01-15",
  modality: "CT",
});

// Update study
await studiesService.updateStudy(123, { study_status: "completed" });

// Delete study
await studiesService.deleteStudy(123);

// Convenience methods
await studiesService.getPatientStudies(patientId);
await studiesService.getStudiesByModality("CT");
await studiesService.getStudiesByDateRange("2024-01-01", "2024-01-31");
await studiesService.searchStudies("chest");
```

**Permissions:** `study.read`, `study.write`, `study.delete`

### 2. **DICOM Service** (`services/dicom-service.ts`)

Upload, list, download DICOM files with multipart support

```typescript
import { dicomService } from "@/services/dicom-service";

// Upload files (multipart/form-data automatically handled)
const fileInput = document.querySelector('input[type="file"]');
const files = Array.from(fileInput.files || []);

const result = await dicomService.uploadDicom(studyId, files, {
  seriesDescription: "Chest CT",
  onProgress: (percent) => console.log(`${percent}% uploaded`),
});
console.log(`Uploaded ${result.uploaded_count} instances`);

// List instances for study
const instances = await dicomService.getStudyDicom(studyId, page, pageSize);

// Download single file (returns Blob)
const dicomBlob = await dicomService.downloadDicom(instanceId);

// Delete instance
await dicomService.deleteDicom(instanceId);

// Get series
await dicomService.getSeriesDicom(seriesUid);
```

**Permissions:** `dicom.upload`, `dicom.read`, `dicom.delete`

### 3. **Measurements Service** (`services/measurements-service.ts`)

Track clinical measurements (distance, angle, area, ROI, HU, volume)

```typescript
import { measurementsService } from "@/services/measurements-service";

// Create measurement
const measurement = await measurementsService.createMeasurement({
  instance_id: 456,
  study_id: 123,
  measurement_type: "distance",
  points: [
    { x: 100, y: 200 },
    { x: 150, y: 250 },
  ],
  value: 70.5,
  unit: "mm",
});

// List measurements
const response = await measurementsService.listMeasurements({
  study_id: 123,
  measurement_type: "distance",
});

// Update
await measurementsService.updateMeasurement(id, {
  label: "Updated label",
  radiologist_note: "Important note",
});

// Delete
await measurementsService.deleteMeasurement(id);

// Convenience methods
await measurementsService.getStudyMeasurements(studyId);
await measurementsService.getInstanceMeasurements(instanceId);
await measurementsService.getMeasurementsByType("distance");
await measurementsService.searchMeasurements("tumor");
```

**Permissions:** `measurement.read`, `measurement.write`, `measurement.delete`

## Integration Pattern

All three services follow the same pattern:

```typescript
// 1. Import service
import { studiesService } from '@/services/studies-service';

// 2. In component, use hook to check permissions and handle loading
import { useStudies } from '@/hooks/use-clinical-api';

const { data, loading, error, hasPermission, retry } = useStudies();

// 3. Show appropriate UI
if (!hasPermission) return <PermissionDenied permission="study.read" />;
if (loading) return <StudiesLoadingSkeleton />;
if (error) return <ErrorState message={error.message} onRetry={retry} />;

// 4. Render data
return <StudiesTable studies={data?.items || []} />;
```

## Available Hooks

All hooks handle permissions, loading, errors, retries:

```typescript
// Studies
const { data: StudyListResponse, loading, error, hasPermission, retry } = useStudies(filters?, skip?);
const { data: Study, loading, error, hasPermission, retry } = useStudy(studyId?, skip?);

// DICOM
const { data: DicomListResponse, loading, error, hasPermission, retry } = useDicom(filters?, skip?);
const { upload, loading, error, progress, hasPermission } = useDicomUpload(studyId);

// Measurements
const { data: MeasurementListResponse, loading, error, hasPermission, retry } = useMeasurements(filters?, skip?);
```

## UI Components

Helpers for common patterns:

```typescript
import {
  StudiesLoadingSkeleton,
  DicomLoadingSkeleton,
  MeasurementsLoadingSkeleton,
  LoadingSkeleton,
  NoStudiesState,
  NoDicomState,
  NoMeasurementsState,
  EmptyState,
  ErrorState,
  NetworkError,
  ServerError,
  PermissionDenied,
  PermissionDeniedBanner,
  UploadProgress,
  RequestIdBadge
} from '@/components/clinical-ui-helpers';

// Permission denied
<PermissionDenied permission="study.read" />;

// Loading
<StudiesLoadingSkeleton />;

// Empty
<NoStudiesState onAddStudy={() => {}} />;

// Error with retry
<ErrorState
  message={error.message}
  onRetry={retry}
/>;

// Upload progress
<UploadProgress progress={progress} fileName={file.name} />;

// Development request ID
<RequestIdBadge requestId={error.requestId} />;
```

## Types

All types align with backend API (snake_case in JSON):

```typescript
import {
  Study,
  StudyListResponse,
  StudyCreateRequest,
  StudyUpdateRequest,
  StudyListFilters,
  DicomInstance,
  DicomListResponse,
  DicomUploadResponse,
  DicomListFilters,
  Measurement,
  MeasurementListResponse,
  MeasurementCreateRequest,
  MeasurementListFilters,
  MeasurementType,
  PaginationParams,
  PaginationMeta,
} from "@/types/clinical-api";
```

## Permission Matrix

| Action             | Permission           | Role(s)                                          |
| ------------------ | -------------------- | ------------------------------------------------ |
| View studies       | `study.read`         | All                                              |
| Create study       | `study.write`        | admin, service, radiologist                      |
| Update study       | `study.write`        | admin, service, radiologist                      |
| Delete study       | `study.delete`       | admin                                            |
| Upload DICOM       | `dicom.upload`       | admin, service, imaging_technician, radiographer |
| View DICOM         | `dicom.read`         | All authenticated users                          |
| Delete DICOM       | `dicom.delete`       | admin                                            |
| Create measurement | `measurement.write`  | radiologist, imaging_technician                  |
| View measurements  | `measurement.read`   | All authenticated users                          |
| Update measurement | `measurement.write`  | radiologist, imaging_technician                  |
| Delete measurement | `measurement.delete` | radiologist, admin                               |

## Error Handling

All services throw `ApiError` with these properties:

```typescript
interface ApiError {
  status: number; // HTTP status (400, 401, 403, 404, 500, etc)
  errorCode?: string; // Backend error code
  message: string; // Human-readable message
  details?: any; // Validation errors, etc.
  requestId?: string; // For support/debugging
}
```

**Common cases:**

```typescript
try {
  await studiesService.listStudies();
} catch (error) {
  const apiError = error as ApiError;

  if (apiError.status === 403) {
    // Missing permission - show PermissionDenied
  } else if (apiError.status === 404) {
    // Not found - go back
  } else if (apiError.status === 400) {
    // Validation error - show field errors
  } else if (apiError.status >= 500) {
    // Server error - show ErrorState with request ID
  }
}
```

## File Upload Example

Complete upload with progress and error handling:

```typescript
import { useDicomUpload } from '@/hooks/use-clinical-api';
import { UploadProgress, ErrorState } from '@/components/clinical-ui-helpers';

export function DicomUploader({ studyId }: { studyId: number }) {
  const { upload, loading, error, progress, hasPermission } = useDicomUpload(studyId);

  if (!hasPermission) {
    return <PermissionDenied permission="dicom.upload" />;
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    if (files.length === 0) return;

    try {
      const result = await upload(files, {
        seriesDescription: 'User Upload'
      });

      alert(`Successfully uploaded ${result.uploaded_count} instances`);

      if (result.failed_count > 0) {
        console.warn(`${result.failed_count} files failed:`, result.errors);
      }

      // Refresh study data
      // ...
    } catch (err) {
      // Error already in hook state
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        multiple
        accept=".dcm"
        onChange={handleFileSelect}
        disabled={loading}
      />

      {loading && <UploadProgress progress={progress} />}
      {error && <ErrorState message={error.message} />}
    </div>
  );
}
```

## Next Steps

1. **Update each clinical screen** using the patterns in this guide:
   - `/dashboard/worklist` → use `useStudies()`
   - `/dashboard/upload` → use `useDicomUpload()`
   - `/dashboard/viewer/[id]` → use `useDicom()` + `useMeasurements()`
   - `/dashboard/reports` → use `useMeasurements()`

2. **Test with backend running** at `http://localhost:8000`

3. **Check OpenAPI** for exact endpoint paths: `http://localhost:8000/openapi.json`

4. **Handle all error cases** with appropriate UI feedback

5. **Verify permissions** show correctly for your test user

## Files Created

```
services/
  ├── studies-service.ts (280 lines)
  ├── dicom-service.ts (320 lines)
  └── measurements-service.ts (260 lines)

hooks/
  └── use-clinical-api.ts (420 lines)

components/
  └── clinical-ui-helpers.tsx (380 lines)

types/
  └── clinical-api.ts (240 lines)

Documentation:
  ├── PROMPT6_IMPLEMENTATION_GUIDE.md (700+ lines)
  └── PROMPT6_QUICK_REFERENCE.md (this file)
```

## Support

- **Permission errors?** Check `user.permissions` in auth context
- **API path wrong?** Check `http://localhost:8000/openapi.json`
- **Request failed?** Use `RequestIdBadge` to show request ID in development
- **Backend not running?** Start with `uvicorn app.main:app --reload`

For full API contract details, see [PROMPT6_IMPLEMENTATION_GUIDE.md](PROMPT6_IMPLEMENTATION_GUIDE.md).
