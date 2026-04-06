'use client';

/**
 * Complete DICOM Viewer Integration Example
 * Demonstrates how to use all advanced features together
 * 
 * This example shows:
 * - Measurement tools with distance, angle, area, ROI
 * - Audit logging of all actions
 * - Offline capability
 * - Mobile optimization
 * - Advanced visualizations (MPR, MIP, Fusion)
 * - Clinical workflow tools
 */

import React, { useState, useEffect } from 'react';
import { MultiViewportDicomViewer } from './multi-viewport-dicom-viewer';
import { MeasurementTools, HUDisplay } from '@/components/viewer/measurement-tools';
import { MobileViewerWrapper, MobileControlsPanel, ResponsiveStatsGrid, StatCard } from '@/components/viewer/mobile-viewer-wrapper';
import { MultiPlanarReconstruction, MaximumIntensityProjection, ImageFusion, VolumeRenderer } from '@/components/viewer/advanced-visualization';
import { HangingProtocolManager, ImageComparisonTool, AdvancedAnnotations, ReferenceLines } from '@/components/viewer/clinical-workflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { useMobileContext, useDeviceOrientation } from '@/hooks/use-mobile';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';
import { Measurement } from '@/lib/measurement-utils';
import {
    Save,
    Share2,
    Download,
    Settings,
    HelpCircle,
    WifiOff,
    Clock,
} from 'lucide-react';

interface IntegratedDicomViewerProps {
    images: any[];
    modality: string;
    studyId: string;
    patientId: string;
    description: string;
}

/**
 * Complete integrated DICOM viewer with all advanced features
 */
