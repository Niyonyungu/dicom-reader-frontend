'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
    getStudy,
    getStudySeries,
    getStudyInstances,
    getStudyAuditLogs,
    archiveStudy,
} from '@/services/studies-service';
import { handleApiError } from '@/lib/api-error-handler';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertCircle,
    Archive,
    ArrowLeft,
    ChevronDown,
    Loader2,
    Eye,
    Download,
    LogsIcon,
} from 'lucide-react';
import Link from 'next/link';
import {
    Study,
    Series,
    DicomInstance,
    SeriesListResponse,
    DicomListResponse,
    AuditLogListResponse,
} from '@/types/clinical-api';

interface ExpandedSeries {
    [key: string]: boolean;
}

export default function StudyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { can } = useAuth();
    const studyId = parseInt(params.id as string);

    // State
    const [study, setStudy] = useState<Study | null>(null);
    const [series, setSeries] = useState<Series[]>([]);
    const [instances, setInstances] = useState<DicomInstance[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSeries, setExpandedSeries] = useState<ExpandedSeries>({});
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    // Fetch study details
    useEffect(() => {
        const fetchStudyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch study details, series, and instances in parallel
                const [studyData, seriesData, instancesData] = await Promise.all([
                    getStudy(studyId),
                    getStudySeries(studyId, 1, 100),
                    getStudyInstances(studyId, 1, 100),
                ]);

                setStudy(studyData);
                setSeries(seriesData.items);
                setInstances(instancesData.items);
            } catch (err) {
                const message = handleApiError(err).message;
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudyData();
    }, [studyId]);

    // Load audit logs when modal opens
    const loadAuditLogs = async () => {
        try {
            const logs = await getStudyAuditLogs(studyId, { page: 1, page_size: 50 });
            setAuditLogs(logs);
        } catch (err) {
            const message = handleApiError(err).message;
            toast.error(`Failed to load audit logs: ${message}`);
        }
    };

    const handleArchiveStudy = async () => {
        if (!confirm('Are you sure you want to archive this study? This action cannot be undone.')) {
            return;
        }

        setIsArchiving(true);
        try {
            await archiveStudy(studyId);
            toast.success('Study archived successfully');
            router.push('/dashboard/studies');
        } catch (err) {
            const message = handleApiError(err).message;
            toast.error(`Failed to archive study: ${message}`);
        } finally {
            setIsArchiving(false);
        }
    };

    const toggleSeriesExpanded = (seriesUid: string) => {
        setExpandedSeries((prev) => ({
            ...prev,
            [seriesUid]: !prev[seriesUid],
        }));
    };

    const getInstancesForSeries = (seriesUid: string): DicomInstance[] => {
        return instances.filter((inst) => inst.series_uid === seriesUid);
    };

    const getStudyStatistics = () => {
        const totalInstances = instances.length;
        const totalFileSize = instances.reduce((sum, inst) => sum + inst.file_size, 0);
        const seriesCount = new Set(instances.map((inst) => inst.series_uid)).size;

        return {
            totalSeries: seriesCount,
            totalInstances,
            totalFileSize,
            totalFileSizeMB: (totalFileSize / (1024 * 1024)).toFixed(2),
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !study) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || 'Study not found'}</AlertDescription>
                </Alert>
                <Link href="/dashboard/studies">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Studies
                    </Button>
                </Link>
            </div>
        );
    }

    const stats = getStudyStatistics();

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard/studies">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Study Details</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Study UID: {study.study_uid}
                    </p>
                </div>
                {can('study.delete') && study.study_status !== 'archived' && (
                    <Button
                        variant="destructive"
                        onClick={handleArchiveStudy}
                        disabled={isArchiving}
                        className="gap-2"
                    >
                        {isArchiving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Archive className="h-4 w-4" />
                        )}
                        Archive Study
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

            {/* Study Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Study Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Study Date</p>
                            <p className="font-semibold">
                                {new Date(study.study_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Modality</p>
                            <Badge variant="outline">{study.modality}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge className={getStatusColor(study.study_status)}>
                                {study.study_status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Patient ID</p>
                            <p className="font-semibold">{study.patient_id}</p>
                        </div>
                        {study.description && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="font-semibold">{study.description}</p>
                            </div>
                        )}
                        {study.institution_name && (
                            <div>
                                <p className="text-sm text-muted-foreground">Institution</p>
                                <p className="font-semibold text-sm">{study.institution_name}</p>
                            </div>
                        )}
                        {study.referring_physician && (
                            <div>
                                <p className="text-sm text-muted-foreground">Referring Physician</p>
                                <p className="font-semibold text-sm">{study.referring_physician}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold">{stats.totalSeries}</p>
                            <p className="text-sm text-muted-foreground">Total Series</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold">{stats.totalInstances}</p>
                            <p className="text-sm text-muted-foreground">Total Images</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold">{stats.totalFileSizeMB}</p>
                            <p className="text-sm text-muted-foreground">Storage Size (MB)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-lg font-bold">
                                {new Date(study.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Created</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="series" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="series">Series ({series.length})</TabsTrigger>
                    <TabsTrigger value="instances">Instances ({instances.length})</TabsTrigger>
                    <TabsTrigger value="audit">
                        <LogsIcon className="h-4 w-4 mr-2" />
                        Audit Log
                    </TabsTrigger>
                </TabsList>

                {/* Series Tab */}
                <TabsContent value="series">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Series in Study</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {series.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No series found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {series.map((ser) => {
                                        const seriesInstances = getInstancesForSeries(ser.series_uid);
                                        return (
                                            <Collapsible key={ser.series_uid}>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between"
                                                        onClick={() => toggleSeriesExpanded(ser.series_uid)}
                                                    >
                                                        <div className="text-left">
                                                            <div className="font-semibold">
                                                                #{ser.series_number}: {ser.series_description || 'Untitled'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {seriesInstances.length} instances •{' '}
                                                                {formatFileSize(
                                                                    seriesInstances.reduce((sum, inst) => sum + inst.file_size, 0)
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronDown
                                                            className={`h-4 w-4 transition ${expandedSeries[ser.series_uid] ? 'rotate-180' : ''
                                                                }`}
                                                        />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pl-4 mt-2">
                                                    <Table>
                                                        <TableHeader className="bg-muted">
                                                            <TableRow>
                                                                <TableHead>Instance #</TableHead>
                                                                <TableHead>UID</TableHead>
                                                                <TableHead>File Size</TableHead>
                                                                <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {seriesInstances.map((inst) => (
                                                                <TableRow key={inst.id}>
                                                                    <TableCell>{inst.instance_number}</TableCell>
                                                                    <TableCell className="text-xs font-mono truncate max-w-xs">
                                                                        {inst.instance_uid}
                                                                    </TableCell>
                                                                    <TableCell>{formatFileSize(inst.file_size)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                title="View instance"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                title="Download DICOM file"
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Instances Tab */}
                <TabsContent value="instances">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">All Instances</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {instances.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No instances found</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead>Series #</TableHead>
                                                <TableHead>Instance #</TableHead>
                                                <TableHead>Series Description</TableHead>
                                                <TableHead>SOP Class</TableHead>
                                                <TableHead>File Size</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {instances.slice(0, 50).map((inst) => (
                                                <TableRow key={inst.id}>
                                                    <TableCell className="font-medium">{inst.series_number}</TableCell>
                                                    <TableCell>{inst.instance_number}</TableCell>
                                                    <TableCell className="text-sm">
                                                        {inst.series_description || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs">{inst.sop_class_uid}</TableCell>
                                                    <TableCell>{formatFileSize(inst.file_size)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" title="View">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" title="Download">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {instances.length > 50 && (
                                        <div className="p-4 bg-muted text-sm text-muted-foreground text-center">
                                            Showing 50 of {instances.length} instances. Load more or use viewer.
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Log Tab */}
                <TabsContent value="audit">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Study Audit Log</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAuditModal(true);
                                        loadAuditLogs();
                                    }}
                                >
                                    Refresh
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!auditLogs ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        Click "Refresh" to load audit history
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setShowAuditModal(true);
                                            loadAuditLogs();
                                        }}
                                    >
                                        Load Audit Logs
                                    </Button>
                                </div>
                            ) : auditLogs.items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No audit events found for this study</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Severity</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditLogs.items.slice(0, 20).map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="text-sm">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{log.user_name || 'Unknown'}</TableCell>
                                                    <TableCell className="text-sm">{log.action}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                log.severity === 'ERROR'
                                                                    ? 'destructive'
                                                                    : log.severity === 'WARNING'
                                                                        ? 'secondary'
                                                                        : 'outline'
                                                            }
                                                        >
                                                            {log.severity}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Audit Modal */}
            <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Study Audit Log - Full History</DialogTitle>
                    </DialogHeader>

                    {auditLogs && auditLogs.items.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditLogs.items.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm">{log.user_name || '—'}</TableCell>
                                            <TableCell className="text-sm">{log.action}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        log.severity === 'ERROR'
                                                            ? 'destructive'
                                                            : log.severity === 'WARNING'
                                                                ? 'secondary'
                                                                : 'outline'
                                                    }
                                                >
                                                    {log.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.ip_address || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No audit events found</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAuditModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
