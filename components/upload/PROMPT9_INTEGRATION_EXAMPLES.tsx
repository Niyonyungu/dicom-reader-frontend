/**
 * Prompt 9: DICOM Upload — Integration Examples
 * 
 * Real-world examples demonstrating different ways to use the upload components
 * and services for DICOM ingestion workflows.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DicomUploadArea } from '@/components/upload/dicom-upload-area';
import { DicomUploadForm } from '@/components/upload/dicom-upload-form';
import { dicomService } from '@/services/dicom-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Example 1: Basic Upload Page
 * Simple dedicated page for DICOM file uploads to a study
 */
export function BasicUploadPage({ studyId }: { studyId: number }) {
    const [uploadedCount, setUploadedCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Upload DICOM Files</h1>
                <p className="text-muted-foreground">
                    Add new DICOM images to study #{studyId}
                </p>
            </div>

            {uploadedCount > 0 && (
                <Alert className="border-accent bg-accent/5">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <AlertDescription>
                        Successfully uploaded {uploadedCount} file{uploadedCount !== 1 ? 's' : ''}!
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <DicomUploadArea
                studyId={studyId}
                onUploadComplete={(count) => {
                    setUploadedCount(count);
                    setError(null);
                }}
                onError={setError}
            />
        </div>
    );
}

/**
 * Example 2: Upload Modal Dialog
 * Embeds upload as a modal within a larger page
 */
export function UploadModalExample({ studyId }: { studyId: number }) {
    const [showUpload, setShowUpload] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);

    return (
        <div className="space-y-4">
            <Button onClick={() => setShowUpload(true)} className="gap-2">
                Add DICOM Files
            </Button>

            {showUpload && (
                <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Upload DICOM Files</h2>
                        <Button
                            variant="ghost"
                            onClick={() => setShowUpload(false)}
                        >
                            ✕
                        </Button>
                    </div>

                    <DicomUploadArea
                        studyId={studyId}
                        onUploadComplete={(count) => {
                            setUploadedCount(count);
                            setTimeout(() => setShowUpload(false), 1000);
                        }}
                    />
                </Card>
            )}

            {uploadedCount > 0 && <div>Uploaded: {uploadedCount} files</div>}
        </div>
    );
}

/**
 * Example 3: Advanced Upload with Status Polling
 * Shows how to manually upload and poll for completion
 */
export function AdvancedUploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadDetails, setUploadDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
        try {
            setUploading(true);
            setError(null);
            setUploadDetails(null);

            // Step 1: Validate files
            setUploadStatus('Validating files...');
            const validation = await dicomService.validateDicom(files);
            console.log(`Validation: ${validation.valid_count}/${validation.total} valid`);

            if (validation.invalid_count > 0) {
                setError(`${validation.invalid_count} file(s) failed validation`);
                setUploading(false);
                return;
            }

            // Step 2: Upload files
            setUploadStatus('Uploading files...');
            const result = await dicomService.uploadDicom(123, files, {
                seriesDescription: 'Uploaded via advanced form',
                onProgress: (percent) => {
                    setUploadStatus(`Uploading: ${percent}%`);
                },
            });

            setUploadDetails({
                uploaded: result.uploaded_count,
                failed: result.failed_count,
                instances: result.instances.length,
            });

            setUploadStatus('Complete!');
            setFiles([]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
            setUploadStatus('Failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Advanced Upload with Polling</h2>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {/* File Input */}
                    <div>
                        <input
                            type="file"
                            multiple
                            accept=".dcm"
                            onChange={(e) =>
                                setFiles(Array.from(e.target.files || []))
                            }
                            disabled={uploading}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            {files.length} file(s) selected
                        </p>
                    </div>

                    {/* Status */}
                    {uploadStatus && (
                        <div className="flex items-center gap-2 text-sm">
                            {uploading && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {uploadStatus}
                        </div>
                    )}

                    {/* Button */}
                    <Button
                        onClick={handleUpload}
                        disabled={uploading || files.length === 0}
                    >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </Button>

                    {/* Results */}
                    {uploadDetails && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p>✓ Uploaded: {uploadDetails.uploaded}</p>
                            <p>✗ Failed: {uploadDetails.failed}</p>
                            <p>Instances created: {uploadDetails.instances}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

/**
 * Example 4: Batch Upload with Job Tracking
 * Demonstrates tracking multiple uploads simultaneously
 */
export function BatchUploadTracker() {
    const [uploads, setUploads] = useState<
        Array<{
            id: string;
            uploadId: string;
            status: 'pending' | 'processing' | 'completed' | 'failed';
            progress: number;
            files: number;
        }>
    >([]);

    const startUpload = async (uploadId: string, files: File[]) => {
        const id = Date.now().toString();

        setUploads((prev) => [
            ...prev,
            {
                id,
                uploadId,
                status: 'pending',
                progress: 0,
                files: files.length,
            },
        ]);

        try {
            // Poll for completion
            const finalStatus = await dicomService.waitForUpload(
                uploadId,
                (status) => {
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.id === id
                                ? {
                                    ...u,
                                    status: status.status,
                                    progress: status.progress_percent,
                                }
                                : u
                        )
                    );
                }
            );

            setUploads((prev) =>
                prev.map((u) =>
                    u.id === id
                        ? { ...u, status: 'completed', progress: 100 }
                        : u
                )
            );
        } catch (error) {
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === id ? { ...u, status: 'failed', progress: 0 } : u
                )
            );
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload Batch Tracker</h2>

            {uploads.length === 0 ? (
                <p className="text-muted-foreground">No uploads yet</p>
            ) : (
                <div className="space-y-2">
                    {uploads.map((upload) => (
                        <Card key={upload.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                    Upload {upload.uploadId} ({upload.files} files)
                                </span>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${upload.status === 'completed'
                                            ? 'bg-accent/20 text-accent'
                                            : upload.status === 'failed'
                                                ? 'bg-destructive/20 text-destructive'
                                                : 'bg-primary/20 text-primary'
                                        }`}
                                >
                                    {upload.status}
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-full rounded-full transition-all"
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {upload.progress}%
                            </p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Example 5: Integration with Patient/Study Workflow
 * Shows upload as part of a complete data entry workflow
 */
export function PatientStudyUploadWorkflow() {
    const [step, setStep] = useState<'patient' | 'study' | 'upload' | 'complete'>(
        'patient'
    );
    const [studyId, setStudyId] = useState<number | null>(null);
    const [uploadedCount, setUploadedCount] = useState(0);

    return (
        <div className="max-w-3xl">
            <Card className="p-6">
                {/* Steps */}
                <div className="flex gap-4 mb-8">
                    {[
                        { id: 'patient', label: '1. Patient' },
                        { id: 'study', label: '2. Study' },
                        { id: 'upload', label: '3. Upload' },
                        { id: 'complete', label: '4. Complete' },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${step === s.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Step Content */}
                {step === 'patient' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Select or Create Patient</h2>
                        <p className="text-muted-foreground">
                            Choose an existing patient or create a new one
                        </p>
                        <Button onClick={() => setStep('study')}>Continue to Study</Button>
                    </div>
                )}

                {step === 'study' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Create Study</h2>
                        <p className="text-muted-foreground">
                            Enter study details and select modality
                        </p>
                        <Button
                            onClick={() => {
                                setStudyId(123); // Mock study creation
                                setStep('upload');
                            }}
                        >
                            Create Study and Continue
                        </Button>
                    </div>
                )}

                {step === 'upload' && studyId && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Upload DICOM Files</h2>
                        <DicomUploadArea
                            studyId={studyId}
                            onUploadComplete={(count) => {
                                setUploadedCount(count);
                                setStep('complete');
                            }}
                        />
                    </div>
                )}

                {step === 'complete' && (
                    <div className="space-y-4 text-center py-8">
                        <CheckCircle className="w-12 h-12 text-accent mx-auto" />
                        <h2 className="text-2xl font-bold">Upload Complete!</h2>
                        <p className="text-muted-foreground">
                            {uploadedCount} file{uploadedCount !== 1 ? 's' : ''} uploaded to study
                        </p>
                        <Button onClick={() => window.location.href = '/studies'}>
                            View Study
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

/**
 * Example 6: Service Usage - Direct API Calls
 * How to use dicomService directly for custom workflows
 */
export async function DirectServiceExample() {
    try {
        // Step 1: Validate before upload
        const endpoint = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const files = await (async () => {
            // In real usage, get files from user input
            return [] as File[];
        })();

        const validation = await dicomService.validateDicom(files);
        console.log(
            `Validation: ${validation.valid_count}/${validation.total} valid`
        );

        if (validation.invalid_count > 0) {
            console.error(
                'Some files failed validation:',
                validation.results.filter((r) => !r.valid)
            );
            return;
        }

        // Step 2: Upload
        console.log('Starting upload...');
        const uploadResult = await dicomService.uploadDicom(123, files, {
            seriesDescription: 'Test series',
            onProgress: (percent) => {
                console.log(`Upload progress: ${percent}%`);
            },
        });

        console.log(`Upload complete: ${uploadResult.uploaded_count} instances`);

        // Step 3: Handle errors
        if (uploadResult.failed_count > 0) {
            console.warn(
                'Some files failed to process:',
                uploadResult.errors
            );
        }
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

export const examples = {
    BasicUploadPage,
    UploadModalExample,
    AdvancedUploadPage,
    BatchUploadTracker,
    PatientStudyUploadWorkflow,
    DirectServiceExample,
};

export default examples;
