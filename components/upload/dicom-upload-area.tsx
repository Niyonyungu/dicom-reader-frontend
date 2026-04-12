'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { dicomService } from '@/services/dicom-service';
import { DicomUploadForm, UploadMetadata } from './dicom-upload-form';

interface UploadFile {
  file: File;
  status: 'pending' | 'validating' | 'validated' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DicomUploadAreaProps {
  studyId: number;
  onUploadComplete?: (uploadedCount: number) => void;
  onError?: (error: string) => void;
}

/**
 * Enhanced DICOM Upload Area Component
 * 
 * Features:
 * - Drag-and-drop file selection
 * - Real-time file validation
 * - Multi-file upload with progress tracking
 * - Optional metadata form
 * - Status feedback with error handling
 * 
 * @example
 * ```tsx
 * <DicomUploadArea
 *   studyId={123}
 *   onUploadComplete={(count) => console.log(`Uploaded ${count} files`)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export function DicomUploadArea({
  studyId,
  onUploadComplete,
  onError,
}: DicomUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate single file
  const validateFile = (file: File): string | undefined => {
    if (!file.name.toLowerCase().endsWith('.dcm')) {
      return 'Only .dcm files are supported';
    }
    if (file.size > 1024 * 1024 * 1024) {
      // 1GB limit per file for safety
      return 'File size must be less than 1GB';
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return undefined;
  };

  // Handle multiple files
  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploadError(undefined);
      const newFiles: UploadFile[] = [];

      // First pass: local validation
      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        newFiles.push({
          file,
          status: error ? 'error' : 'pending',
          progress: 0,
          error,
        });
      });

      setUploadFiles((prev) => [...prev, ...newFiles]);

      // Second pass: validate with backend
      const filesForValidation = newFiles
        .filter((f) => !f.error)
        .map((f) => f.file);

      if (filesForValidation.length > 0) {
        try {
          // Mark as validating
          setUploadFiles((prev) =>
            prev.map((f) =>
              filesForValidation.includes(f.file)
                ? { ...f, status: 'validating' }
                : f
            )
          );

          // Validate with backend
          const validation = await dicomService.validateDicom(filesForValidation);

          // Update status based on validation results
          setUploadFiles((prev) =>
            prev.map((f) => {
              if (!filesForValidation.includes(f.file)) return f;

              // Safe access to results as backend response might be empty or differently structured
              const result = validation?.results?.find((r) => r.filename === f.file.name);
              
              if (result?.valid) {
                return { ...f, status: 'validated' };
              } else {
                return {
                  ...f,
                  status: 'error',
                  error: result?.error || 'Validation failed or file rejected by server',
                };
              }
            })
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Validation failed';
          setUploadError(errorMsg);
          if (onError) onError(errorMsg);

          // Mark all as error
          setUploadFiles((prev) =>
            prev.map((f) =>
              filesForValidation.includes(f.file)
                ? { ...f, status: 'error', error: errorMsg }
                : f
            )
          );
        }
      }
    },
    [onError]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleUploadSubmit = async (metadata: UploadMetadata) => {
    setIsUploading(true);
    setUploadError(undefined);

    try {
      const validatedFiles = uploadFiles
        .filter((f) => f.status === 'validated')
        .map((f) => f.file);

      if (validatedFiles.length === 0) {
        throw new Error('No valid files to upload');
      }

      // Mark files as uploading
      setUploadFiles((prev) =>
        prev.map((f) =>
          validatedFiles.includes(f.file) ? { ...f, status: 'uploading' } : f
        )
      );

      // Upload with progress callback
      const uploadResult = await dicomService.uploadDicom(
        metadata.studyId,
        validatedFiles,
        {
          seriesDescription: metadata.seriesDescription,
          seriesNumber: metadata.seriesNumber,
          onProgress: (percent) => {
            setOverallProgress(percent);
            // Update all uploading files
            setUploadFiles((prev) =>
              prev.map((f) =>
                validatedFiles.includes(f.file) && f.status === 'uploading'
                  ? { ...f, progress: percent }
                  : f
              )
            );
          },
        }
      );

      // Mark successful files
      setUploadFiles((prev) =>
        prev.map((f) =>
          validatedFiles.includes(f.file)
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );

      // Callback on complete
      if (onUploadComplete) {
        // Fallback to local count if backend response is missing uploaded_count
        onUploadComplete(uploadResult?.uploaded_count ?? validatedFiles.length);
      }

      // Close form
      setShowForm(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMsg);
      if (onError) onError(errorMsg);

      // Mark uploading files as error
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'error', error: errorMsg } : f
        )
      );
    } finally {
      setIsUploading(false);
      setOverallProgress(0);
    }
  };

  const handleStartUpload = () => {
    const validatedCount = uploadFiles.filter((f) => f.status === 'validated').length;
    if (validatedCount === 0) {
      setUploadError('No valid files to upload. Please select valid DICOM files.');
      return;
    }
    setSelectedFiles(uploadFiles.filter((f) => f.status === 'validated').map((f) => f.file));
    setShowForm(true);
  };

  const handleClearAll = () => {
    setUploadFiles([]);
    setUploadError(undefined);
    setSelectedFiles([]);
  };

  const stats = {
    total: uploadFiles.length,
    pending: uploadFiles.filter((f) => f.status === 'pending').length,
    validating: uploadFiles.filter((f) => f.status === 'validating').length,
    validated: uploadFiles.filter((f) => f.status === 'validated').length,
    uploading: uploadFiles.filter((f) => f.status === 'uploading').length,
    success: uploadFiles.filter((f) => f.status === 'success').length,
    error: uploadFiles.filter((f) => f.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {uploadFiles.length === 0 && (
        <Card
          className={`border-2 border-dashed transition-colors ${dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/50 hover:border-primary/50'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center cursor-pointer" onClick={handleClickUpload}>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload DICOM Files
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your .dcm files here, or click to browse
            </p>

            <Button onClick={handleClickUpload} className="bg-primary hover:bg-primary/90">
              Select Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm"
              onChange={handleInputChange}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground mt-4">
              Maximum file size: 1GB per file • Only .dcm files supported
            </p>
          </div>
        </Card>
      )}

      {/* Summary and Status */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          {/* Overall Progress */}
          {isUploading && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Upload Progress</h3>
                <span className="text-sm text-muted-foreground">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </Card>
          )}

          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Summary Stats */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {stats.total} file{stats.total !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-muted-foreground space-x-4">
                  {stats.validated > 0 && <span>✓ {stats.validated} ready</span>}
                  {stats.uploading > 0 && <span>⟳ {stats.uploading} uploading</span>}
                  {stats.success > 0 && <span>✓ {stats.success} done</span>}
                  {stats.error > 0 && <span>✗ {stats.error} errors</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {stats.validated > 0 && !isUploading && (
                  <Button
                    onClick={handleStartUpload}
                    disabled={isUploading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Upload {stats.validated} File{stats.validated !== 1 ? 's' : ''}
                  </Button>
                )}
                <Button variant="outline" onClick={handleClearAll} disabled={isUploading}>
                  Clear All
                </Button>
              </div>
            </div>
          </Card>

          {/* File List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.file.name}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {uploadFile.status === 'success' && (
                      <FileCheck className="h-5 w-5 text-accent" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {(uploadFile.status === 'pending' ||
                      uploadFile.status === 'validating' ||
                      uploadFile.status === 'uploading' ||
                      uploadFile.status === 'validated') && (
                        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {uploadFile.status}
                    </p>

                    {uploadFile.status === 'error' && uploadFile.error && (
                      <Alert variant="destructive" className="mt-2 py-2">
                        <AlertDescription className="text-xs">
                          {uploadFile.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      <DicomUploadForm
        open={showForm}
        onOpenChange={setShowForm}
        files={selectedFiles}
        studyId={studyId}
        onSubmit={handleUploadSubmit}
        isLoading={isUploading}
        error={isUploading ? uploadError : undefined}
      />
    </div>
  );
}

export default DicomUploadArea;
