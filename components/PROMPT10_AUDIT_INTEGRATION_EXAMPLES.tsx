'use client';

/**
 * Prompt 10: Audit Logs Dashboard — Integration Examples
 *
 * This file demonstrates 6 real-world usage patterns for the audit logs dashboard
 * and audit service integration.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
    listAuditLogs,
    getAuditLog,
    getStudyAuditLogs,
    getUserAuditLogs,
    exportAuditLogs,
    AuditLog,
    AuditLogFilters,
} from '@/services/audit-service';
import AuditLogsDashboard from '@/components/audit-logs-dashboard';

// ============================================================================
// Example 1: Simple Audit Dashboard Page (Admin Layout Integration)
// ============================================================================
/**
 * Example 1: Simple dashboard page that can be added to the admin layout
 * Route: /admin/audit-logs
 */
export function Example1_AuditDashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <AuditLogsDashboard />
            </div>
        </div>
    );
}

// ============================================================================
// Example 2: Audit Logs for a Specific Study (Study Detail Page Tab)
// ============================================================================
/**
 * Example 2: Embedded audit view for a specific study
 * Used in: Study detail page, "Audit History" tab
 */
export function Example2_StudyAuditTab({ studyId }: { studyId: string }) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStudyAuditLogs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getStudyAuditLogs(studyId, {
                page: 1,
                page_size: 10,
            });
            setLogs(response.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
            console.error('Error loading study audit logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadStudyAuditLogs();
    }, [studyId]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Audit History</CardTitle>
                    <Button variant="outline" size="sm" onClick={loadStudyAuditLogs} disabled={isLoading}>
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

                {isLoading ? (
                    <div className="text-center text-gray-500">Loading audit logs...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center text-gray-500">No audit events for this study</div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div>
                                    <p className="font-medium">{log.action}</p>
                                    <p className="text-sm text-gray-600">User #{log.user_id}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="mb-1 block">{log.severity}</Badge>
                                    <p className="text-xs text-gray-500">{format(new Date(log.created_at), 'MMM dd HH:mm')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 3: User Activity Monitor (User Detail Page)
// ============================================================================
/**
 * Example 3: View all audit logs for a specific user
 * Used in: User management detail, activity history section
 */
export function Example3_UserActivityMonitor({ userId: targetUserId }: { userId: number }) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const pageSize = 15;

    const loadUserLogs = async () => {
        try {
            setIsLoading(true);
            const response = await getUserAuditLogs(targetUserId, {
                page,
                page_size: pageSize,
            });
            setLogs(response.items);
            setTotal(response.total);
        } catch (err) {
            console.error('Error loading user audit logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadUserLogs();
    }, [targetUserId, page]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center text-gray-500">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-gray-500">No activity recorded</div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Action</th>
                                        <th className="text-left p-2">Entity</th>
                                        <th className="text-left p-2">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">
                                                <Badge variant="outline">{log.action}</Badge>
                                            </td>
                                            <td className="p-2 capitalize">{log.resource_type}</td>
                                            <td className="p-2 text-gray-600">
                                                {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {total > pageSize && (
                                <div className="flex justify-between items-center mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {page} of {Math.ceil(total / pageSize)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= Math.ceil(total / pageSize)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 4: Compliance Report Builder (Secure Export)
// ============================================================================
/**
 * Example 4: Build filtered compliance reports with date ranges
 * Used in: Compliance dashboard, audit report generation
 */
export function Example4_ComplianceReportBuilder() {
    const [startDate, setStartDate] = useState(
        format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    );
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [actionFilter, setActionFilter] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>(
        'idle'
    );

    const handleGenerateReport = async () => {
        try {
            setIsExporting(true);
            setExportStatus('exporting');

            const filters: AuditLogFilters = {
                start_date: startDate,
                end_date: endDate,
                ...(actionFilter && { action: actionFilter }),
            };

            const blob = await exportAuditLogs(filters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `compliance-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportStatus('success');
            setTimeout(() => setExportStatus('idle'), 3000);
        } catch (err) {
            console.error('Export failed:', err);
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Compliance Report</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Action Filter (Optional)</label>
                            <input
                                type="text"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                placeholder="e.g., USER_LOGIN"
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    {exportStatus !== 'idle' && (
                        <Alert variant={exportStatus === 'error' ? 'destructive' : 'default'}>
                            <AlertDescription>
                                {exportStatus === 'success' && '✓ Report exported successfully!'}
                                {exportStatus === 'error' && '✗ Failed to export report'}
                                {exportStatus === 'exporting' && 'Generating report...'}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button
                        onClick={handleGenerateReport}
                        disabled={isExporting}
                        className="w-full"
                    >
                        {isExporting ? 'Generating...' : 'Generate CSV Report'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 5: Real-Time Activity Monitor (Dashboard Card)
// ============================================================================
/**
 * Example 5: Live activity feed showing recent events
 * Used in: Admin dashboard, system monitoring
 */
export function Example5_RecentActivityFeed() {
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRecentActivity = async () => {
        try {
            setIsLoading(true);
            const response = await listAuditLogs({
                page: 1,
                page_size: 8,
            });
            setRecentLogs(response.items);
        } catch (err) {
            console.error('Error loading recent activity:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadRecentActivity();
        const interval = setInterval(loadRecentActivity, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {isLoading ? (
                        <div className="text-center text-sm text-gray-500">Loading...</div>
                    ) : recentLogs.length === 0 ? (
                        <div className="text-center text-sm text-gray-500">No recent activity</div>
                    ) : (
                        recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{log.action}</p>
                                    <p className="text-xs text-gray-500">User #{log.user_id}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {format(new Date(log.created_at), 'HH:mm:ss')}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 6: Audit Log Detail Component (Standalone)
// ============================================================================
/**
 * Example 6: Fetch and display full details of a single audit log
 * Used in: Modal details, notification details, timeline view
 */
export function Example6_AuditLogDetail({ logId }: { logId: number }) {
    const [log, setLog] = useState<AuditLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const loadLog = async () => {
            try {
                setIsLoading(true);
                const detail = await getAuditLog(logId);
                setLog(detail);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load log');
            } finally {
                setIsLoading(false);
            }
        };

        loadLog();
    }, [logId]);

    if (isLoading) return <div className="text-center">Loading...</div>;
    if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
    if (!log) return <Alert><AlertDescription>Audit log not found</AlertDescription></Alert>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Log #{log.id}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-gray-600">ACTION</p>
                            <p className="text-sm font-mono">{log.action}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">SEVERITY</p>
                            <Badge variant="outline" className="text-xs">{log.severity}</Badge>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">USER ID</p>
                            <p className="text-sm font-mono">{log.user_id}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">TIMESTAMP</p>
                            <p className="text-sm">{format(new Date(log.created_at), 'PPpp')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">ENTITY TYPE</p>
                            <p className="text-sm capitalize font-mono">{log.resource_type}</p>
                        </div>
                        {log.resource_id && (
                            <div>
                                <p className="text-xs font-medium text-gray-600">ENTITY ID</p>
                                <p className="text-sm font-mono">{log.resource_id}</p>
                            </div>
                        )}
                    </div>

                    {log.details && (
                        <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">DETAILS</p>
                            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        </div>
                    )}

                    {log.ip_address && (
                        <div>
                            <p className="text-xs font-medium text-gray-600">IP ADDRESS</p>
                            <p className="text-sm font-mono">{log.ip_address}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Export all examples for demo/storybook usage
// ============================================================================
export const AUDIT_EXAMPLES = {
    Example1_AuditDashboardPage,
    Example2_StudyAuditTab,
    Example3_UserActivityMonitor,
    Example4_ComplianceReportBuilder,
    Example5_RecentActivityFeed,
    Example6_AuditLogDetail,
};

export default AUDIT_EXAMPLES;
