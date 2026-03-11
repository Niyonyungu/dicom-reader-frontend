'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useReports } from '@/context/reports-context';
import { useWorklist } from '@/context/worklist-context';
import { usePatients } from '@/context/patients-context';
import { Report } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from '@/components/reports/report-generator';
import { exportReportAsPDF, exportReportAsDocx } from '@/lib/export-utils';
import { FileText, Download, Eye } from 'lucide-react';
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    alert('Report saved successfully!');
  };

  const handleExportPDF = async (report: Report) => {
    setIsExporting(true);
    try {
      const content = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
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
          <p><strong>Radiologist:</strong> ${report.radiologist}</p>
          <p><strong>Signature:</strong> ___________________________</p>
          <p><em>Generated on ${new Date().toLocaleString()}</em></p>
        </div>
      `;

      await exportReportAsPDF(content, `report-${report.id}.pdf`);
    } catch (error) {
      alert('Error exporting PDF');
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

      {/* Only show generator for admin and service roles */}
      {user?.role !== 'user' && (
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="bg-muted/50 border-b border-border">
            <TabsTrigger value="create">Create Report</TabsTrigger>
            <TabsTrigger value="view">View Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <ReportGenerator
              patients={patients}
              worklist={worklist}
              onReportGenerate={handleReportGenerate}
            />
          </TabsContent>

          <TabsContent value="view" className="space-y-6">
            {renderReportsList()}
          </TabsContent>
        </Tabs>
      )}

      {/* Show only reports for regular users */}
      {user?.role === 'user' && renderReportsList()}

      {/* Report Preview Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="sm:max-w-[700px] border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Preview</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Report ID</p>
                  <p className="font-semibold text-foreground">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Findings</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedReport.findings}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Impression
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedReport.impression}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Radiologist</p>
                <p className="font-semibold text-foreground">
                  {selectedReport.radiologist}
                </p>
              </div>
            </div>

            <DialogFooter className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="border-border"
              >
                Close
              </Button>
              <Button
                onClick={() => handleExportPDF(selectedReport)}
                disabled={isExporting}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => handleExportDOCX(selectedReport)}
                disabled={isExporting}
                className="gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Export DOCX
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
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No reports found
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">All Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      Report {report.id}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Patient: {report.patientId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPDF(report)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
}
