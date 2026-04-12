# DICOM Validation (422) Error Debugging Guide

## What's Happening

Your frontend is correctly sending DICOM files to the backend's `/api/v1/dicom/validate` endpoint, but the backend is returning a **422 Unprocessable Entity** error. This means the backend validation logic is rejecting the files.

## Step 1: Check the Actual Backend Error

The 422 error contains details about what was rejected. Check your backend logs for something like:

```
POST /api/v1/dicom/validate
422 Unprocessable Entity

ValidationError: ...
details: [
  {"loc": [...], "msg": "...", "type": "..."}
]
```

## Step 2: Verify Files are Real DICOM Files

The backend might be checking if files have valid DICOM headers. Ensure you're uploading actual DICOM files:

### Check file headers in browser console:

```javascript
// Get a file from upload and check the header
const file = document.querySelector('input[type="file"]').files[0];
const header = await file.slice(0, 132).text();
console.log("First 132 bytes:", header);
// Should contain "DICM" marker at offset 128-131
```

### Real DICOM files have:

- `.dcm` extension (commonly)
- "DICM" magic bytes at offset 128-131
- DICOM group/element tags starting at byte 132

### Test files to try:

```bash
# If you have a real DICOM file
file test.dcm
# Output should show: "test.dcm: DICOM medical imaging data"
```

## Step 3: Check Backend Validation Logic

The backend's `/dicom/validate` endpoint likely checks:

1. **DICOM magic bytes** - Must have "DICM" at offset 128
2. **File size** - File must be at least 132 bytes
3. **Valid tags** - Must contain valid DICOM group/element tags
4. **Parseable metadata** - Can extract patient/study info

## Step 4: See Frontend Error Details

In browser DevTools Console, look for errors like:

```
[DICOM Validate] Validating 2 files:
Array(2)
  0: {name: "file1.dcm", size: 2048576, type: ""}
  1: {name: "file2.dcm", size: 1024000, type: ""}

[DICOM Validate] Request failed:
Object {
  status: 422,
  errorCode: "VALIDATION_ERROR",
  message: "Request validation failed",
  details: {...},  // ← Check this for specific field errors
  requestId: "..."
}
```

## Step 5: Check if Files are Reading Correctly

Add temporary logging:

```typescript
// In dicom-upload-area.tsx, after file selection:
const files = Array.from(selectedFiles);
files.forEach((file) => {
  console.log(`File: ${file.name}`);
  console.log(`  Size: ${file.size} bytes`);
  console.log(`  Type: ${file.type}`);

  // Try to read first 132 bytes
  const reader = new FileReader();
  reader.onload = (e) => {
    const view = new Uint8Array(e.target.result);
    const hasDICM =
      view.length >= 132 &&
      view[128] === 0x44 && // 'D'
      view[129] === 0x49 && // 'I'
      view[130] === 0x43 && // 'C'
      view[131] === 0x4d; // 'M'
    console.log(`  Has DICM marker: ${hasDICM}`);
  };
  reader.readAsArrayBuffer(file.slice(0, 132));
});
```

## Step 6: Check Backend Requirements

Your backend's validation might require:

```python
# Common backend validation checks:
- File must be valid DICOM (has DICM marker and tags)
- File must have minimum size (>= 132 bytes + tags)
- File must contain valid Patient ID or Study data
- File must be readable (no permission/corruption errors)
```

## Step 7: Check Network Request

In browser DevTools Network tab:

1. Look for `POST /api/v1/dicom/validate` request
2. Click on it
3. Go to **Response** tab - this will show the exact backend error message
4. Look for `details` array - it contains field-level errors

## Common Issues & Solutions

| Issue                                 | Solution                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| Files are test files (not real DICOM) | Use actual `.dcm` files from medical imaging equipment    |
| Files are corrupted                   | Try re-saving or re-exporting from DICOM source           |
| Files too small                       | Ensure files contain full DICOM headers + metadata        |
| Wrong file format                     | Verify files are DICOM (not JPEG/PNG with .dcm extension) |
| Backend database issue                | Check backend logs for database/connection errors         |
| Missing required fields               | Backend might need Patient ID, Study UID, etc.            |

## Next Steps

1. **Check backend logs** - Look for the actual validation error message
2. **Verify file format** - Confirm files are real DICOM files
3. **Share error details** - Provide the response body from Network tab
4. **Test with known file** - Try a DICOM file you know works
5. **Check backend code** - Review the validation logic in backend

## Example: Test with Minimal DICOM

If you need to test with a minimal DICOM file:

```python
# Python example to create minimal test DICOM
import pydicom
from pydicom.dataset import Dataset, FileDataset

# Create file meta info
file_meta = Dataset()
file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian

# Create file dataset
ds = FileDataset("test.dcm", {}, preamble=b"\0" * 128)
ds.PatientName = "Test^Patient"
ds.PatientID = "12345"

# Save
ds.save_as("test.dcm")
```

Then try uploading that file to test the validation endpoint.
