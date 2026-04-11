'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  approveReport,
  signReport,
  getStudyReports,
  Report,
  ReportListResponse,
  ReportFilters,
} from '@/services/reports-service';
import { handleApiError } from '@/lib/api-error-handler';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const { can } = useAuth();
  const [reports, setReports] = useState<ReportListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [studyIdFilter, setStudyIdFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    study_id: '',
    patient_id: '',
    findings: '',
    impression: '',
    recommendations: '',
  });

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters: ReportFilters = {
          page,
          page_size: pageSize,
          status: (statusFilter as any) || undefined,
          study_id: studyIdFilter || undefined,
        };

        const data = await listReports(filters);
        setReports(data);
      } catch (err) {
        const message = handleApiError(err).message;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchReports, 300);
    return () => clearTimeout(timer);
  }, [page, pageSize, statusFilter, studyIdFilter]);

  const handleCreateReport = async () => {
    try {
      if (!formData.study_id || !formData.patient_id || !formData.findings || !formData.impression) {
        toast.error('Please fill in all required fields');
        return;
      }

      await createReport({
        study_id: formData.study_id,
        patient_id: formData.patient_id,
        findings: formData.findings,
        impression: formData.impression,
        recommendations: formData.recommendations || undefined,
      });

      toast.success('Report created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        study_id: '',
        patient_id: '',
        findings: '',
        impression: '',
        recommendations: '',
      });

      // Refresh list
      setPage(1);
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
    }
  };

  const handleUpdateReport = async () => {
    try {
      if (!selectedReport || !formData.findings || !formData.impression) {
        toast.error('Please fill in all required fields');
        return;
      }

      await updateReport(selectedReport.id, {
        findings: formData.findings,
        impression: formData.impression,
        recommendations: formData.recommendations || undefined,
      });

      toast.success('Report updated successfully');
      setIsEditDialogOpen(false);

      // Refresh list
      setPage(1);
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await approveReport(reportId);
      toast.success('Report approved');
      setPage(1);
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
    }
  };

  const handleSignReport = async (reportId: string) => {
    try {
      await signReport(reportId);
      toast.success('Report signed');
      setPage(1);
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(reportId);
      toast.success('Report deleted');
      setPage(1);
    } catch (err) {
      const message = handleApiError(err).message;
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'completed':
        return 'secondary';
      case 'signed':
        return 'default';
      case 'approved':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = reports ? Math.ceil(reports.total / pageSize) : 1;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Reports</h1>
          </div>
          <p className="text-muted-foreground">
            Create, view, and manage radiologist reports
          </p>
        </div>
        {can('report.write') && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by study ID or patient ID..."
                value={studyIdFilter}
                onChange={(e) => {
                  setStudyIdFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm mb-2 block">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Reports
              {reports && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({reports.total})
                </span>
              )}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports && reports.items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Study ID</TableHead>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Radiologist</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.items.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.study_id}</TableCell>
                        <TableCell>{report.patient_id}</TableCell>
                        <TableCell>{report.radiologist_name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {report.status === 'draft' && can('report.write') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setFormData({
                                      study_id: report.study_id,
                                      patient_id: report.patient_id,
                                      findings: report.findings,
                                      impression: report.impression,
                                      recommendations: report.recommendations || '',
                                    });
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteReport(report.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {report.status === 'completed' && can('report.sign') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleSignReport(report.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}

                            {report.status === 'signed' && can('report.approve') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => handleApproveReport(report.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>No reports found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="study_id">Study ID *</Label>
                <Input
                  id="study_id"
                  value={formData.study_id}
                  onChange={(e) =>
                    setFormData({ ...formData, study_id: e.target.value })
                  }
                  placeholder="Enter study ID"
                />
              </div>
              <div>
                <Label htmlFor="patient_id">Patient ID *</Label>
                <Input
                  id="patient_id"
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  placeholder="Enter patient ID"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="findings">Findings *</Label>
              <Textarea
                id="findings"
                value={formData.findings}
                onChange={(e) =>
                  setFormData({ ...formData, findings: e.target.value })
                }
                placeholder="Describe your findings..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="impression">Impression *</Label>
              <Textarea
                id="impression"
                value={formData.impression}
                onChange={(e) =>
                  setFormData({ ...formData, impression: e.target.value })
                }
                placeholder="Enter your clinical impression..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) =>
                  setFormData({ ...formData, recommendations: e.target.value })
                }
                placeholder="Any recommended follow-up or procedures..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit_findings">Findings *</Label>
              <Textarea
                id="edit_findings"
                value={formData.findings}
                onChange={(e) =>
                  setFormData({ ...formData, findings: e.target.value })
                }
                placeholder="Describe your findings..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="edit_impression">Impression *</Label>
              <Textarea
                id="edit_impression"
                value={formData.impression}
                onChange={(e) =>
                  setFormData({ ...formData, impression: e.target.value })
                }
                placeholder="Enter your clinical impression..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="edit_recommendations">Recommendations</Label>
              <Textarea
                id="edit_recommendations"
                value={formData.recommendations}
                onChange={(e) =>
                  setFormData({ ...formData, recommendations: e.target.value })
                }
                placeholder="Any recommended follow-up or procedures..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateReport}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Report ID
                  </p>
                  <p className="font-mono text-sm font-semibold">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Date
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </p>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Study Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Study ID</p>
                    <p className="font-semibold">{selectedReport.study_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Patient ID</p>
                    <p className="font-semibold">{selectedReport.patient_id}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Radiologist</h3>
                <p className="text-sm">{selectedReport.radiologist_name || '-'}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Findings</h3>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedReport.findings}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Impression</h3>
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedReport.impression}
                  </p>
                </div>
              </div>

              {selectedReport.recommendations && (
                <div>
                  <h3 className="font-bold mb-2">Recommendations</h3>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReport.recommendations}
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.signed_by_name && selectedReport.signed_at && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Signed by {selectedReport.signed_by_name} on{' '}
                    {new Date(selectedReport.signed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

