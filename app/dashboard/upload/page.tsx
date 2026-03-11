'use client';

import { useState } from 'react';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { WorklistItem, DicomImage } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DicomUploadArea } from '@/components/upload/dicom-upload-area';
import { Upload as UploadIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UploadPage() {
  const { addWorklistItem } = useWorklist();
  const { patients } = usePatients();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleFilesSelected = (files: File[]) => {
    // Create new worklist items from uploaded files
    const patient = patients[0]; // Default to first patient for demo

    if (!patient) {
      alert('No patients found. Please add a patient first.');
      return;
    }

    const newWorklistItem: WorklistItem = {
      id: `W${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      studyDate: new Date().toISOString().split('T')[0],
      studyTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      modality: 'CT', // Default modality
      description: `Uploaded Study - ${files.length} file(s)`,
      status: 'new',
      imageCount: files.length,
      images: files.map((file, index) => ({
        id: `IMG${Date.now()}-${index}`,
        instanceNumber: index + 1,
        filename: file.name,
        seriesDescription: `Series ${index + 1}`,
        sliceThickness: '1.0mm',
        windowCenter: 40,
        windowWidth: 400,
      } as DicomImage)),
    };

    addWorklistItem(newWorklistItem);
    setUploadSuccess(true);
    setSuccessMessage(
      `Successfully uploaded ${files.length} file(s) for patient ${patient.name}`
    );

    // Reset message after 5 seconds
    setTimeout(() => setUploadSuccess(false), 5000);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UploadIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Upload DICOM</h1>
        </div>
        <p className="text-muted-foreground">
          Upload medical imaging files to add new studies to the worklist
        </p>
      </div>

      {/* Success Alert */}
      {uploadSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400 ml-2">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-400 ml-2">
          Upload .dcm (DICOM) files to create new studies. Files will be linked to the first patient in the system.
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <DicomUploadArea onFilesSelected={handleFilesSelected} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">Supported Formats</p>
            <p>DICOM files (.dcm)</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">File Size Limit</p>
            <p>Maximum 100MB per file</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">How to Upload</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Drag and drop files into the upload area, or</li>
              <li>Click the upload area to select files from your computer</li>
              <li>Wait for files to finish uploading</li>
              <li>Click "Add to Worklist" to create a new study</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">What Happens Next</p>
            <p>
              Uploaded files will be added to the worklist and linked to the first patient
              in the system. You can then view the images using the DICOM viewer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
