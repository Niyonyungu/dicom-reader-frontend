'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { MultiViewportDicomViewer } from '@/components/viewer/multi-viewport-dicom-viewer';
import { loadDicomFiles } from '@/lib/cornerstone-setup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { getWorklistItem, updateWorklistItem } = useWorklist();
  const { getPatient } = usePatients();

  const worklistId = params.worklistId as string;
  const worklistItem = getWorklistItem(worklistId);
  const patient = worklistItem ? getPatient(worklistItem.patientId) : null;
  const [loadedImages, setLoadedImages] = useState<import('@/lib/mock-data').DicomImage[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [message, setMessage] = useState('');

  const handleImageViewed = useCallback((imageId: string) => {
    if (!worklistItem) return;
    const updatedImages = worklistItem.images.map((img) =>
      img.id === imageId
        ? { ...img, viewed: true, viewedAt: new Date().toISOString() }
        : img
    );
    updateWorklistItem(worklistId, { images: updatedImages });
  }, [worklistId, worklistItem, updateWorklistItem]);


  const seriesList = worklistItem
    ? Array.from(new Set(worklistItem.images.map((i) => i.seriesDescription)))
    : [];

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const activeImages = loadedImages.length > 0 ? loadedImages : worklistItem?.images ?? [];

  const imageInstances = activeImages.map((i) => i.instanceNumber).join(', ');

  if (!worklistItem || !patient) {
    return (
      <div className="p-8">
        <Button onClick={() => router.back()} variant="outline" className="border-border mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Study not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarVisible((prev) => !prev)}
          className="border-border ml-auto"
        >
          {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
        </Button>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">DICOM Viewer</h1>
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            Study
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {worklistItem.description}
        </p>
      </div>

      {/* Demo Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Demo Limitation:</strong> This viewer shows file information for uploaded DICOM files.
          Actual DICOM image parsing and rendering requires a backend service with DICOM libraries.
          The viewer displays metadata and file details instead of the actual medical images.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">Import DICOM files:</label>
          <input
            type="file"
            accept=".dcm"
            multiple
            onChange={async (event) => {
              if (!event.target.files) return;
              const loaded = await loadDicomFiles(event.target.files);
              setLoadedImages(loaded);
              setMessage(`Loaded ${loaded.length} file(s).`);
            }}
            className="text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const url = `${window.location.href}`;
              await navigator.clipboard.writeText(url);
              setMessage('Share link copied to clipboard');
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copy Share Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (shareNote.trim().length === 0) {
                setMessage('Please type a note before saving.');
                return;
              }
              setMessage('Telemedicine note saved.');
              setShareNote('');
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Save Note
          </Button>

          <div className="w-full border border-border rounded-lg p-3 bg-muted/20">
            <p className="text-xs font-semibold mb-2">PACS Retrieval</p>
            <p className="text-xs text-muted-foreground">
              To retrieve from PACS and populate the worklist, go to the Worklist page and use the PACS Query section.
              This keeps retrieval in context with worklist selection and supports multiple studies.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <div className={`grid grid-cols-1 ${sidebarVisible ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6`}>
        {/* Main Viewer */}
        <div className={sidebarVisible ? 'lg:col-span-3' : 'lg:col-span-1'}>
          <MultiViewportDicomViewer
            worklistItem={worklistItem}
            patient={patient}
            onImageViewed={handleImageViewed}
          />
        </div>

        {/* Sidebar - Patient & Study Info */}
        <div className="space-y-4">
          {/* Patient Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Patient ID</p>
                <p className="font-semibold text-foreground">{patient.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{patient.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-semibold text-foreground">
                    {calculateAge(patient.dob)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-semibold text-foreground">{patient.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-semibold text-foreground">
                    {patient.weightKg ? `${patient.weightKg} kg` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Height</p>
                  <p className="font-semibold text-foreground">
                    {patient.heightCm ? `${patient.heightCm} cm` : '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DOB</p>
                <p className="font-semibold text-foreground">{patient.dob}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="font-semibold text-foreground">{patient.contactInfo}</p>
              </div>
            </CardContent>
          </Card>

          {/* Study Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Study Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Study ID</p>
                <p className="font-semibold text-foreground text-sm">{worklistItem.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Series</p>
                <p className="font-semibold text-foreground text-sm">
                  {seriesList.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Instances</p>
                <p className="font-semibold text-foreground text-sm">
                  {imageInstances}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modality</p>
                <div className="mt-1">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                    {worklistItem.modality}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Study Date</p>
                <p className="font-semibold text-foreground">{worklistItem.studyDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Study Time</p>
                <p className="font-semibold text-foreground">{worklistItem.studyTime}</p>
              </div>
              {worklistItem.referringPhysician && (
                <div>
                  <p className="text-xs text-muted-foreground">Referring</p>
                  <p className="font-semibold text-foreground text-sm">
                    {worklistItem.referringPhysician}
                  </p>
                </div>
              )}
              {worklistItem.details && (
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="font-semibold text-foreground text-sm">
                    {worklistItem.details}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Images</p>
                <p className="font-semibold text-foreground">{worklistItem.imageCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${worklistItem.status === 'completed'
                      ? 'bg-accent/20 text-accent'
                      : worklistItem.status === 'ongoing'
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-primary/20 text-primary'
                      }`}
                  >
                    {worklistItem.status.charAt(0).toUpperCase() +
                      worklistItem.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border">
            <CardContent className="pt-6 space-y-2">
              <Button
                variant="outline"
                className="w-full border-border justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Images
              </Button>
              <Button
                variant="outline"
                className="w-full border-border justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Study
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
