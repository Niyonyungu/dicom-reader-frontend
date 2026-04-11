"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    ArrowLeft,
    Edit2,
    Loader2,
    Save,
    CheckCircle,
    Signature,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    getReport,
    updateReport,
    approveReport,
    signReport,
    Report,
} from "@/services/reports-service";
import { handleApiError } from "@/lib/api-error-handler";
import { toast } from "sonner";

/**
 * Report Detail Page
 * View detailed report and manage workflow (approve, sign)
 */
export default function ReportDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { can, user } = useAuth();
    const reportId = params.id as string;

    // State
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signDialogOpen, setSignDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        findings: "",
        impression: "",
        recommendations: "",
    });

    // Fetch report
    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getReport(reportId);
                setReport(data);
                setFormData({
                    findings: data.findings,
                    impression: data.impression,
                    recommendations: data.recommendations || "",
                });
            } catch (err) {
                setError(handleApiError(err).message);
            } finally {
                setLoading(false);
            }
        };

        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    // Handle update
    const handleUpdate = async () => {
        if (!report) return;

        try {
            setSubmitting(true);
            setError(null);

            await updateReport(reportId, {
                findings: formData.findings,
                impression: formData.impression,
                recommendations: formData.recommendations || undefined,
            });

            // Refresh report
            const updated = await getReport(reportId);
            setReport(updated);
            setEditing(false);
            toast.success("Report updated successfully");
        } catch (err) {
            const message = handleApiError(err).message;
            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle approve
    const handleApprove = async () => {
        if (!report) return;

        try {
            setSubmitting(true);
            setError(null);

            const approved = await approveReport(reportId);
            setReport(approved);
            setApproveDialogOpen(false);
            toast.success("Report approved successfully");
        } catch (err) {
            const message = handleApiError(err).message;
            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle sign
    const handleSign = async () => {
        if (!report) return;

        try {
            setSubmitting(true);
            setError(null);

            const signed = await signReport(reportId);
            setReport(signed);
            setSignDialogOpen(false);
            toast.success("Report signed successfully");
        } catch (err) {
            const message = handleApiError(err).message;
            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "draft":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-amber-100 text-amber-800";
            case "signed":
                return "bg-green-100 text-green-800";
            case "approved":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Report not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Back Button */}
            <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Report {report.id.substring(0, 8)}</h1>
                    <p className="text-muted-foreground mt-1">
                        Study: {report.study_id} | Patient: {report.patient_id}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge className={getStatusColor(report.status)}>
                        {report.status}
                    </Badge>
                    {!editing && can("report.update") && report.status === "draft" && (
                        <Button
                            onClick={() => setEditing(true)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                    {editing && (
                        <>
                            <Button
                                onClick={handleUpdate}
                                disabled={submitting}
                                size="sm"
                                className="gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save
                            </Button>
                            <Button
                                onClick={() => setEditing(false)}
                                variant="outline"
                                size="sm"
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Report Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Clinical Findings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Findings */}
                    <div>
                        <label className="text-sm font-semibold mb-2 block">Findings</label>
                        {editing ? (
                            <Textarea
                                value={formData.findings}
                                onChange={(e) =>
                                    setFormData({ ...formData, findings: e.target.value })
                                }
                                rows={5}
                                className="resize-none"
                            />
                        ) : (
                            <div className="p-4 bg-muted rounded whitespace-pre-wrap">
                                {report.findings || "—"}
                            </div>
                        )}
                    </div>

                    {/* Impression */}
                    <div>
                        <label className="text-sm font-semibold mb-2 block">
                            Impression
                        </label>
                        {editing ? (
                            <Textarea
                                value={formData.impression}
                                onChange={(e) =>
                                    setFormData({ ...formData, impression: e.target.value })
                                }
                                rows={4}
                                className="resize-none"
                            />
                        ) : (
                            <div className="p-4 bg-muted rounded whitespace-pre-wrap">
                                {report.impression || "—"}
                            </div>
                        )}
                    </div>

                    {/* Recommendations */}
                    <div>
                        <label className="text-sm font-semibold mb-2 block">
                            Recommendations
                        </label>
                        {editing ? (
                            <Textarea
                                value={formData.recommendations}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        recommendations: e.target.value,
                                    })
                                }
                                rows={3}
                                className="resize-none"
                            />
                        ) : (
                            <div className="p-4 bg-muted rounded whitespace-pre-wrap">
                                {report.recommendations || "—"}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Workflow Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Workflow & Approvals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Radiologist */}
                        <div className="p-4 bg-muted rounded space-y-2">
                            <p className="text-sm text-muted-foreground">Radiologist</p>
                            <p className="font-semibold">
                                {report.radiologist_name || `ID: ${report.radiologist_id}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Created: {formatDate(report.created_at)}
                            </p>
                        </div>

                        {/* Signed By */}
                        <div className="p-4 bg-muted rounded space-y-2">
                            <p className="text-sm text-muted-foreground">Signed By</p>
                            {report.signed_by_name ? (
                                <>
                                    <p className="font-semibold">{report.signed_by_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {report.signed_at && formatDate(report.signed_at)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">Not yet signed</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                        {can("report.update") && report.status === "draft" && (
                            <Button
                                onClick={() => setApproveDialogOpen(true)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={submitting}
                            >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                            </Button>
                        )}

                        {(can("report.sign") ||
                            (user?.role === "radiologist" && report.radiologist_id === user?.id)) &&
                            (report.status === "completed" || report.status === "draft") && (
                                <Button
                                    onClick={() => setSignDialogOpen(true)}
                                    size="sm"
                                    className="gap-2"
                                    disabled={submitting}
                                >
                                    <Signature className="h-4 w-4" />
                                    Sign Report
                                </Button>
                            )}
                    </div>
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Report</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground py-4">
                        Are you sure you want to approve this report? Once approved, it can
                        be signed by the radiologist.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={submitting}
                            className="gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sign Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign Report</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground py-4">
                        By signing this report, you confirm that it is accurate and complete.
                        This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSignDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSign}
                            disabled={submitting}
                            className="gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Signature className="h-4 w-4" />
                            )}
                            Sign & Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Metadata */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Report ID:</span>
                        <span className="font-mono">{report.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Study ID:</span>
                        <span className="font-mono">{report.study_id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Patient ID:</span>
                        <span>{report.patient_id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(report.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{formatDate(report.updated_at)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
