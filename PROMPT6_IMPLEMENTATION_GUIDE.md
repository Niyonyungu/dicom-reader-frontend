# Prompt 6 Implementation Guide: Clinical API Integration

## Overview

This guide shows how to replace mock data with real backend API calls for the clinical screens:

- **Studies management**
- **DICOM file handling** (upload, list, download)
- **Measurements** (create, update, delete)

**Implementation Status**: Architecture ready; component updates needed per-screen.

## Quick Start

### 1. Services Available

```typescript
// Studies
import { studiesService } from '@/services/studies-service';
await studiesService.listStudies({ modality: 'CT' });
await studiesService.getStudy(123);
await studiesService.createStudy({ ... });

// DICOM (with multipart upload)
import { dicomService } from '@/services/dicom-service';
await dicomService.uploadDicom(123, files, { onProgress: (%) => {} });
await dicomService.listDicom({ study_id: 123 });

// Measurements
import { measurementsService } from '@/services/measurements-service';
await measurementsService.listMeasurements({ study_id: 123 });
await measurementsService.createMeasurement({ ... });
```

### 2. Permission Gating

All components must check permissions **before** showing features:

```typescript
const { can, canAny } = useAuth();

// Check single permission
if (!can('study.read')) {
  return <PermissionDenied permission="study.read" />;
}

// Check any of multiple
if (!canAny(['dicom.upload', 'dicom.write'])) {
  return <PermissionDenied feature="upload DICOM files" />;
}
```

### 3. Loading & Error Handling

Use provided hooks and UI helpers:

```typescript
import { useStudies } from '@/hooks/use-clinical-api';
import { StudiesLoadingSkeleton, ErrorState } from '@/components/clinical-ui-helpers';

export function StudiesPage() {
  const { data, loading, error, hasPermission, retry } = useStudies();

  if (!hasPermission) return <PermissionDenied permission="study.read" />;
  if (loading) return <StudiesLoadingSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={retry} />;
  if (!data?.items.length) return <NoStudiesState />;

  return <StudiesTable studies={data.items} />;
}
```

## API Endpoints Reference

### Studies

| Method | Path                   | Permission   | Status Code        |
| ------ | ---------------------- | ------------ | ------------------ |
| GET    | `/api/v1/studies`      | study.read   | 200, 403           |
| GET    | `/api/v1/studies/{id}` | study.read   | 200, 403, 404      |
| POST   | `/api/v1/studies`      | study.write  | 201, 400, 403      |
| PUT    | `/api/v1/studies/{id}` | study.write  | 200, 400, 403, 404 |
| DELETE | `/api/v1/studies/{id}` | study.delete | 204, 403, 404      |

**Query Parameters (GET /studies):**

```
page: int (default: 1)
page_size: int (default: 20, max: 100)
patient_id: int (optional)
modality: str (optional, e.g., 'CT', 'MR')
study_date_from: str (optional, YYYY-MM-DD)
study_date_to: str (optional, YYYY-MM-DD)
status: str (optional, one of: pending, in_progress, completed, archived)
search: str (optional, searches description/patient name)
```

**Create/Update Request:**

```json
{
  "patient_id": 1,
  "study_uid": "1.2.3.4.5",
  "study_date": "2024-01-15",
  "study_time": "10:30:00",
  "modality": "CT",
  "description": "Chest CT",
  "institution_name": "Hospital ABC",
  "referring_physician": "Dr. Smith"
}
```

**Response:**

```json
{
  "id": 1,
  "patient_id": 1,
  "study_uid": "1.2.3.4.5",
  "study_date": "2024-01-15",
  "study_time": "10:30:00",
  "modality": "CT",
  "description": "Chest CT",
  "institution_name": "Hospital ABC",
  "referring_physician": "Dr. Smith",
  "study_status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "instance_count": 142
}
```

### DICOM (Files/Instances)