export function IntegratedDicomViewer({
    images,
    modality,
    studyId,
    patientId,
    description,
}: IntegratedDicomViewerProps) {
    // State Management
    const isMobile = useMobileContext();
    const orientation = useDeviceOrientation();
    const { isOnline, cacheSize, syncNow, clearCache } = useServiceWorker();

    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [activeTab, setActiveTab] = useState('viewer');
    const [showAdvancedTools, setShowAdvancedTools] = useState(!isMobile);
    const [priorImageData, setPriorImageData] = useState<ImageData | undefined>();
    const [selectedStudyType, setSelectedStudyType] = useState(modality);

    // Track study access in audit log
    useEffect(() => {
        auditLogger.logStudyAccess(studyId, patientId, modality);
    }, [studyId, patientId, modality]);

    // Handle measurement addition
    const handleMeasurementAdd = (measurement: Measurement) => {
        setMeasurements(prev => [...prev, measurement]);

        // Log to audit system
        auditLogger.logMeasurement(
            measurement.id,
            measurement.type,
            measurement.value,
            measurement.imageId,
            studyId
        );
    };

    // Handle measurement deletion
    const handleMeasurementDelete = (id: string) => {
        setMeasurements(prev => prev.filter(m => m.id !== id));
    };

    // Export all study data (measurements, annotations, audit logs)
    const handleExportStudy = async () => {
        const exportData = {
            studyId,
            patientId,
            modality,
            timestamp: new Date().toISOString(),
            measurements: measurements.map(m => ({
                type: m.type,
                value: m.value,
                unit: m.unit,
                timestamp: new Date(m.timestamp).toISOString(),
            })),
            auditLogs: auditLogger.getStudyLogs(studyId),
        };

        const link = document.createElement('a');
        link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
        link.download = `study-${studyId}-${Date.now()}.json`;
        link.click();

        auditLogger.log(
            AuditEventType.DATA_EXPORTED,
            `Study exported: ${studyId}`,
            {
                studyId,
                metadata: {
                    measurementCount: measurements.length,
                    logCount: auditLogger.getStudyLogs(studyId).length,
                },
            }
        );
    };

    // Main viewer content
    const viewerContent = (
        <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
            {/* Header with offline indicator */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{modality} Study</h2>
                    <p className="text-sm text-muted-foreground">
                        Patient: {patientId} | Study: {studyId}
                    </p>
                </div>

                {!isOnline && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-600/20 rounded">
                        <WifiOff className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs text-yellow-600 font-medium">Offline Mode</span>
                    </div>
                )}
            </div>

            {/* Tabs for different views/tools */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={isMobile ? 'grid w-full grid-cols-3' : 'grid w-full grid-cols-5'}>
                    <TabsTrigger value="viewer">Viewer</TabsTrigger>
                    <TabsTrigger value="measurements">Measurements</TabsTrigger>
                    {!isMobile && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
                    {!isMobile && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
                    <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                {/* Viewer Tab */}
                <TabsContent value="viewer" className="space-y-3">
                    <Card className="border-border overflow-hidden">
                        <MultiViewportDicomViewer
                            initialImages={images}
                            modality={modality}
                            description={description}
                            worklistItem={{ id: studyId }}
                            patientId={patientId}
                            onImageViewed={(id) => {
                                auditLogger.log(
                                    AuditEventType.IMAGE_VIEWED,
                                    `Image viewed: ${id}`,
                                    { studyId, metadata: { imageId: id } }
                                );
                            }}
                        />
                    </Card>
                </TabsContent>

                {/* Measurements Tab */}
                <TabsContent value="measurements" className="space-y-3">
                    <MobileControlsPanel title="Measurement Tools" isOpen={true}>
                        <MeasurementTools
                            measurements={measurements}
                            onMeasurementAdd={handleMeasurementAdd}
                            onMeasurementDelete={handleMeasurementDelete}
                            imageId={images[0]?.id || 'current'}
                            studyId={studyId}
                        />
                    </MobileControlsPanel>

                    {/* Quick Stats */}
                    {measurements.length > 0 && (
                        <MobileControlsPanel title="Quick Stats" isOpen={true}>
                            <ResponsiveStatsGrid>
                                <StatCard
                                    label="Measurements"
                                    value={measurements.length}
                                />
                                <StatCard
                                    label="Distance Total"
                                    value={measurements
                                        .filter(m => m.type === 'distance')
                                        .reduce((sum, m) => sum + m.value, 0)
                                        .toFixed(1)}
                                    unit="mm"
                                />
                                <StatCard
                                    label="Avg Angle"
                                    value={
                                        measurements.filter(m => m.type === 'angle').length > 0
                                            ? (measurements.filter(m => m.type === 'angle').reduce((sum, m) => sum + m.value, 0) /
                                                measurements.filter(m => m.type === 'angle').length).toFixed(1)
                                            : 'N/A'
                                    }
                                    unit="°"
                                />
                                <StatCard
                                    label="Modality"
                                    value={modality}
                                />
                            </ResponsiveStatsGrid>
                        </MobileControlsPanel>
                    )}
                </TabsContent>

                {/* Advanced Visualization Tab */}
                {!isMobile && (
                    <TabsContent value="advanced" className="space-y-3">
                        <Tabs defaultValue="mpr" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="mpr">MPR</TabsTrigger>
                                <TabsTrigger value="mip">MIP</TabsTrigger>
                                <TabsTrigger value="fusion">Fusion</TabsTrigger>
                                <TabsTrigger value="3d">3D</TabsTrigger>
                            </TabsList>

                            <TabsContent value="mpr">
                                <MultiPlanarReconstruction
                                    imageData={images[0]?.pixelData}
                                    sliceIndex={0}
                                />
                            </TabsContent>

                            <TabsContent value="mip">
                                <MaximumIntensityProjection
                                    imageData={images[0]?.pixelData}
                                />
                            </TabsContent>

                            <TabsContent value="fusion">
                                {priorImageData && (
                                    <ImageFusion
                                        primaryImage={images[0]?.pixelData}
                                        secondaryImage={priorImageData}
                                        primaryLabel="Current"
                                        secondaryLabel="Prior"
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="3d">
                                <VolumeRenderer
                                    imageStack={images.map(img => img.pixelData).filter(Boolean)}
                                />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                )}

                {/* Comparison Tab */}
                {!isMobile && (
                    <TabsContent value="comparison" className="space-y-3">
                        <MobileControlsPanel title="Hanging Protocols" isOpen={true}>
                            <HangingProtocolManager
                                studyType={selectedStudyType}
                            />
                        </MobileControlsPanel>

                        <MobileControlsPanel title="Image Comparison" isOpen={true}>
                            <ImageComparisonTool
                                currentImage={images[0]?.pixelData}
                                priorImage={priorImageData}
                                imageId={images[0]?.id}
                                studyId={studyId}
                            />
                        </MobileControlsPanel>

                        <MobileControlsPanel title="Annotations" isOpen={true}>
                            <AdvancedAnnotations
                                annotations={[]}
                            />
                        </MobileControlsPanel>

                        <MobileControlsPanel title="References" isOpen={true}>
                            <ReferenceLines />
                        </MobileControlsPanel>
                    </TabsContent>
                )}

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-3">
                    <MobileControlsPanel title="Study Information" isOpen={true}>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium">Patient ID:</span> {patientId}
                            </div>
                            <div>
                                <span className="font-medium">Study ID:</span> {studyId}
                            </div>
                            <div>
                                <span className="font-medium">Modality:</span> {modality}
                            </div>
                            <div>
                                <span className="font-medium">Images:</span> {images.length}
                            </div>
                            <div>
                                <span className="font-medium">Measurements:</span> {measurements.length}
                            </div>
                            <div>
                                <span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}
                            </div>
                        </div>
                    </MobileControlsPanel>

                    <MobileControlsPanel title="Offline Status" isOpen={true}>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Status:</span>
                                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Cache Size:</span>
                                <span className="font-medium">{formatBytes(cacheSize)}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={syncNow}
                                    className="flex-1 border-border"
                                    disabled={!isOnline}
                                >
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCache}
                                    className="flex-1 border-border"
                                >
                                    Clear Cache
                                </Button>
                            </div>
                        </div>
                    </MobileControlsPanel>

                    <MobileControlsPanel title="Audit Logs" isOpen={true}>
                        <div className="space-y-2 text-xs">
                            {auditLogger.getStudyLogs(studyId).slice(-5).map(log => (
                                <div key={log.id} className="p-2 bg-muted/50 rounded">
                                    <div className="font-medium">{log.eventType}</div>
                                    <div className="text-muted-foreground">{log.description}</div>
                                    <div className="text-muted-foreground">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MobileControlsPanel>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className={isMobile ? 'flex gap-2' : 'flex gap-2'}>
                <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'default'}
                    onClick={handleExportStudy}
                    className="flex-1 border-border"
                >
                    <Download className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                    {!isMobile && <span className="ml-2">Export</span>}
                </Button>

                <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'default'}
                    className="flex-1 border-border"
                >
                    <Share2 className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                    {!isMobile && <span className="ml-2">Share</span>}
                </Button>

                {!isMobile && (
                    <>
                        <Button
                            variant="outline"
                            size="default"
                            className="flex-1 border-border"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Report
                        </Button>

                        <Button
                            variant="outline"
                            size="default"
                            className="flex-1 border-border"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                    </>
                )}
            </div>
        </div>
    );

    // Wrap in mobile wrapper if needed
    if (isMobile) {
        return (
            <MobileViewerWrapper
                title={`${modality} Study`}
                subtitle={`Patient: ${patientId}`}
            >
                {viewerContent}
            </MobileViewerWrapper>
        );
    }

    return <div className="space-y-4">{viewerContent}</div>;
}

// Helper function
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Export example usage
export default IntegratedDicomViewer;

/**
 * Example usage:
 * 
 * import IntegratedDicomViewer from '@/components/viewer/integrated-example';
 * 
 * <IntegratedDicomViewer
 *   images={dicomImages}
 *   modality="CT"
 *   studyId="STUDY_001"
 *   patientId="PATIENT_123"
 *   description="Chest CT with contrast"
 * />
 */
