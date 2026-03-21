'use client';

import React, { useState, useCallback } from 'react';
import {
    calculateDistance,
    calculateAngle,
    calculatePolygonArea,
    calculateROIStatistics,
    calculateHU,
    categorizeHU,
    generateMeasurementId,
    Measurement,
    ROIStatistics,
    AngleMeasurement,
    Point,
} from '@/lib/measurement-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Trash2,
    Copy,
    Download,
    BarChart3,
    Ruler,
    Maximize2,
    Zap,
} from 'lucide-react';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';

interface MeasurementToolsProps {
    measurements: Measurement[];
    onMeasurementDelete: (id: string) => void;
    onMeasurementAdd: (measurement: Measurement) => void;
    imageId: string;
    studyId?: string;
}

export function MeasurementTools({
    measurements,
    onMeasurementDelete,
    onMeasurementAdd,
    imageId,
    studyId,
}: MeasurementToolsProps) {
    const [showStats, setShowStats] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

    const handleDeleteMeasurement = (id: string) => {
        onMeasurementDelete(id);
        auditLogger.log(
            AuditEventType.MEASUREMENT_DELETED,
            `Measurement deleted: ${id}`,
            {
                studyId,
                imageId,
                metadata: { measurementId: id },
            }
        );
    };

    const handleCopyMeasurement = (measurement: Measurement) => {
        const text = `${measurement.label}: ${measurement.value.toFixed(2)} ${measurement.unit}`;
        navigator.clipboard.writeText(text);
    };

    const handleExportMeasurements = () => {
        const csv = measurements
            .map(m => `"${m.label}","${m.type}","${m.value.toFixed(2)}","${m.unit}","${new Date(m.timestamp).toISOString()}"`)
            .join('\n');

        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent('Label,Type,Value,Unit,Timestamp\n' + csv)}`;
        link.download = `measurements-${Date.now()}.csv`;
        link.click();

        auditLogger.log(
            AuditEventType.DATA_EXPORTED,
            `Measurements exported (${measurements.length} items)`,
            {
                studyId,
                imageId,
                metadata: { count: measurements.length },
            }
        );
    };

    return (
        <div className="w-full space-y-4">
            <Tabs defaultValue="distance" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="distance" className="text-xs">
                        <Ruler className="h-3 w-3 mr-1" />
                        Distance
                    </TabsTrigger>
                    <TabsTrigger value="angle" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Angle
                    </TabsTrigger>
                    <TabsTrigger value="area" className="text-xs">
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Area
                    </TabsTrigger>
                    <TabsTrigger value="roi" className="text-xs">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        ROI
                    </TabsTrigger>
                </TabsList>

                {/* Distance Tab */}
                <TabsContent value="distance">
                    <MeasurementTypePanel
                        title="Distance Measurements"
                        description="Click two points on the image to measure distance"
                        type="distance"
                        measurements={measurements.filter(m => m.type === 'distance')}
                        onDelete={handleDeleteMeasurement}
                        onCopy={handleCopyMeasurement}
                    />
                </TabsContent>

                {/* Angle Tab */}
                <TabsContent value="angle">
                    <MeasurementTypePanel
                        title="Angle Measurements"
                        description="Select three points to measure angle (orthopedic/cardiac assessment)"
                        type="angle"
                        measurements={measurements.filter(m => m.type === 'angle')}
                        onDelete={handleDeleteMeasurement}
                        onCopy={handleCopyMeasurement}
                    />
                </TabsContent>

                {/* Area Tab */}
                <TabsContent value="area">
                    <MeasurementTypePanel
                        title="Area Measurements"
                        description="Define region to calculate area for tumors, organs, etc."
                        type="area"
                        measurements={measurements.filter(m => m.type === 'area')}
                        onDelete={handleDeleteMeasurement}
                        onCopy={handleCopyMeasurement}
                    />
                </TabsContent>

                {/* ROI Tab */}
                <TabsContent value="roi">
                    <MeasurementTypePanel
                        title="ROI Analysis"
                        description="Select region for statistical analysis (mean, std dev, min/max)"
                        type="roi"
                        measurements={measurements.filter(m => m.type === 'roi')}
                        onDelete={handleDeleteMeasurement}
                        onCopy={handleCopyMeasurement}
                    />
                </TabsContent>
            </Tabs>

            {/* Stats Summary */}
            {measurements.length > 0 && (
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(!showStats)}
                        className="w-full border-border"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Show Summary ({measurements.length})
                    </Button>

                    {showStats && (
                        <Card className="border-border p-4">
                            <div className="space-y-2">
                                <div className="text-sm font-semibold">Measurements Summary</div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>Distance Measurements: {measurements.filter(m => m.type === 'distance').length}</div>
                                    <div>Angle Measurements: {measurements.filter(m => m.type === 'angle').length}</div>
                                    <div>Area Measurements: {measurements.filter(m => m.type === 'area').length}</div>
                                    <div>ROI Analysis: {measurements.filter(m => m.type === 'roi').length}</div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Actions */}
            {measurements.length > 0 && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMeasurements}
                        className="flex-1 border-border"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            )}

            {/* Empty State */}
            {measurements.length === 0 && (
                <Card className="border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No measurements yet</p>
                    <p className="text-xs text-muted-foreground">
                        Select a measurement type above to begin
                    </p>
                </Card>
            )}
        </div>
    );
}

interface MeasurementTypePanelProps {
    title: string;
    description: string;
    type: string;
    measurements: Measurement[];
    onDelete: (id: string) => void;
    onCopy: (measurement: Measurement) => void;
}

function MeasurementTypePanel({
    title,
    description,
    type,
    measurements,
    onDelete,
    onCopy,
}: MeasurementTypePanelProps) {
    return (
        <Card className="border-border p-4 space-y-3">
            <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>

            {measurements.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {measurements.map(measurement => (
                        <div
                            key={measurement.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border/50"
                        >
                            <div className="flex-1">
                                <p className="text-sm font-medium">{measurement.label}</p>
                                <p className="text-xs text-muted-foreground">
                                    {measurement.value.toFixed(2)} {measurement.unit}
                                </p>
                                {measurement.type === 'roi' && measurement.metadata?.statistics && (
                                    <ROIStatsDisplay stats={measurement.metadata.statistics} />
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCopy(measurement)}
                                    className="h-6 w-6 p-0"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(measurement.id)}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">No {title.toLowerCase()} yet</p>
                </div>
            )}
        </Card>
    );
}

interface ROIStatsDisplayProps {
    stats: ROIStatistics;
}

function ROIStatsDisplay({ stats }: ROIStatsDisplayProps) {
    return (
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground border-t border-border/50 pt-1">
            <div>μ: {stats.mean.toFixed(1)} σ: {stats.stdDev.toFixed(1)}</div>
            <div>Min: {stats.min} Max: {stats.max}</div>
            <div>Pixels: {stats.pixelCount}</div>
        </div>
    );
}

/**
 * Component for HU (Hounsfield Unit) display for CT scans
 */
export function HUDisplay({
    pixelValue,
    rescaleSlope = 1,
    rescaleIntercept = 0,
    isCtScan = true,
}: {
    pixelValue: number;
    rescaleSlope?: number;
    rescaleIntercept?: number;
    isCtScan?: boolean;
}) {
    if (!isCtScan) {
        return null;
    }

    const hu = calculateHU(pixelValue, rescaleSlope, rescaleIntercept);
    const tissue = categorizeHU(hu);
    const huClass = getHUColorClass(hu);

    return (
        <div className={`px-2 py-1 rounded text-xs font-semibold ${huClass}`}>
            HU: {hu.toFixed(0)} ({tissue})
        </div>
    );
}

function getHUColorClass(hu: number): string {
    if (hu < -1024) return 'bg-blue-100 text-blue-900';
    if (hu < -500) return 'bg-cyan-100 text-cyan-900';
    if (hu < -100) return 'bg-yellow-100 text-yellow-900';
    if (hu < 0) return 'bg-green-100 text-green-900';
    if (hu < 50) return 'bg-orange-100 text-orange-900';
    if (hu < 300) return 'bg-red-100 text-red-900';
    if (hu < 1024) return 'bg-purple-100 text-purple-900';
    return 'bg-gray-100 text-gray-900';
}
