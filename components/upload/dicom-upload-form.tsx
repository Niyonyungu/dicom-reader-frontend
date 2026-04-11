'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DicomUploadFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: File[];
    studyId: number;
    onSubmit: (metadata: UploadMetadata) => Promise<void>;
    isLoading?: boolean;
    error?: string;
}

export interface UploadMetadata {
    studyId: number;
    seriesDescription?: string;
    seriesNumber?: number;
    seriesUid?: string;
    patientId?: string;
    studyDescription?: string;
}

/**
 * DICOM Upload Form Component
 * 
 * Modal form for collecting optional metadata before DICOM upload.
 * Allows users to organize files into series and provide descriptive info.
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const [files, setFiles] = useState<File[]>([]);
 * 
 * const handleSubmit = async (metadata: UploadMetadata) => {
 *   await dicomService.uploadDicom(metadata.studyId, files, {
 *     seriesDescription: metadata.seriesDescription,
 *     seriesNumber: metadata.seriesNumber,
 *   });
 *   setOpen(false);
 * };
 * 
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Upload DICOM</Button>
 *     <DicomUploadForm
 *       open={open}
 *       onOpenChange={setOpen}
 *       files={files}
 *       studyId={123}
 *       onSubmit={handleSubmit}
 *     />
 *   </>
 * );
 * ```
 */
export function DicomUploadForm({
    open,
    onOpenChange,
    files,
    studyId,
    onSubmit,
    isLoading = false,
    error,
}: DicomUploadFormProps) {
    const [seriesDescription, setSeriesDescription] = useState('');
    const [seriesNumber, setSeriesNumber] = useState<string>('');
    const [seriesUid, setSeriesUid] = useState('');
    const [patientId, setPatientId] = useState('');
    const [studyDescription, setStudyDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const metadata: UploadMetadata = {
            studyId,
            seriesDescription: seriesDescription || undefined,
            seriesNumber: seriesNumber ? parseInt(seriesNumber, 10) : undefined,
            seriesUid: seriesUid || undefined,
            patientId: patientId || undefined,
            studyDescription: studyDescription || undefined,
        };

        await onSubmit(metadata);

        // Reset form on success
        if (!error) {
            setSeriesDescription('');
            setSeriesNumber('');
            setSeriesUid('');
            setPatientId('');
            setStudyDescription('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload DICOM Files</DialogTitle>
                    <DialogDescription>
                        {files.length} file{files.length !== 1 ? 's' : ''} selected for upload
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Summary */}
                    <Card className="p-4 bg-muted/50">
                        <h3 className="font-semibold text-sm mb-3">Files to Upload</h3>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto">
                            {files.map((file) => (
                                <div key={file.name} className="text-xs text-muted-foreground">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Metadata Form */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="seriesDescription" className="text-sm">
                                Series Description (Optional)
                            </Label>
                            <Input
                                id="seriesDescription"
                                placeholder="e.g., Chest CT, Brain MRI"
                                value={seriesDescription}
                                onChange={(e) => setSeriesDescription(e.target.value)}
                                disabled={isLoading}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Describe the diagnostic purpose or anatomical region
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="seriesNumber" className="text-sm">
                                    Series Number (Optional)
                                </Label>
                                <Input
                                    id="seriesNumber"
                                    type="number"
                                    placeholder="e.g., 1, 2"
                                    value={seriesNumber}
                                    onChange={(e) => setSeriesNumber(e.target.value)}
                                    disabled={isLoading}
                                    className="mt-1"
                                    min="0"
                                />
                            </div>

                            <div>
                                <Label htmlFor="seriesUid" className="text-sm">
                                    Series UID (Optional)
                                </Label>
                                <Input
                                    id="seriesUid"
                                    placeholder="DICOM UID (1.2.3...)"
                                    value={seriesUid}
                                    onChange={(e) => setSeriesUid(e.target.value)}
                                    disabled={isLoading}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="patientId" className="text-sm">
                                Patient ID (Optional)
                            </Label>
                            <Input
                                id="patientId"
                                placeholder="e.g., MRN or Patient ID"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                disabled={isLoading}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Optional: helps organize files if not already in DICOM metadata
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="studyDescription" className="text-sm">
                                Study Description (Optional)
                            </Label>
                            <Input
                                id="studyDescription"
                                placeholder="e.g., Routine Follow-up"
                                value={studyDescription}
                                onChange={(e) => setStudyDescription(e.target.value)}
                                disabled={isLoading}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isLoading ? 'Uploading...' : 'Upload Files'}
                        </Button>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-muted-foreground text-center">
                        All fields are optional. DICOM headers will be used if available.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default DicomUploadForm;
