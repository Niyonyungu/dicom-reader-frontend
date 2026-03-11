'use client';

import { useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DicomUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
}

export function DicomUploadArea({ onFilesSelected }: DicomUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | undefined => {
    if (!file.name.toLowerCase().endsWith('.dcm')) {
      return 'Only .dcm files are supported';
    }
    if (file.size > 100 * 1024 * 1024) {
      return 'File size must be less than 100MB';
    }
    return undefined;
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadFile[] = [];

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

    // Simulate upload
    newFiles.forEach((uploadFile) => {
      if (!uploadFile.error) {
        // mark as uploading then start simulated upload
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'uploading' } : f
          )
        );
        simulateUpload(uploadFile);
      }
    });
  };

  const simulateUpload = (uploadFile: UploadFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      } else {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, progress } : f
          )
        );
      }
    }, 300);
  };

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

  const handleAddToWorklist = () => {
    const successFiles = uploadFiles
      .filter((f) => f.status === 'success')
      .map((f) => f.file);

    if (successFiles.length > 0) {
      onFilesSelected(successFiles);
    }
  };

  const successCount = uploadFiles.filter((f) => f.status === 'success').length;
  const errorCount = uploadFiles.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/50 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div
            className="flex justify-center mb-4 cursor-pointer"
            onClick={handleClickUpload}
          >
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

          <Button
            onClick={handleClickUpload}
            className="bg-primary hover:bg-primary/90"
          >
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
            Maximum file size: 100MB per file
          </p>
        </div>
      </Card>

      {/* Upload Summary */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {uploadFiles.length} file(s) selected
              </p>
              <p className="text-sm text-muted-foreground">
                {successCount} successful
                {errorCount > 0 && `, ${errorCount} failed`}
              </p>
            </div>
            <Button
              onClick={handleAddToWorklist}
              disabled={successCount === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Add to Worklist
            </Button>
          </div>

          {/* File List */}
          <div className="space-y-2">
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
                      uploadFile.status === 'uploading') && (
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024).toFixed(2)} KB
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
    </div>
  );
}