| Method | Path                          | Permission   | Content Type        |
| ------ | ----------------------------- | ------------ | ------------------- |
| POST   | `/api/v1/dicom/upload`        | dicom.upload | multipart/form-data |
| GET    | `/api/v1/dicom`               | dicom.read   | application/json    |
| GET    | `/api/v1/dicom/{id}`          | dicom.read   | application/json    |
| GET    | `/api/v1/dicom/{id}/download` | dicom.read   | application/dicom   |
| DELETE | `/api/v1/dicom/{id}`          | dicom.delete | -                   |

**Upload (multipart/form-data fields):**

```
study_id: number (required)
series_uid: string (optional)
series_number: number (optional)
series_description: string (optional)
files: Array<File> (required, name must be "files")
```

**Upload Response:**

```json
{
  "success": true,
  "uploaded_count": 3,
  "failed_count": 0,
  "instances": [
    {
      "id": 456,
      "study_id": 123,
      "series_uid": "1.2.3.4.5.1",
      "series_number": 1,
      "series_description": "Chest CT",
      "instance_uid": "1.2.3.4.5.1.1",
      "instance_number": 1,
      "sop_class_uid": "1.2.840.10008.5.1.4.1.1.2",
      "modality": "CT",
      "file_path": "studies/123/456/image.dcm",
      "file_size": 1048576,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "errors": []
}
```

**Error Response (failed upload):**

```json
{
  "success": false,
  "uploaded_count": 2,
  "failed_count": 1,
  "instances": [...],
  "errors": [
    {
      "filename": "invalid.txt",
      "error": "Not a valid DICOM file"
    }
  ]
}
```

### Measurements

| Method | Path                        | Permission         | Status Code        |
| ------ | --------------------------- | ------------------ | ------------------ |
| GET    | `/api/v1/measurements`      | measurement.read   | 200, 403           |
| POST   | `/api/v1/measurements`      | measurement.write  | 201, 400, 403      |
| GET    | `/api/v1/measurements/{id}` | measurement.read   | 200, 403, 404      |
| PUT    | `/api/v1/measurements/{id}` | measurement.write  | 200, 400, 403, 404 |
| DELETE | `/api/v1/measurements/{id}` | measurement.delete | 204, 403, 404      |

**Create Request:**

```json
{
  "instance_id": 456,
  "study_id": 123,
  "measurement_type": "distance",
  "label": "Tumor diameter",
  "points": [
    { "x": 100, "y": 200 },
    { "x": 150, "y": 250 }
  ],
  "value": 70.5,
  "unit": "mm",
  "radiologist_note": "Increased from baseline"
}
```

**Response:**

```json
{
  "id": 789,
  "instance_id": 456,
  "study_id": 123,
  "measurement_type": "distance",
  "label": "Tumor diameter",
  "points": [
    { "x": 100, "y": 200 },
    { "x": 150, "y": 250 }
  ],
  "value": 70.5,
  "unit": "mm",
  "radiologist_note": "Increased from baseline",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "created_by": "radiologist@hospital.com"
}
```

## Component Update Examples

### Example 1: Update Worklist Page

**Current (Mock Data):**

```typescript
// app/dashboard/worklist/page.tsx
export default function WorklistPage() {
  const { worklist } = useWorklist(); // Mock context
  return <WorklistTable items={worklist} />;
}
```

**New (Real API):**

```typescript
// app/dashboard/worklist/page.tsx
import { useStudies } from '@/hooks/use-clinical-api';
import { StudiesLoadingSkeleton, PermissionDenied } from '@/components/clinical-ui-helpers';

export default function WorklistPage() {
  const { data, loading, error, hasPermission, retry } = useStudies({
    page: 1,
    page_size: 20,
    status: 'pending'
  });

  if (!hasPermission) {
    return <PermissionDenied permission="study.read" />;
  }

  if (loading) return <StudiesLoadingSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={retry} />;
  if (!data?.items.length) return <NoStudiesState />;

  return <StudiesTable studies={data.items} />;
}
```

