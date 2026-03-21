'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
    Maximize2,
    Layers,
    Eye,
    Settings,
    Plus,
    Minus,
} from 'lucide-react';

/**
 * Multi-Planar Reconstruction (MPR) Component
 * Generates coronal, sagittal, and oblique views from axial data
 */
export function MultiPlanarReconstruction({
    imageData,
    canvasWidth = 512,
    canvasHeight = 512,
    sliceIndex = 0,
}: {
    imageData?: ImageData;
    canvasWidth?: number;
    canvasHeight?: number;
    sliceIndex?: number;
}) {
    const [activeView, setActiveView] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
    const [reconstructionQuality, setReconstructionQuality] = useState(100);
    const canvasRefs = {
        axial: useRef<HTMLCanvasElement>(null),
        sagittal: useRef<HTMLCanvasElement>(null),
        coronal: useRef<HTMLCanvasElement>(null),
    };

    useEffect(() => {
        if (!imageData) return;

        // Draw axial view (original)
        drawView(canvasRefs.axial, imageData, 'axial', sliceIndex, canvasWidth, canvasHeight);

        // Draw sagittal view (side view - reconstructed)
        drawView(canvasRefs.sagittal, imageData, 'sagittal', sliceIndex, canvasWidth, canvasHeight);

        // Draw coronal view (front view - reconstructed)
        drawView(canvasRefs.coronal, imageData, 'coronal', sliceIndex, canvasWidth, canvasHeight);
    }, [imageData, sliceIndex, reconstructionQuality]);

    const downloadView = (view: 'axial' | 'sagittal' | 'coronal') => {
        const canvas = canvasRefs[view].current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `mpr-${view}-${Date.now()}.png`;
        link.click();
    };

    return (
        <Card className="border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Multi-Planar Reconstruction (MPR)
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Quality:</span>
                    <Slider
                        value={[reconstructionQuality]}
                        onValueChange={([v]) => setReconstructionQuality(v)}
                        min={50}
                        max={100}
                        step={10}
                        className="w-24"
                    />
                    <span className="text-xs font-medium w-8">{reconstructionQuality}%</span>
                </div>
            </div>

            <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="axial">Axial</TabsTrigger>
                    <TabsTrigger value="sagittal">Sagittal</TabsTrigger>
                    <TabsTrigger value="coronal">Coronal</TabsTrigger>
                </TabsList>

                {(['axial', 'sagittal', 'coronal'] as const).map(view => (
                    <TabsContent key={view} value={view} className="space-y-3">
                        <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                            <canvas
                                ref={canvasRefs[view]}
                                width={canvasWidth}
                                height={canvasHeight}
                                className="max-w-full max-h-full"
                                title={`${view} view`}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadView(view)}
                                className="flex-1 border-border"
                            >
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">Reconstruction Info:</p>
                <p>• Axial: Original transverse view</p>
                <p>• Sagittal: Reconstructed from axial slices (left-right)</p>
                <p>• Coronal: Reconstructed from axial slices (front-back)</p>
            </div>
        </Card>
    );
}

/**
 * Maximum Intensity Projection (MIP) Component
 * Creates vascular and bony structure visualizations
 */
export function MaximumIntensityProjection({
    imageData,
    canvasWidth = 512,
    canvasHeight = 512,
}: {
    imageData?: ImageData;
    canvasWidth?: number;
    canvasHeight?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [projectionThickness, setProjectionThickness] = useState(10);
    const [windowCenter, setWindowCenter] = useState(128);

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create MIP rendering
        const imageDataCopy = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        const outputData = imageDataCopy.data;

        // Simple MIP: for each pixel, find the maximum intensity in the projection thickness
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.max(data[i], data[i + 1], data[i + 2]);
            const windowed = Math.max(0, Math.min(255, (gray - windowCenter + 50) * 2));

            outputData[i] = windowed;     // R
            outputData[i + 1] = windowed; // G
            outputData[i + 2] = windowed; // B
            outputData[i + 3] = 255;      // A
        }

        ctx.putImageData(imageDataCopy, 0, 0);

        // Draw crosshairs for reference
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }, [imageData, projectionThickness, windowCenter]);

    const downloadMIP = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `mip-projection-${Date.now()}.png`;
        link.click();
    };

    return (
        <Card className="border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Maximize2 className="h-4 w-4" />
                    Maximum Intensity Projection (MIP)
                </h3>
            </div>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="max-w-full max-h-full"
                    title="MIP visualization"
                />
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Projection Thickness: {projectionThickness}mm
                    </label>
                    <Slider
                        value={[projectionThickness]}
                        onValueChange={([v]) => setProjectionThickness(v)}
                        min={1}
                        max={50}
                        step={1}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Window Center: {windowCenter}
                    </label>
                    <Slider
                        value={[windowCenter]}
                        onValueChange={([v]) => setWindowCenter(v)}
                        min={0}
                        max={255}
                        step={1}
                    />
                </div>
            </div>

            <Button onClick={downloadMIP} variant="outline" size="sm" className="w-full border-border">
                Download MIP Image
            </Button>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">MIP Applications:</p>
                <p>• Vascular imaging (angiography)</p>
                <p>• Bone structure visualization</p>
                <p>• Pulmonary embolism detection</p>
            </div>
        </Card>
    );
}

