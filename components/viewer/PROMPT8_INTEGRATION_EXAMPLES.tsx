/**
 * Prompt 8: DICOM Viewer - Integration Example
 * 
 * This file demonstrates how to integrate the InstanceDicomViewer component
 * in a real application (e.g., study browser, instance detail page).
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InstanceDicomViewer } from '@/components/viewer/instance-dicom-viewer';
import { instancesService } from '@/services/instances-service';
import { DicomInstance } from '@/types/clinical-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Example 1: Simple Instance Detail Page
 * Route: /studies/[studyId]/instances/[instanceId]
 */
export function InstanceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const instanceId = Number(params?.instanceId);

    const [instance, setInstance] = useState<DicomInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInstance = async () => {
            try {
                setLoading(true);
                const data = await instancesService.getInstance(instanceId);
                setInstance(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load instance');
            } finally {
                setLoading(false);
            }
        };

        if (instanceId) loadInstance();
    }, [instanceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading instance...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-background">
                <div>
                    <h1 className="text-2xl font-bold">DICOM Instance Viewer</h1>
                    {instance && (
                        <p className="text-sm text-muted-foreground">
                            {instance.modality} • Instance {instance.instance_number}
                        </p>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-auto">
                <InstanceDicomViewer
                    instanceId={instanceId}
                    instance={instance!}
                    onClose={() => router.back()}
                />
            </div>
        </div>
    );
}

/**
 * Example 2: Series Navigator with Instance Slider
 * Shows all instances in a series with navigation
 */
export function SeriesInstanceNavigator({ studyId }: { studyId: number }) {
    const [instances, setInstances] = useState<DicomInstance[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInstances = async () => {
            try {
                setLoading(true);
                // Get all instances from study
                // In a real app, you'd have a studiesService.getStudyInstances()
                // For now, fetch them via individual api calls
                const response = await fetch(
                    `/api/v1/studies/${studyId}/instances`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setInstances(data.items || []);
                }
                setError(null);
            } catch (err) {
                setError('Failed to load instances');
            } finally {
                setLoading(false);
            }
        };

        loadInstances();
    }, [studyId]);

    const currentInstance = instances[currentIndex];
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < instances.length - 1;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || instances.length === 0) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || 'No instances found'}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Viewer */}
            <div className="border rounded">
                <InstanceDicomViewer instanceId={currentInstance.id} />
            </div>

            {/* Navigator Controls */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    disabled={!canGoPrev}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                    Instance {currentIndex + 1} of {instances.length}
                    {currentInstance && (
                        <span> • Image {currentInstance.instance_number}</span>
                    )}
                </div>

                <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    disabled={!canGoNext}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Instance Info Panel */}
            <Card className="p-4">
                <h3 className="font-semibold mb-2">Instance Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Instance UID</p>
                        <p className="font-mono text-xs">{currentInstance.instance_uid}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">SOP Class</p>
                        <p className="font-mono text-xs">{currentInstance.sop_class_uid}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">File Size</p>
                        <p>{(currentInstance.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{new Date(currentInstance.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

/**
 * Example 3: Multi-Instance Comparison
 * Side-by-side or stacked comparison of instances
 */
export function InstanceComparison({
    instance1Id,
    instance2Id,
}: {
    instance1Id: number;
    instance2Id: number;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Instance 1 */}
            <div>
                <h3 className="font-semibold mb-2">Current Study</h3>
                <div className="border rounded overflow-hidden" style={{ height: '500px' }}>
                    <InstanceDicomViewer instanceId={instance1Id} />
                </div>
            </div>

            {/* Instance 2 */}
            <div>
                <h3 className="font-semibold mb-2">Prior Study</h3>
                <div className="border rounded overflow-hidden" style={{ height: '500px' }}>
                    <InstanceDicomViewer instanceId={instance2Id} />
                </div>
            </div>
        </div>
    );
}

/**
 * Example 4: Using instancesService directly for custom workflows
 * Useful when you need to build custom rendering logic
 */
export async function CustomRenderingExample(instanceId: number) {
    try {
        // 1. Get instance metadata
        const instance = await instancesService.getInstance(instanceId);
        console.log(`Instance: ${instance.instance_uid}`);
        console.log(`Modality: ${instance.modality}`);

        // 2. Get custom render with specific parameters
        const renderResponse = await instancesService.getInstanceImageUrl(instanceId, {
            preset: 'lung',  // Use lung preset for CT chest
            zoom: 1.5,
            format: 'png',
            rotate: 0,
        });
        console.log(`Rendered image URL: ${renderResponse.url}`);
        console.log(`Cache key: ${renderResponse.cache_key}`);
        console.log(`ETag: ${renderResponse.etag}`);

        // 3. Get DICOM tags for display
        const info = await instancesService.getInstanceInfo(instanceId);
        console.log(`Patient: ${info.patient_name}`);
        console.log(`Study Date: ${info.study_date}`);
        console.log(`Total DICOM tags: ${info.tags.length}`);

        // 4. Download original file if needed
        await instancesService.downloadInstance(
            instanceId,
            `patient_${info.patient_id}_${instance.instance_number}.dcm`
        );

        return {
            instance,
            renderResponse,
            info,
        };
    } catch (error) {
        console.error('Custom rendering failed:', error);
        throw error;
    }
}

/**
 * Example 5: Integrated page with real backend data
 * Combines viewer + studies + patient info
 */
export function IntegratedDicomViewerPage({ studyId }: { studyId: number }) {
    const [studyData, setStudyData] = useState<any>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStudy = async () => {
            try {
                setLoading(true);

                // Get study details
                const studyResponse = await fetch(
                    `/api/v1/studies/${studyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                        },
                    }
                );
                const study = await studyResponse.json();

                // Get all instances in study
                const instancesResponse = await fetch(
                    `/api/v1/studies/${studyId}/instances`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                        },
                    }
                );
                const instances = await instancesResponse.json();

                setStudyData({
                    study,
                    instances: instances.items || [],
                });

                // Select first instance by default
                if (instances.items?.length > 0) {
                    setSelectedInstanceId(instances.items[0].id);
                }
            } catch (error) {
                console.error('Failed to load study:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStudy();
    }, [studyId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!studyData) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load study</AlertDescription>
            </Alert>
        );
    }

    const { study, instances } = studyData;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen-minus-navbar">
            {/* Sidebar: Study Info + Instance List */}
            <div className="lg:col-span-1 border-r overflow-y-auto p-4 space-y-4">
                {/* Study Info */}
                <div>
                    <h2 className="font-semibold mb-2">{study.modality} Study</h2>
                    <dl className="text-sm space-y-1">
                        <div>
                            <dt className="text-muted-foreground">Date</dt>
                            <dd>{new Date(study.study_date).toLocaleDateString()}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Description</dt>
                            <dd>{study.description || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Instances</dt>
                            <dd>{instances.length}</dd>
                        </div>
                    </dl>
                </div>

                {/* Instance List */}
                <div>
                    <h3 className="font-semibold mb-2 text-sm">Instances</h3>
                    <div className="space-y-2">
                        {instances.map((inst: DicomInstance) => (
                            <button
                                key={inst.id}
                                onClick={() => setSelectedInstanceId(inst.id)}
                                className={`w-full text-left px-3 py-2 rounded border text-xs ${selectedInstanceId === inst.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-muted hover:bg-muted'
                                    }`}
                            >
                                <div className="font-mono"># {inst.instance_number}</div>
                                <div className="text-muted-foreground">
                                    {inst.file_size > 1024 * 1024
                                        ? `${(inst.file_size / 1024 / 1024).toFixed(1)} MB`
                                        : `${(inst.file_size / 1024).toFixed(0)} KB`}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main: DICOM Viewer */}
            <div className="lg:col-span-3 overflow-auto">
                {selectedInstanceId && (
                    <InstanceDicomViewer instanceId={selectedInstanceId} />
                )}
            </div>
        </div>
    );
}

/**
 * Export all examples
 */
export const examples = {
    InstanceDetailPage,
    SeriesInstanceNavigator,
    InstanceComparison,
    CustomRenderingExample,
    IntegratedDicomViewerPage,
};
