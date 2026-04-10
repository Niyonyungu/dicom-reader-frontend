/**
 * RBAC Integration Example Component
 * Shows complete example of permission-gated UI with real patterns
 *
 * This component demonstrates:
 * - Permission checking with usePermissions hook
 * - Role-based visibility
 * - Dynamic button enabling/disabling
 * - Multi-permission requirements
 * - Error handling for 403 responses
 */

"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { UserRole, Permissions } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-error-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Lock, CheckCircle } from "lucide-react";

/**
 * Example: Reports management screen with permission-gated actions
 */
export function ReportsExampleComponent() {
    const { can, canAny, canCreate, canDelete, hasRole, userRole, permissions } =
        usePermissions();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Mock data
    const reports = [
        {
            id: 1,
            title: "Chest X-ray Report",
            status: "completed",
            createdBy: "Dr. Smith",
        },
        {
            id: 2,
            title: "CT Scan Analysis",
            status: "pending",
            createdBy: "Dr. Johnson",
        },
    ];

    /**
     * Example: API call with 403 error handling
     */
    const handleCreateReport = async () => {
        try {
            setError(null);
            setLoading(true);

            // In real app, this would call the API
            // const result = await apiClient.post('/reports', reportData);

            // Simulate success
            console.log("Report created successfully");
        } catch (err) {
            const handled = handleApiError(err, {
                context: "Failed to create report",
            });

            if (handled.isForbidden) {
                setError(`Permission denied: ${handled.message}`);
            } else {
                setError(handled.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with permission info */}
            <Card>
                <CardHeader>
                    <CardTitle>Reports Management</CardTitle>
                    <CardDescription>
                        Current role: <Badge variant="outline">{userRole}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div>
                            Your permissions:
                            <div className="mt-2 flex flex-wrap gap-2">
                                {permissions.length > 0 ? (
                                    permissions.map((perm) => (
                                        <Badge key={perm} variant="secondary">
                                            {perm}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">No permissions</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error message */}
            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-destructive">Access Denied</p>
                        <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                </div>
            )}

            {/* Create report button - conditionally shown */}
            {canCreate("report") ? (
                <Button
                    onClick={handleCreateReport}
                    disabled={loading}
                    className="gap-2"
                >
                    <CheckCircle className="h-4 w-4" />
                    {loading ? "Creating..." : "Create New Report"}
                </Button>
            ) : (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        You don't have permission to create reports
                    </span>
                </div>
            )}

            {/* Reports list with conditional actions */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Reports</h3>

                {reports.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No reports found
                    </div>
                ) : (
                    reports.map((report) => (
                        <Card key={report.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{report.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            By {report.createdBy} • Status: {report.status}
                                        </p>
                                    </div>

                                    {/* Action buttons - shown based on permissions */}
                                    <div className="flex gap-2">
                                        {/* View/Read always available if can read */}
                                        {can(Permissions.REPORT_READ) && (
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                        )}

                                        {/* Edit - requires write permission */}
                                        {can(Permissions.REPORT_WRITE) && (
                                            <Button variant="outline" size="sm">
                                                Edit
                                            </Button>
                                        )}

                                        {/* Delete - requires delete permission */}
                                        {canDelete("report") && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={!canDelete("report")}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Role-specific features */}
            <Card>
                <CardHeader>
                    <CardTitle>Role-Specific Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Admin features */}
                    {hasRole(UserRole.ADMIN) && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="font-medium text-blue-900">Admin Features</p>
                            <ul className="text-sm text-blue-800 mt-2 space-y-1">
                                <li>✓ Manage all users</li>
                                <li>✓ View RBAC matrix</li>
                                <li>✓ Full system access</li>
                            </ul>
                        </div>
                    )}

                    {/* Service features */}
                    {hasRole(UserRole.SERVICE) && (
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <p className="font-medium text-purple-900">Service Features</p>
                            <ul className="text-sm text-purple-800 mt-2 space-y-1">
                                <li>✓ Manage users</li>
                                <li>✓ Provision accounts</li>
                            </ul>
                        </div>
                    )}

                    {/* Radiologist features */}
                    {hasRole(UserRole.RADIOLOGIST) && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="font-medium text-green-900">Radiologist Features</p>
                            <ul className="text-sm text-green-800 mt-2 space-y-1">
                                <li>✓ Full study access</li>
                                <li>✓ Create reports</li>
                                <li>✓ Add measurements</li>
                            </ul>
                        </div>
                    )}

                    {/* Technician features */}
                    {(hasRole(UserRole.IMAGING_TECHNICIAN) ||
                        hasRole(UserRole.RADIOGRAPHER)) && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="font-medium text-amber-900">Technician Features</p>
                                <ul className="text-sm text-amber-800 mt-2 space-y-1">
                                    <li>✓ Upload DICOM studies</li>
                                    <li>✓ View studies</li>
                                    <li>✓ Limited report access</li>
                                </ul>
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Feature flags examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Common Permission Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm font-medium">Can read studies</span>
                        <Badge variant={can(Permissions.STUDY_READ) ? "default" : "secondary"}>
                            {can(Permissions.STUDY_READ) ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm font-medium">Can upload DICOM</span>
                        <Badge variant={can(Permissions.DICOM_UPLOAD) ? "default" : "secondary"}>
                            {can(Permissions.DICOM_UPLOAD) ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm font-medium">
                            Can manage reports or measurements
                        </span>
                        <Badge
                            variant={
                                canAny([
                                    Permissions.REPORT_WRITE,
                                    Permissions.MEASUREMENT_WRITE,
                                ])
                                    ? "default"
                                    : "secondary"
                            }
                        >
                            {canAny([
                                Permissions.REPORT_WRITE,
                                Permissions.MEASUREMENT_WRITE,
                            ])
                                ? "Yes"
                                : "No"}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm font-medium">Is admin/service</span>
                        <Badge
                            variant={
                                hasRole(UserRole.ADMIN) || hasRole(UserRole.SERVICE)
                                    ? "default"
                                    : "secondary"
                            }
                        >
                            {hasRole(UserRole.ADMIN) || hasRole(UserRole.SERVICE)
                                ? "Yes"
                                : "No"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