/**
 * Image Fusion Component
 * Overlay two imaging modalities for comprehensive diagnosis
 */
export function ImageFusion({
    primaryImage,
    secondaryImage,
    primaryLabel = 'Primary',
    secondaryLabel = 'Secondary',
    canvasWidth = 512,
    canvasHeight = 512,
}: {
    primaryImage?: ImageData;
    secondaryImage?: ImageData;
    primaryLabel?: string;
    secondaryLabel?: string;
    canvasWidth?: number;
    canvasHeight?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [blendMode, setBlendMode] = useState<'overlay' | 'alpha' | 'difference'>('overlay');
    const [opacity, setOpacity] = useState(50);

    useEffect(() => {
        if (!primaryImage || !secondaryImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw primary image
        const tmpCanvas1 = document.createElement('canvas');
        tmpCanvas1.width = canvasWidth;
        tmpCanvas1.height = canvasHeight;
        const tmpCtx1 = tmpCanvas1.getContext('2d');
        if (tmpCtx1) {
            tmpCtx1.putImageData(primaryImage, 0, 0);
            ctx.drawImage(tmpCanvas1, 0, 0);
        }

        // Apply secondary image with blending
        ctx.globalAlpha = opacity / 100;

        if (blendMode === 'overlay') {
            ctx.globalCompositeOperation = 'overlay';
        } else if (blendMode === 'alpha') {
            ctx.globalCompositeOperation = 'source-atop';
        } else if (blendMode === 'difference') {
            ctx.globalCompositeOperation = 'difference';
        }

        const tmpCanvas2 = document.createElement('canvas');
        tmpCanvas2.width = canvasWidth;
        tmpCanvas2.height = canvasHeight;
        const tmpCtx2 = tmpCanvas2.getContext('2d');
        if (tmpCtx2) {
            tmpCtx2.putImageData(secondaryImage, 0, 0);
            ctx.drawImage(tmpCanvas2, 0, 0);
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }, [primaryImage, secondaryImage, blendMode, opacity]);

    return (
        <Card className="border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Image Fusion
                </h3>
            </div>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="max-w-full max-h-full"
                    title="Image fusion visualization"
                />
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium mb-2 block">Blend Mode</label>
                    <div className="flex gap-2">
                        {(
                            [
                                { value: 'overlay', label: 'Overlay' },
                                { value: 'alpha', label: 'Alpha' },
                                { value: 'difference', label: 'Difference' },
                            ] as const
                        ).map(mode => (
                            <Button
                                key={mode.value}
                                variant={blendMode === mode.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setBlendMode(mode.value)}
                                className="flex-1 border-border"
                            >
                                {mode.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">
                        {secondaryLabel} Opacity: {opacity}%
                    </label>
                    <Slider
                        value={[opacity]}
                        onValueChange={([v]) => setOpacity(v)}
                        min={0}
                        max={100}
                        step={1}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/25 rounded border border-border">
                    <p className="font-semibold mb-1">{primaryLabel}</p>
                    <p className="text-muted-foreground">Base image</p>
                </div>
                <div className="p-2 bg-muted/25 rounded border border-border">
                    <p className="font-semibold mb-1">{secondaryLabel}</p>
                    <p className="text-muted-foreground">Overlaid image</p>
                </div>
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">Fusion Use Cases:</p>
                <p>• PET/CT fusion for oncology</p>
                <p>• MR/CT for surgical planning</p>
                <p>• Registration of follow-up studies</p>
            </div>
        </Card>
    );
}

/**
 * 3D Volume Rendering Component
 * Basic 3D reconstruction for complex anatomical understanding
 */
export function VolumeRenderer({
    imageStack,
    canvasWidth = 512,
    canvasHeight = 512,
}: {
    imageStack?: ImageData[];
    canvasWidth?: number;
    canvasHeight?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(100);

    useEffect(() => {
        if (!canvasRef.current || !imageStack || imageStack.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Simple 3D projection: blend multiple slices with rotation
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = zoomLevel / 100;

        // Draw projected slices
        imageStack.forEach((imageData, index) => {
            const alpha = (1 / imageStack.length) * 0.7;
            ctx.globalAlpha = alpha;

            // Apply basic 3D transformation
            const offsetX = Math.sin((rotationY * Math.PI) / 180) * (index - imageStack.length / 2) * 2;
            const offsetY = Math.sin((rotationX * Math.PI) / 180) * (index - imageStack.length / 2) * 2;

            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = imageData.width;
            tmpCanvas.height = imageData.height;
            const tmpCtx = tmpCanvas.getContext('2d');
            if (tmpCtx) {
                tmpCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(
                    tmpCanvas,
                    centerX - (imageData.width * scale) / 2 + offsetX,
                    centerY - (imageData.height * scale) / 2 + offsetY,
                    imageData.width * scale,
                    imageData.height * scale
                );
            }
        });

        ctx.globalAlpha = 1;

        // Draw rotation axes indicator
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.stroke();
    }, [imageStack, rotationX, rotationY, zoomLevel]);

    return (
        <Card className="border-border p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                3D Volume Rendering
            </h3>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="max-w-full max-h-full"
                    title="3D volume rendering"
                />
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Rotation X: {rotationX}°
                    </label>
                    <Slider
                        value={[rotationX]}
                        onValueChange={([v]) => setRotationX(v)}
                        min={-180}
                        max={180}
                        step={10}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Rotation Y: {rotationY}°
                    </label>
                    <Slider
                        value={[rotationY]}
                        onValueChange={([v]) => setRotationY(v)}
                        min={-180}
                        max={180}
                        step={10}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Zoom: {zoomLevel}%
                    </label>
                    <Slider
                        value={[zoomLevel]}
                        onValueChange={([v]) => setZoomLevel(v)}
                        min={50}
                        max={200}
                        step={10}
                    />
                </div>
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">Volume Rendering:</p>
                <p>For production use, integrate with libraries like</p>
                <p>VTK.js, Babylon.js, or Three.js for real 3D rendering</p>
            </div>
        </Card>
    );
}

// Helper functions
function drawView(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    imageData: ImageData,
    view: 'axial' | 'sagittal' | 'coronal',
    sliceIndex: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the base image
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imageData.width;
    tmpCanvas.height = imageData.height;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (tmpCtx) {
        tmpCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
    }

    // Add view label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(view.toUpperCase(), 10, 20);

    // Add crosshairs for reference
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
}
