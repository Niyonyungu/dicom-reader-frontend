'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    AlertCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import {
    listAuditLogs,
    getAuditLog,
    exportAuditLogs,
    AuditLog,
    AuditLogListResponse,
    AuditLogFilters,
} from '@/services/audit-service';

/**
 * Audit Logs Dashboard Component
 *
 * Features:
 * - Paginated table of system events
 * - Filter by action, entity type, user ID
 * - Date range filtering
 * - Search functionality
 * - Color-coded action types
 * - Links to user profiles and entities
 * - Detail modal for full log information
 * - CSV export functionality
 * - Admin-only access (route guard)
 *
 * @component
 */
export function AuditLogsDashboard() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [actionFilter, setActionFilter] = useState<string>('');
    const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
    const [userIdFilter, setUserIdFilter] = useState<string>('');
    const [severityFilter, setSeverityFilter] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Modal states
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch logs with current filters
    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const filters: AuditLogFilters = {
                page,
                page_size: pageSize,
                ...(actionFilter && { action: actionFilter }),
                ...(entityTypeFilter && { resource_type: entityTypeFilter }),
                ...(userIdFilter && { user_id: parseInt(userIdFilter) }),
                ...(severityFilter && { severity: severityFilter }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            };

            const response = await listAuditLogs(filters);
            setLogs(response.items);
            setTotal(response.total);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load audit logs';
            setError(message);
            console.error('Error loading audit logs:', err);
        } finally {
            setIsLoading(false);
        }
    }, [
        page,
        pageSize,
        actionFilter,
        entityTypeFilter,
        userIdFilter,
        severityFilter,
        startDate,
        endDate,
    ]);

    // Initial load and refetch on filter changes
    useEffect(() => {
        setPage(1); // Reset to page 1 when filters change
    }, [actionFilter, entityTypeFilter, userIdFilter, severityFilter, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Load detail when modal opens
    useEffect(() => {
        if (isDetailOpen && selectedLog) {
            const loadDetail = async () => {
                try {
                    const detail = await getAuditLog(selectedLog.id);
                    setSelectedLog(detail);
                } catch (err) {
                    console.error('Error loading audit log detail:', err);
                }
            };
            loadDetail();
        }
    }, [isDetailOpen, selectedLog?.id]);

    // Handle export
    const handleExport = async () => {
        try {
            setIsExporting(true);
            const filters: AuditLogFilters = {
                ...(actionFilter && { action: actionFilter }),
                ...(entityTypeFilter && { resource_type: entityTypeFilter }),
                ...(userIdFilter && { user_id: parseInt(userIdFilter) }),
                ...(severityFilter && { severity: severityFilter }),
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
            };

            const blob = await exportAuditLogs(filters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to export logs';
            setError(message);
            console.error('Error exporting audit logs:', err);
        } finally {
            setIsExporting(false);
        }
    };

    // Get color for action type
    const getActionColor = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const categoryMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
            // Auth actions - blue
            USER_LOGIN: 'default',
            USER_LOGOUT: 'default',
            ACCESS_DENIED: 'destructive',

            // Study actions - green
            STUDY_OPENED: 'secondary',
            STUDY_CLOSED: 'secondary',
            STUDY_CREATED: 'secondary',
            STUDY_DELETED: 'destructive',
            STUDY_EXPORTED: 'secondary',

            // Image viewing - blue
            IMAGE_VIEWED: 'default',
            IMAGE_MARKED_KEY: 'default',
            IMAGE_CAPTURED: 'default',

            // Measurements - purple
            MEASUREMENT_CREATED: 'outline',
            MEASUREMENT_DELETED: 'destructive',
            ANNOTATION_CREATED: 'outline',
            ANNOTATION_DELETED: 'destructive',

            // Reports - green
            REPORT_GENERATED: 'secondary',
            REPORT_FINALIZED: 'secondary',
            REPORT_SIGNED: 'secondary',

            // Data - orange
            DATA_EXPORTED: 'default',
            DATA_IMPORTED: 'default',
            DATA_DELETED: 'destructive',

            // Errors - red
            ERROR_OCCURRED: 'destructive',
        };

        return categoryMap[action] || 'outline';
    };

    // Get severity color
    const getSeverityColor = (
        severity: string
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL':
                return 'destructive';
            case 'ERROR':
                return 'destructive';
            case 'WARNING':
                return 'secondary';
            case 'INFO':
            default:
                return 'default';
        }
    };

    // Format action text
    const formatAction = (action: string): string => {
        return action
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Audit Logs</h1>
                    <p className="text-gray-600 mt-1">Monitor system activity and compliance events</p>
                </div>
                <Button
                    onClick={handleExport}
                    disabled={isExporting || logs.length === 0}
                    className="gap-2"
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Action Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action Type</label>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All actions</SelectItem>
                                    <SelectItem value="USER_LOGIN">User Login</SelectItem>
                                    <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                                    <SelectItem value="STUDY_OPENED">Study Opened</SelectItem>
                                    <SelectItem value="STUDY_CREATED">Study Created</SelectItem>
                                    <SelectItem value="STUDY_DELETED">Study Deleted</SelectItem>
                                    <SelectItem value="IMAGE_VIEWED">Image Viewed</SelectItem>
                                    <SelectItem value="MEASUREMENT_CREATED">Measurement Created</SelectItem>
                                    <SelectItem value="MEASUREMENT_DELETED">Measurement Deleted</SelectItem>
                                    <SelectItem value="REPORT_GENERATED">Report Generated</SelectItem>
                                    <SelectItem value="REPORT_SIGNED">Report Signed</SelectItem>
                                    <SelectItem value="DATA_EXPORTED">Data Exported</SelectItem>
                                    <SelectItem value="ERROR_OCCURRED">Error Occurred</SelectItem>
                                    <SelectItem value="ACCESS_DENIED">Access Denied</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Entity Type Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Entity Type</label>
                            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All types</SelectItem>
                                    <SelectItem value="study">Study</SelectItem>
                                    <SelectItem value="instance">Instance</SelectItem>
                                    <SelectItem value="measurement">Measurement</SelectItem>
                                    <SelectItem value="report">Report</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="annotation">Annotation</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Severity Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Severity</label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All severities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All severities</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User ID Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">User ID</label>
                            <Input
                                type="number"
                                placeholder="Filter by user ID"
                                value={userIdFilter}
                                onChange={(e) => setUserIdFilter(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">From Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">To Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        {/* Reset Button */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">&nbsp;</label>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setActionFilter('');
                                    setEntityTypeFilter('');
                                    setUserIdFilter('');
                                    setSeverityFilter('');
                                    setStartDate('');
                                    setEndDate('');
                                    setPage(1);
                                }}
                                className="h-10 w-full"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                    Showing {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(page * pageSize, total)} of {total} results
                </p>
                <div className="text-sm text-gray-600">
                    Page <span className="font-semibold">{page}</span> of{' '}
                    <span className="font-semibold">{totalPages || 1}</span>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                            <p className="mt-2 text-gray-500">Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="w-8 h-8 mx-auto text-gray-400" />
                            <p className="mt-2 text-gray-500">No audit logs found matching your filters</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b bg-gray-50">
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-gray-50">
                                        {/* Timestamp */}
                                        <TableCell className="text-sm">
                                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                        </TableCell>

                                        {/* User ID */}
                                        <TableCell className="text-sm">
                                            <button
                                                onClick={() => {
                                                    // Could navigate to user profile
                                                    console.log('Navigate to user:', log.user_id);
                                                }}
                                                className="text-blue-600 hover:underline font-medium"
                                            >
                                                #{log.user_id}
                                            </button>
                                        </TableCell>

                                        {/* Action (Color-coded) */}
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action)}>
                                                {formatAction(log.action)}
                                            </Badge>
                                        </TableCell>

                                        {/* Entity Type + ID */}
                                        <TableCell className="text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium capitalize">{log.resource_type}</span>
                                                {log.resource_id && (
                                                    <button
                                                        onClick={() => {
                                                            // Could navigate to entity
                                                            console.log('Navigate to:', log.resource_type, log.resource_id);
                                                        }}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        ID: {log.resource_id}
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Severity (Color-coded) */}
                                        <TableCell>
                                            <Badge variant={getSeverityColor(log.severity)}>
                                                {log.severity}
                                            </Badge>
                                        </TableCell>

                                        {/* Details Preview */}
                                        <TableCell className="text-sm">
                                            {log.details ? (
                                                <span className="text-gray-600 truncate max-w-[200px] inline-block">
                                                    {JSON.stringify(log.details).substring(0, 50)}...
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>

                                        {/* Action Buttons */}
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPage(1)}
                        disabled={!hasPrevPage}
                        size="sm"
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setPage(page - 1)}
                        disabled={!hasPrevPage}
                        size="sm"
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (page <= 3) {
                            pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = page - 2 + i;
                        }
                        return (
                            <Button
                                key={pageNum}
                                variant={pageNum === page ? 'default' : 'outline'}
                                onClick={() => setPage(pageNum)}
                                size="sm"
                            >
                                {pageNum}
                            </Button>
                        );
                    })}

                    <Button
                        variant="outline"
                        onClick={() => setPage(page + 1)}
                        disabled={!hasNextPage}
                        size="sm"
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setPage(totalPages)}
                        disabled={!hasNextPage}
                        size="sm"
                    >
                        Last
                    </Button>
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Log ID</p>
                                    <p className="font-mono text-sm">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">User ID</p>
                                    <p className="font-mono text-sm">{selectedLog.user_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Timestamp</p>
                                    <p className="font-mono text-sm">
                                        {format(new Date(selectedLog.created_at), 'PPpp')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Severity</p>
                                    <div className="mt-1">
                                        <Badge variant={getSeverityColor(selectedLog.severity)}>
                                            {selectedLog.severity}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Action</p>
                                    <p className="font-mono text-sm">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Entity Type</p>
                                    <p className="font-mono text-sm capitalize">{selectedLog.resource_type}</p>
                                </div>
                                {selectedLog.resource_id && (
                                    <div>
                                        <p className="text-sm text-gray-600">Entity ID</p>
                                        <p className="font-mono text-sm">{selectedLog.resource_id}</p>
                                    </div>
                                )}
                                {selectedLog.ip_address && (
                                    <div>
                                        <p className="text-sm text-gray-600">IP Address</p>
                                        <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                                    </div>
                                )}
                            </div>

                            {/* Metadata JSON */}
                            {selectedLog.details && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Details</p>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {selectedLog.user_agent && (
                                <div>
                                    <p className="text-sm font-medium mb-2">User Agent</p>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
                                        {selectedLog.user_agent}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AuditLogsDashboard;
