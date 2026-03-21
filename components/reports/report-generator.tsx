'use client';

import { useState, useRef, useEffect } from 'react';
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
import { FileText, Download, Mic, MicOff, Square } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [currentField, setCurrentField] = useState<'findings' | 'impression' | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentFieldRef = useRef<'findings' | 'impression' | null>(null);

  const selectedPatientData = patients.find((p) => p.id === selectedPatient);
  const selectedStudyData = worklist.find((w) => w.id === selectedStudy);

  const patientStudies = worklist.filter((w) => w.patientId === selectedPatient);

  useEffect(() => {
    // Initialize speech recognition once on mount
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript.trim() && currentFieldRef.current) {
          if (currentFieldRef.current === 'findings') {
            setFindings(prev => (prev + ' ' + finalTranscript).trim());
          } else if (currentFieldRef.current === 'impression') {
            setImpression(prev => (prev + ' ' + finalTranscript).trim());
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setCurrentField(null);
      };

      recognitionRef.current.onerror = (event) => {
        // Ignore "aborted" errors - these are expected when user stops recording
        if (event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
        }
        setIsRecording(false);
        setCurrentField(null);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sync currentFieldRef whenever currentField changes so handlers access latest value
  useEffect(() => {
    currentFieldRef.current = currentField;
  }, [currentField]);

  const startRecording = (field: 'findings' | 'impression') => {
    if (recognitionRef.current && !isRecording) {
      setCurrentField(field);
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

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
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Create New Report</h2>
        <p className="text-sm text-muted-foreground">Complete the steps below to create a comprehensive medical imaging report</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 h-2 rounded-full ${selectedPatient ? 'bg-green-500' : 'bg-muted'}`}></div>
        <div className={`flex-1 h-2 rounded-full ${selectedStudy ? 'bg-green-500' : 'bg-muted'}`}></div>
        <div className={`flex-1 h-2 rounded-full ${findings && impression ? 'bg-green-500' : 'bg-muted'}`}></div>
      </div>

      {/* Patient Selection */}
      <Card className="border-border hover:shadow-sm transition-shadow">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
            <CardTitle className="text-base">Select Patient</CardTitle>
            {selectedPatient && <span className="ml-auto text-xs text-green-600 font-semibold">✓ Complete</span>}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
        <Card className="border-border hover:shadow-sm transition-shadow">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
              <CardTitle className="text-base">Select Study</CardTitle>
              {selectedStudy && <span className="ml-auto text-xs text-green-600 font-semibold">✓ Complete</span>}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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
        <Card className="border-border hover:shadow-sm transition-shadow">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
              <CardTitle className="text-base">Write Report</CardTitle>
              {findings && impression && <span className="ml-auto text-xs text-green-600 font-semibold">✓ Complete</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="findings" className="text-base font-semibold">Findings *</Label>
                <div className="flex gap-2">
                  {isRecording && currentField === 'findings' ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startRecording('findings')}
                      disabled={isRecording}
                      className="gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Voice Dictate
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                id="findings"
                placeholder="Enter detailed findings from the study... or use voice dictation"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="bg-input border-border min-h-40"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="impression" className="text-base font-semibold">Clinical Impression *</Label>
                <div className="flex gap-2">
                  {isRecording && currentField === 'impression' ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startRecording('impression')}
                      disabled={isRecording}
                      className="gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Voice Dictate
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                id="impression"
                placeholder="Enter clinical impression and conclusions... or use voice dictation"
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="bg-input border-border min-h-40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Radiologist</Label>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="font-semibold text-foreground">Dr. John Smith</p>
                <p className="text-xs text-muted-foreground mt-1">Certified Radiologist</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Status</Label>
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                    COMPLETED
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Report Generated</Label>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-mono text-foreground">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Ready to submit? </span>
                Make sure all findings and clinical impression details are accurate and complete before generating the report.
              </p>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!findings || !impression}
              className="w-full bg-primary hover:bg-primary/90 gap-2 py-6 text-base font-semibold"
            >
              <FileText className="h-5 w-5" />
              Generate & Save Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
