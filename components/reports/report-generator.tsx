'use client';

import { useState } from 'react';
import { Patient, WorklistItem } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';

interface ReportGeneratorProps {
  patients: Patient[];
  worklist: WorklistItem[];
  onReportGenerate?: (report: {
    patientId: string;
    worklistId: string;
    findings: string;
    impression: string;
  }) => void;
}

export function ReportGenerator({
  patients,
  worklist,
  onReportGenerate,
}: ReportGeneratorProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedStudy, setSelectedStudy] = useState<string>('');
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');

  const selectedPatientData = patients.find((p) => p.id === selectedPatient);
  const selectedStudyData = worklist.find((w) => w.id === selectedStudy);

  const patientStudies = worklist.filter((w) => w.patientId === selectedPatient);

  const handleGenerateReport = () => {
    if (!selectedPatient || !selectedStudy || !findings || !impression) {
      alert('Please fill in all required fields');
      return;
    }

    onReportGenerate?.({
      patientId: selectedPatient,
      worklistId: selectedStudy,
      findings,
      impression,
    });

    // Reset form
    setFindings('');
    setImpression('');
  };

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">1. Select Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Choose a patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} ({patient.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Study Selection */}
      {selectedPatient && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">2. Select Study</CardTitle>
          </CardHeader>
          <CardContent>
            {patientStudies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No studies found for this patient
              </p>
            ) : (
              <Select value={selectedStudy} onValueChange={setSelectedStudy}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Choose a study..." />
                </SelectTrigger>
                <SelectContent>
                  {patientStudies.map((study) => (
                    <SelectItem key={study.id} value={study.id}>
                      {study.description} ({study.studyDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* Study Details */}
      {selectedStudyData && (
        <Card className="border-border bg-muted/50">
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Modality</p>
                <p className="font-semibold text-foreground">
                  {selectedStudyData.modality}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Study Date</p>
                <p className="font-semibold text-foreground">
                  {selectedStudyData.studyDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="font-semibold text-foreground text-sm">
                  {selectedStudyData.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Images</p>
                <p className="font-semibold text-foreground">
                  {selectedStudyData.imageCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {selectedPatient && selectedStudy && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">3. Write Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="findings">Findings *</Label>
              <Textarea
                id="findings"
                placeholder="Enter detailed findings from the study..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="bg-input border-border min-h-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impression">Impression *</Label>
              <Textarea
                id="impression"
                placeholder="Enter clinical impression and conclusions..."
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="bg-input border-border min-h-40"
              />
            </div>

            <div className="space-y-2">
              <Label>Radiologist</Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-semibold text-foreground">Dr. John Smith</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report Generated</Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!findings || !impression}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate & Save Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