### Example 2: Update Upload Page

**Current (Mock Data):**

```typescript
// app/dashboard/upload/page.tsx
export default function UploadPage() {
  const { addWorklistItem } = useWorklist();

  const handleFilesSelected = (files: File[]) => {
    // Creates mock worklist item
    addWorklistItem({ ... });
  };

  return <DicomUploadArea onFilesSelected={handleFilesSelected} />;
}
```

**New (Real API):**

```typescript
// app/dashboard/upload/page.tsx
import { useDicomUpload } from '@/hooks/use-clinical-api';
import { useStudies } from '@/hooks/use-clinical-api';
import { UploadProgress, PermissionDenied, ErrorState } from '@/components/clinical-ui-helpers';

export default function UploadPage() {
  const { data: studies, hasPermission } = useStudies();
  const [selectedStudyId, setSelectedStudyId] = useState<number>();

  const { upload, loading, error, progress, hasPermission: canUpload } = useDicomUpload(
    selectedStudyId || 0
  );

  if (!canUpload) {
    return <PermissionDenied permission="dicom.upload" />;
  }

  const handleFilesSelected = async (files: File[]) => {
    if (!selectedStudyId) {
      alert('Please select a study first');
      return;
    }

    try {
      const result = await upload(files, {
        seriesDescription: `Upload - ${new Date().toISOString()}`
      });
      alert(`Uploaded ${result.uploaded_count} instances`);
      // Refresh studies list
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <div className="space-y-4">
      {/* Study selector */}
      <Select value={selectedStudyId?.toString()} onValueChange={(id) => setSelectedStudyId(Number(id))}>
        <SelectTrigger>
          <SelectValue placeholder="Select study" />
        </SelectTrigger>
        <SelectContent>
          {studies?.items.map(study => (
            <SelectItem key={study.id} value={study.id.toString()}>
              {study.description || `Study ${study.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Upload area */}
      <DicomUploadArea
        onFilesSelected={handleFilesSelected}
        disabled={loading || !selectedStudyId}
      />

      {/* Progress and errors */}
      {loading && <UploadProgress progress={progress} />}
      {error && <ErrorState message={error.message} />}
    </div>
  );
}
```

### Example 3: Viewer with Measurements

**Pattern:**

```typescript
// app/dashboard/viewer/[studyId]/page.tsx
import { useDicom, useMeasurements } from '@/hooks/use-clinical-api';

