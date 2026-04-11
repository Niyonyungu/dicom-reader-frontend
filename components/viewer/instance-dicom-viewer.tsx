'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import {
    instancesService,
    getPresetValues,
    imageCache,
} from '@/services/instances-service';
import {
    DicomInstance,
    DicomInfo,
    RenderParams,
    RenderPreset,
    FilterType,
    RotationAngle,
} from '@/types/clinical-api';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Download,
    Loader2,
    AlertCircle,
    Info,
    RotateCw,
    ZoomIn,
    ZoomOut,
    FlipHorizontal2,
    FlipVertical2,
    RefreshCw,
} from 'lucide-react';

interface InstanceDicomViewerProps {
    instanceId: number;
    instance?: DicomInstance;
    onClose?: () => void;
}

/**
 * Backend-Integrated DICOM Instance Viewer
 * 
 * Interactive viewer for DICOM images with:
 * - Multiple rendering presets (Lung, Bone, Brain, Mediastinum)
 * - Interactive zoom, rotation, and flip controls
 * - Custom window/level adjustments
 * - DICOM tag inspection
 * - ETag-based image caching
 * - Download original file
 * 
 * @example
 * ```tsx
 * <InstanceDicomViewer instanceId={123} />
 * ```
 */
export function InstanceDicomViewer({
    instanceId,
    instance,
    onClose
}: InstanceDicomViewerProps) {
    // ========================================================================
    // STATE
    // ========================================================================

    const { user } = useAuth();

    // Instance and image data
    const [instanceData, setInstanceData] = useState<DicomInstance | null>(instance || null);
    const [instanceInfo, setInstanceInfo] = useState<DicomInfo | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageCacheKey, setImageCacheKey] = useState<string>('');

    // Render parameters
    const [renderParams, setRenderParams] = useState<RenderParams>({
        preset: 'lung',
        format: 'png',
        zoom: 1.0,
        rotate: 0,
        flip_horizontal: false,
        flip_vertical: false,
        filter: 'none',
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTags, setShowTags] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [customWindowCenter, setCustomWindowCenter] = useState<number | null>(null);
    const [customWindowWidth, setCustomWindowWidth] = useState<number | null>(null);
    const [showCustomWindow, setShowCustomWindow] = useState(false);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Load instance data on mount
    useEffect(() => {
        const loadInstance = async () => {
            if (instanceData) return; // Already have instance data

            setLoading(true);
            setError(null);

            try {
                const data = await instancesService.getInstance(instanceId);
                setInstanceData(data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load instance'
                );
            } finally {
                setLoading(false);
            }
        };

        loadInstance();
    }, [instanceId, instanceData]);

    // Update rendered image URL when parameters change
    useEffect(() => {
        const updateImage = async () => {
            setLoading(true);
            setError(null);

            try {
                // Check cache first
                const cacheParams = {
                    ...renderParams,
                    window_center: customWindowCenter,
                    window_width: customWindowWidth,
                };
                const cacheKey = JSON.stringify(cacheParams);

                if (imageCache.has(cacheKey)) {
                    const cached = imageCache.get(cacheKey);
                    if (cached) {
                        setImageUrl(cached.url);
                        setImageCacheKey(cacheKey);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch new image URL
                const params: RenderParams = {
                    ...renderParams,
                    ...(customWindowCenter !== null && { window_center: customWindowCenter }),
                    ...(customWindowWidth !== null && { window_width: customWindowWidth }),
                };

                const response = await instancesService.getInstanceImageUrl(
                    instanceId,
                    params
                );

                imageCache.set(cacheKey, response.url, response.etag);
                setImageUrl(response.url);
                setImageCacheKey(cacheKey);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load image'
                );
            } finally {
                setLoading(false);
            }
        };

        updateImage();
    }, [instanceId, renderParams, customWindowCenter, customWindowWidth]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handlePresetChange = useCallback((preset: RenderPreset) => {
        setRenderParams((prev) => ({ ...prev, preset }));
        setCustomWindowCenter(null);
        setCustomWindowWidth(null);
        setShowCustomWindow(false);
    }, []);

    const handleZoomChange = (value: number[]) => {
        setRenderParams((prev) => ({ ...prev, zoom: value[0] }));
    };

    const handleRotate = useCallback(() => {
        setRenderParams((prev) => ({
            ...prev,
            rotate: ((prev.rotate! + 90) % 360) as RotationAngle,
        }));
    }, []);

    const handleFlipHorizontal = useCallback(() => {
        setRenderParams((prev) => ({
            ...prev,
            flip_horizontal: !prev.flip_horizontal,
        }));
    }, []);

    const handleFlipVertical = useCallback(() => {
        setRenderParams((prev) => ({
            ...prev,
            flip_vertical: !prev.flip_vertical,
        }));
    }, []);

    const handleFilterChange = (filter: FilterType) => {
        setRenderParams((prev) => ({ ...prev, filter }));
    };

    const handleLoadTags = async () => {
        if (instanceInfo) return; // Already loaded
        setShowTags(true);

        try {
            const info = await instancesService.getInstanceInfo(instanceId);
            setInstanceInfo(info);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load DICOM tags'
            );
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const filename = `${instanceData?.sop_class_uid || instanceId}.dcm`;
            await instancesService.downloadInstance(instanceId, filename);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to download instance'
            );
        } finally {
            setDownloading(false);
        }
    };

    const handleResetView = useCallback(() => {
        setRenderParams({
            preset: 'lung',
            format: 'png',
            zoom: 1.0,
            rotate: 0,
            flip_horizontal: false,
            flip_vertical: false,
            filter: 'none',
        });
        setCustomWindowCenter(null);
        setCustomWindowWidth(null);
        setShowCustomWindow(false);
    }, []);

    const handleApplyCustomWindow = useCallback(() => {
        if (customWindowCenter !== null && customWindowWidth !== null) {
            setRenderParams((prev) => ({
                ...prev,
                window_center: customWindowCenter,
                window_width: customWindowWidth,
                preset: undefined,
            }));
        }
    }, [customWindowCenter, customWindowWidth]);

    // ========================================================================
    // PRESETS
    // ========================================================================

    const presets: Array<{ id: RenderPreset; label: string; description: string }> = [
        { id: 'lung', label: 'Lung', description: 'Chest imaging' },
        { id: 'bone', label: 'Bone', description: 'Skeletal imaging' },
        { id: 'brain', label: 'Brain', description: 'Neuroimaging' },
        { id: 'mediastinum', label: 'Mediastinum', description: 'Thoracic imaging' },
    ];

    const filters: Array<{ id: FilterType; label: string }> = [
        { id: 'none', label: 'No Filter' },
        { id: 'sharpen', label: 'Sharpen' },
        { id: 'smooth', label: 'Smooth' },
        { id: 'edge_detect', label: 'Edge Detect' },
    ];

    const formatLabel = useMemo(() => {
        if (renderParams.preset) {
            return presets.find((p) => p.id === renderParams.preset)?.label || 'Custom';
        }
        return 'Custom';
    }, [renderParams.preset, presets]);

    // ========================================================================
    // RENDER
    // ========================================================================

    if (loading && !instanceData) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading DICOM instance...</p>
                </div>
            </div>
        );
    }

    if (error && !imageUrl) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">DICOM Viewer</h2>
                    {instanceData && (
                        <p className="text-sm text-muted-foreground">
                            {instanceData.modality} • Instance {instanceData.instance_number}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadTags}
                        disabled={loading}
                    >
                        <Info className="w-4 h-4 mr-2" />
                        Tags
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Download
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* IMAGE VIEWER */}
                <div className="lg:col-span-3">
                    <Card className="w-full h-full min-h-[500px] relative flex items-center justify-center bg-muted/30 overflow-hidden">
                        {loading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : imageUrl ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={imageUrl}
                                    alt="DICOM Instance"
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
                                />
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No image to display</p>
                        )}
                    </Card>
                </div>

                {/* CONTROLS PANEL */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[600px]">
                    {/* Presets */}
                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Presets</h3>
                        <div className="space-y-2">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.id}
                                    variant={renderParams.preset === preset.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePresetChange(preset.id)}
                                    className="w-full justify-start text-xs"
                                >
                                    <span className="flex-1 text-left">{preset.label}</span>
                                    <span className="text-muted-foreground text-xs">{preset.description}</span>
                                </Button>
                            ))}
                        </div>
                    </Card>

                    {/* Zoom */}
                    <Card className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Zoom</h3>
                            <Badge variant="secondary">{renderParams.zoom?.toFixed(1)}x</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <ZoomOut className="w-4 h-4 text-muted-foreground" />
                            <Slider
                                value={[renderParams.zoom || 1.0]}
                                onValueChange={handleZoomChange}
                                min={1.0}
                                max={4.0}
                                step={0.1}
                                className="flex-1"
                            />
                            <ZoomIn className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </Card>

                    {/* Rotation & Flip */}
                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Transform</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRotate}
                                disabled={loading}
                                title="Rotate 90°"
                            >
                                <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={renderParams.flip_horizontal ? 'default' : 'outline'}
                                size="sm"
                                onClick={handleFlipHorizontal}
                                disabled={loading}
                                title="Flip horizontal"
                            >
                                <FlipHorizontal2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={renderParams.flip_vertical ? 'default' : 'outline'}
                                size="sm"
                                onClick={handleFlipVertical}
                                disabled={loading}
                                title="Flip vertical"
                            >
                                <FlipVertical2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetView}
                                disabled={loading}
                                title="Reset to default"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>

                    {/* Filters */}
                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Filter</h3>
                        <div className="space-y-2">
                            {filters.map((filter) => (
                                <Button
                                    key={filter.id}
                                    variant={renderParams.filter === filter.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleFilterChange(filter.id)}
                                    className="w-full text-xs"
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    {/* Custom Window/Level */}
                    <Card className="p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Custom Window</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCustomWindow(!showCustomWindow)}
                            className="w-full text-xs"
                        >
                            {showCustomWindow ? 'Hide' : 'Show'} Custom Window
                        </Button>
                        {showCustomWindow && (
                            <div className="space-y-3 pt-2 border-t">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Window Center (HU)
                                    </label>
                                    <input
                                        type="number"
                                        value={customWindowCenter || ''}
                                        onChange={(e) => setCustomWindowCenter(e.target.value ? Number(e.target.value) : null)}
                                        placeholder="e.g., 40"
                                        className="w-full px-2 py-1 text-xs border rounded mt-1 bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Window Width (HU)
                                    </label>
                                    <input
                                        type="number"
                                        value={customWindowWidth || ''}
                                        onChange={(e) => setCustomWindowWidth(e.target.value ? Number(e.target.value) : null)}
                                        placeholder="e.g., 400"
                                        className="w-full px-2 py-1 text-xs border rounded mt-1 bg-background"
                                    />
                                </div>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleApplyCustomWindow}
                                    disabled={loading || customWindowCenter === null || customWindowWidth === null}
                                    className="w-full text-xs"
                                >
                                    Apply Custom Window
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Current Settings Summary */}
                    <Card className="p-4 space-y-2 bg-muted/50">
                        <h3 className="font-semibold text-sm">Settings</h3>
                        <div className="text-xs space-y-1 text-muted-foreground">
                            <div>Preset: <span className="font-medium text-foreground">{formatLabel}</span></div>
                            <div>Zoom: <span className="font-medium text-foreground">{renderParams.zoom}x</span></div>
                            <div>Rotate: <span className="font-medium text-foreground">{renderParams.rotate}°</span></div>
                            <div>Filter: <span className="font-medium text-foreground capitalize">{renderParams.filter}</span></div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* DICOM TAGS MODAL */}
            <Dialog open={showTags} onOpenChange={setShowTags}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>DICOM Tags</DialogTitle>
                        <DialogDescription>
                            Clinical information and DICOM metadata
                        </DialogDescription>
                    </DialogHeader>

                    {!instanceInfo ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                                <p className="text-muted-foreground">Loading tags...</p>
                            </div>
                        </div>
                    ) : (
                        <Tabs defaultValue="clinical" className="w-full">
                            <TabsList>
                                <TabsTrigger value="clinical">Clinical Info</TabsTrigger>
                                <TabsTrigger value="all">All Tags ({instanceInfo.tags.length})</TabsTrigger>
                            </TabsList>

                            {/* CLINICAL INFO TAB */}
                            <TabsContent value="clinical" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {instanceInfo.patient_name && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Patient Name</p>
                                            <p className="text-sm">{instanceInfo.patient_name}</p>
                                        </div>
                                    )}
                                    {instanceInfo.patient_id && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Patient ID</p>
                                            <p className="text-sm">{instanceInfo.patient_id}</p>
                                        </div>
                                    )}
                                    {instanceInfo.patient_birth_date && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Birth Date</p>
                                            <p className="text-sm">{instanceInfo.patient_birth_date}</p>
                                        </div>
                                    )}
                                    {instanceInfo.patient_age && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Age</p>
                                            <p className="text-sm">{instanceInfo.patient_age}</p>
                                        </div>
                                    )}
                                    {instanceInfo.patient_sex && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Sex</p>
                                            <p className="text-sm">{instanceInfo.patient_sex}</p>
                                        </div>
                                    )}
                                    {instanceInfo.modality && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Modality</p>
                                            <p className="text-sm">{instanceInfo.modality}</p>
                                        </div>
                                    )}
                                    {instanceInfo.study_date && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Study Date</p>
                                            <p className="text-sm">{instanceInfo.study_date}</p>
                                        </div>
                                    )}
                                    {instanceInfo.series_description && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Series Description</p>
                                            <p className="text-sm">{instanceInfo.series_description}</p>
                                        </div>
                                    )}
                                    {instanceInfo.body_part_examined && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Body Part</p>
                                            <p className="text-sm">{instanceInfo.body_part_examined}</p>
                                        </div>
                                    )}
                                    {instanceInfo.anatomical_orientation_type && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Orientation</p>
                                            <p className="text-sm">{instanceInfo.anatomical_orientation_type}</p>
                                        </div>
                                    )}
                                    {instanceInfo.manufacturer && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Manufacturer</p>
                                            <p className="text-sm">{instanceInfo.manufacturer}</p>
                                        </div>
                                    )}
                                    {instanceInfo.manufacturer_model_name && (
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Model</p>
                                            <p className="text-sm">{instanceInfo.manufacturer_model_name}</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ALL TAGS TAB */}
                            <TabsContent value="all" className="space-y-2 mt-4">
                                <div className="max-h-[500px] overflow-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2 font-semibold text-muted-foreground">Tag</th>
                                                <th className="text-left p-2 font-semibold text-muted-foreground">Keyword</th>
                                                <th className="text-left p-2 font-semibold text-muted-foreground">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {instanceInfo.tags.map((tag, idx) => (
                                                <tr key={idx} className="border-b hover:bg-muted/50">
                                                    <td className="p-2 font-mono text-muted-foreground">{tag.tag}</td>
                                                    <td className="p-2 text-muted-foreground">{tag.keyword || '—'}</td>
                                                    <td className="p-2 break-words max-w-md">
                                                        {typeof tag.value === 'object'
                                                            ? JSON.stringify(tag.value).substring(0, 100)
                                                            : String(tag.value).substring(0, 100)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default InstanceDicomViewer;
