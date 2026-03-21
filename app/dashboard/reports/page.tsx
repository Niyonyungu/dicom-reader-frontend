'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useReports } from '@/context/reports-context';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { useToast } from '@/components/ui/use-toast';
import { Report } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from '@/components/reports/report-generator';
import { exportReportAsPDF, exportReportAsDocx } from '@/lib/export-utils';
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ReportsPage() {
  const { user } = useAuth();
  const { reports, addReport } = useReports();
  const { worklist } = useWorklist();
  const { patients } = usePatients();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [generatorKey, setGeneratorKey] = useState(0);

  const handleReportGenerate = (reportData: {
    patientId: string;
    worklistId: string;
    findings: string;
    impression: string;
  }) => {
    const newReport: Report = {
      id: `R${Date.now()}`,
      patientId: reportData.patientId,
      worklistId: reportData.worklistId,
      radiologist: user?.name || 'Unknown',
      findings: reportData.findings,
      impression: reportData.impression,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    addReport(newReport);

    // Show success toast
    toast({
      title: "Report Saved Successfully",
      description: "Your report has been saved and is now available in the reports list.",
      duration: 3000,
    });

    // Reset form by changing key and switch to view tab
    setGeneratorKey(prev => prev + 1);
    setTimeout(() => {
      setActiveTab('view');
    }, 500);
  };

  const handleExportPDF = async (report: Report) => {
    setIsExporting(true);
    try {
      // Create a simple HTML structure without complex CSS that might cause issues
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000000; background: #ffffff; }
            h1 { color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px; }
            h2 { color: #000000; margin-top: 30px; margin-bottom: 10px; }
            p { margin: 10px 0; line-height: 1.5; }
            strong { font-weight: bold; }
            hr { border: none; border-top: 1px solid #cccccc; margin: 20px 0; }
            .signature { margin-top: 40px; }
          </style>
        </head>
        <body>
          <h1>Medical Imaging Report</h1>

          <h2>Patient Information</h2>
          <p><strong>Patient ID:</strong> ${report.patientId}</p>
          <p><strong>Report ID:</strong> ${report.id}</p>
          <p><strong>Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>

          <h2>Findings</h2>
          <p>${report.findings.replace(/\n/g, '<br>')}</p>

          <h2>Impression</h2>
          <p>${report.impression.replace(/\n/g, '<br>')}</p>

          <h2>Recommendations</h2>
          <p>${report.recommendations || 'None specified'}</p>

          <hr>
          <div class="signature">
            <p><strong>Radiologist:</strong> ${report.radiologist}</p>
            <p><strong>Signature:</strong> ___________________________</p>
            <p><em>Generated on ${new Date().toLocaleString()}</em></p>
          </div>
        </body>
        </html>
      `;

      await exportReportAsPDF(content, `report-${report.id}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDOCX = async (report: Report) => {
    setIsExporting(true);
    try {
      await exportReportAsDocx(
        {
          patientName:
            patients.find((p) => p.id === report.patientId)?.name || 'Unknown',
          patientId: report.patientId,
          studyDate: new Date(report.createdAt).toLocaleDateString(),
          modality:
            worklist.find((w) => w.id === report.worklistId)?.modality || 'N/A',
          findings: report.findings,
          impression: report.impression,
          radiologist: report.radiologist,
        },
        `report-${report.id}.docx`
      );
    } catch (error) {
      alert('Error exporting DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        </div>
        <p className="text-muted-foreground">
          Create, view, and manage medical imaging reports
        </p>
      </div>

      {/* generator available to all roles now */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 border-b border-border">
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="view">View Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <ReportGenerator
            key={generatorKey}
            patients={patients}
            worklist={worklist}
            onReportGenerate={handleReportGenerate}
          />
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          {renderReportsList()}
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="sm:max-w-2xl border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Medical Imaging Report</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4 bg-white p-6 rounded-lg border border-border">
              {/* Header Info */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Report ID</p>
                  <p className="font-mono text-sm font-semibold">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Date</p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedReport.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {selectedReport.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Patient & Study Info */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Patient Name</p>
                    <p className="font-semibold">{patients.find((p) => p.id === selectedReport.patientId)?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Patient ID</p>
                    <p className="font-mono font-semibold">{selectedReport.patientId}</p>
                  </div>
                  {worklist.find((w) => w.id === selectedReport.worklistId) && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Modality</p>
                        <p className="font-semibold">{worklist.find((w) => w.id === selectedReport.worklistId)?.modality}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Study Description</p>
                        <p className="font-semibold text-xs">{worklist.find((w) => w.id === selectedReport.worklistId)?.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Findings */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Findings</h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {selectedReport.findings}
                  </p>
                </div>
              </div>

              {/* Impression */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Clinical Impression</h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-semibold">
                    {selectedReport.impression}
                  </p>
                </div>
              </div>

              {/* Radiologist Info */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Radiologist</p>
                <p className="font-semibold text-foreground">{selectedReport.radiologist}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Report generated on {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="border-border"
              >
                Close
              </Button>
              <Button
                onClick={() => handleExportDOCX(selectedReport)}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                DOCX
              </Button>
              <Button
                onClick={() => handleExportPDF(selectedReport)}
                disabled={isExporting}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  function renderReportsList() {
    if (reports.length === 0) {
      return (
        <Card className="border-border">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-foreground mb-2">No Reports Yet</p>
            <p className="text-sm text-muted-foreground">Create your first report to get started</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">All Reports ({reports.length})</h2>
        </div>
        <div className="grid gap-4">
          {reports.map((report) => {
            const patient = patients.find((p) => p.id === report.patientId);
            const study = worklist.find((w) => w.id === report.worklistId);
            const statusIcon = report.status === 'completed' ?
              <CheckCircle className="h-5 w-5 text-green-600" /> :
              (report.status === 'draft' ?
                <Clock className="h-5 w-5 text-yellow-600" /> :
                <AlertCircle className="h-5 w-5 text-blue-600" />);

            return (
              <Card key={report.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {statusIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {patient?.name || 'Unknown Patient'}
                            </h3>
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {report.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm my-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Patient ID</p>
                              <p className="font-mono text-xs">{report.patientId}</p>
                            </div>
                            {study && (
                              <div>
                                <p className="text-xs text-muted-foreground">Modality</p>
                                <p className="font-semibold">{study.modality}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground">Radiologist</p>
                              <p className="font-semibold text-sm">{report.radiologist}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-sm">{new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {study && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Study: {study.description}
                            </p>
                          )}

                          <p className="text-sm line-clamp-2 text-foreground">
                            <span className="font-semibold">Findings: </span>
                            {report.findings.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(report)}
                        disabled={isExporting}
                        className="gap-2"
                        title="Export as PDF"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
}