export default function ViewerPage({ params }: { params: { studyId: string } }) {
  const studyId = parseInt(params.studyId);

  // Load DICOM instances
  const {
    data: dicomData,
    loading: dicomLoading,
    error: dicomError,
    hasPermission: canRead
  } = useDicom({ study_id: studyId });

  // Load measurements
  const {
    data: measurementsData,
    loading: metricsLoading,
    hasPermission: canReadMetrics
  } = useMeasurements({ study_id: studyId });

  if (!canRead) return <PermissionDenied permission="dicom.read" />;
  if (dicomLoading) return <DicomLoadingSkeleton />;
  if (dicomError) return <ErrorState message={dicomError.message} />;

  const instances = dicomData?.items || [];
  const measurements = measurementsData?.items || [];

  return (
    <div className="flex gap-4">
      {/* Viewer */}
      <MultiViewportDicomViewer instances={instances} />

      {/* Measurements panel */}
      {canReadMetrics && (
        <MeasurementsPanel
          measurements={measurements}
          studyId={studyId}
          loading={metricsLoading}
        />
      )}
    </div>
  );
}
```

## Error Handling by Status Code

| Status   | Meaning             | User Message                                          | Action                          |
| -------- | ------------------- | ----------------------------------------------------- | ------------------------------- |
| 200, 201 | Success             | N/A                                                   | Proceed                         |
| 400      | Bad Request         | "Invalid input. Check your entries and try again."    | Retry with different data       |
| 401      | Unauthorized        | "Session expired. Please log in again."               | Redirect to login               |
| 403      | Forbidden           | "You don't have permission: {permission}"             | Show PermissionDenied component |
| 404      | Not Found           | "Resource not found. It may have been deleted."       | Go back / refresh               |
| 409      | Conflict            | "Resource conflict (duplicate, version mismatch)"     | Reload and retry                |
| 413      | Payload Too Large   | "File too large (max 2GB per file)"                   | Use smaller file                |
| 422      | Validation Error    | "Check form validation errors above"                  | Show field-level errors         |
| 429      | Rate Limited        | "Too many requests. Please wait before trying again." | Exponential backoff             |
| 500      | Server Error        | "Server error. Contact support with request ID: {id}" | Show RequestIdBadge             |
| 503      | Service Unavailable | "Service temporarily unavailable. Try again soon."    | Retry after delay               |

**Example error handler:**

```typescript
try {
  const study = await studiesService.getStudy(id);
} catch (error) {
  const apiError = error as ApiError;

  switch (apiError.status) {
    case 403:
      // Show PermissionDenied
      setError("Missing permission");
      break;
    case 404:
      // Redirect to list
      router.push("/dashboard/studies");
      break;
    case 500:
      // Show with request ID
      setError(`Server error: ${apiError.requestId}`);
      break;
    default:
      setError("An error occurred. Please try again.");
  }
}
```

## Development Tips

### 1. Enable Detailed Logging

In development, request IDs are logged:

```typescript
// src/lib/api-client.ts (already configured)
if (process.env.NODE_ENV === "development") {
  console.error(
    `[API Error] ${parsed.status} ${parsed.errorCode}:`,
    parsed.message,
  );
}
```

Use `RequestIdBadge` to show request ID to users:

```typescript
const { requestId } = error as ApiError;
return <RequestIdBadge requestId={requestId} />;
```

### 2. Mock API for Testing (if backend unavailable)

Mock responses in tests:

```typescript
import { vi } from "vitest";
import { studiesService } from "@/services/studies-service";

vi.mock("@/services/studies-service", () => ({
  studiesService: {
    listStudies: vi.fn().mockResolvedValue({
      total: 1,
      page: 1,
      page_size: 20,
      items: [
        /* mock study */
      ],
    }),
  },
}));
```

### 3. OpenAPI Schema for Exact Paths

**ALWAYS check the live backend OpenAPI for authoritative paths:**

```bash
curl http://localhost:8000/openapi.json | jq '.paths'
```

The paths in this guide are conventions; backend may differ. Always verify with OpenAPI.

## Integration Checklist

- [ ] Backend running at `http://localhost:8000`
- [ ] CORS configured: `ALLOWED_ORIGINS` includes frontend origin
- [ ] Auth context properly initialized (`useAuth()` available)
- [ ] Services created and imported in components
- [ ] Permission gates in place with `can()` checks
- [ ] Loading skeletons shown during fetch
- [ ] Error states with retry buttons
- [ ] 403 errors show `PermissionDenied` component
- [ ] File uploads show progress feedback
- [ ] Request IDs logged in development
- [ ] Empty states for zero-data scenarios
- [ ] Mobile-responsive layout

## Troubleshooting

**"CORS error" when uploading:**

- Check backend `ALLOWED_ORIGINS` includes `http://localhost:3000` (or your frontend origin)
- Verify `Content-Type: multipart/form-data` is auto-set (don't set manually)

**"403 Forbidden" after login:**

- Check user's permissions in auth context: `console.log(user.permissions)`
- Verify backend returns full permission list during login
- Use `can()` hook before making API calls

**"404 Not Found" for study:**

- Verify study ID is correct
- Check if study was deleted by another user
- Refresh list to see current state

**Upload progress stuck at 0%:**

- Check file size (max 2GB per file)
- Verify `onProgress` callback in upload options
- For large files (>500MB), expect slower progress
