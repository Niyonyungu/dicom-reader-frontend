"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import {
    listAuditLogs,
    exportAuditLogs,
    AuditLogListResponse,
    AuditLogFilters,
} from "@/services/audit-service";

/**
 * Audit Logs Page
 * Admin-only page for viewing and exporting audit logs
 * Supports filtering by date, action, severity, resource type
 */
export default function AuditLogsPage() {
    const { user, can } = useAuth();

    // State
    const [logs, setLogs] = useState<AuditLogListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [actionFilter, setActionFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Check permission
    if (!can("audit_log.read")) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You do not have permission to view audit logs
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Fetch logs
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError(null);

                const filters: AuditLogFilters = {
                    page,
                    page_size: pageSize,
                    action: actionFilter || undefined,
                    severity: severityFilter || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                };

                const data = await listAuditLogs(filters);
                setLogs(data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load audit logs"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [page, pageSize, actionFilter, severityFilter, startDate, endDate]);

    // Handle export
    const handleExport = async () => {
        try {
            setExporting(true);
            const filters: AuditLogFilters = {
                action: actionFilter || undefined,
                severity: severityFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            };

            const blob = await exportAuditLogs(filters);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Audit logs exported successfully");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Export failed";
            setError(message);
            toast.error(message);
        } finally {
            setExporting(false);
        }
    };

    // Get severity color
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "info":
                return "bg-blue-100 text-blue-800";
            case "warning":
                return "bg-yellow-100 text-yellow-800";
            case "error":
                return "bg-orange-100 text-orange-800";
            case "critical":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const totalPages = logs ? Math.ceil(logs.total / pageSize) : 1;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground mt-1">
                    View and export user actions and system events
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Action Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Action</label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Actions</SelectItem>
                                    <SelectItem value="LOGIN">Login</SelectItem>
                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                    <SelectItem value="STUDY_VIEWED">Study Viewed</SelectItem>
                                    <SelectItem value="MEASUREMENT_CREATED">
                                        Measurement Created
                                    </SelectItem>
                                    <SelectItem value="ANNOTATION_CREATED">
                                        Annotation Created
                                    </SelectItem>
                                    <SelectItem value="REPORT_CREATED">Report Created</SelectItem>
                                    <SelectItem value="REPORT_SIGNED">Report Signed</SelectItem>
                                    <SelectItem value="USER_CREATED">User Created</SelectItem>
                                    <SelectItem value="PATIENT_CREATED">Patient Created</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Severity Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Severity</label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Levels</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Page Size */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Per Page</label>
                            <Select value={pageSize.toString()} onValueChange={(v) => {
                                setPageSize(Number(v));
                                setPage(1);
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setActionFilter("");
                                setSeverityFilter("");
                                setStartDate("");
                                setEndDate("");
                                setPage(1);
                            }}
                            variant="outline"
                            size="sm"
                        >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Reset Filters
                        </Button>

                        <Button
                            onClick={handleExport}
                            disabled={exporting || !logs}
                            size="sm"
                            variant="outline"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            {exporting ? "Exporting..." : "Export CSV"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Loading audit logs...</span>
                        </div>
                    </CardContent>
                </Card>
            ) : logs && logs.items.length > 0 ? (
                <>
                    {/* Logs Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Audit Logs ({logs.total} total)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>IP Address</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.items.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-muted/50">
                                                <TableCell className="text-sm">
                                                    {formatDate(log.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">ID: {log.user_id}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{log.user_role}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {log.action.replace(/_/g, " ")}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {log.resource_type}
                                                    {log.resource_id && (
                                                        <span className="text-muted-foreground">
                                                            {" "}
                                                            ({log.resource_id.substring(0, 8)}...)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getSeverityColor(log.severity)}>
                                                        {log.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">
                                                    {log.ip_address || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const p = i + 1;
                                        // Show first 3, last 3, and current page with neighbors
                                        if (
                                            p <= 3 ||
                                            p >= totalPages - 2 ||
                                            (p >= page - 1 && p <= page + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={p}>
                                                    <PaginationLink
                                                        onClick={() => setPage(p)}
                                                        isActive={page === p}
                                                    >
                                                        {p}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }

                                        // Show ellipsis
                                        if (p === 4 || (p === totalPages - 3 && totalPages > 6)) {
                                            return (
                                                <PaginationItem key={`ellipsis-${p}`}>
                                                    <span className="px-2">...</span>
                                                </PaginationItem>
                                            );
                                        }

                                        return null;
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            disabled={page === totalPages}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            No audit logs found
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
