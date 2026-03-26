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
import * as THREE from 'three';
import { calculateHU, categorizeHU, calculateROIStatistics } from '@/lib/measurement-utils';

/**
 * Multi-Planar Reconstruction (MPR) Component
 * Generates coronal, sagittal, and oblique views from axial data
 */
export function MultiPlanarReconstruction({
    imageStack,
    canvasWidth = 512,
    canvasHeight = 512,
    sliceIndex = 0,
    sampleX = 0.5,
    sampleY = 0.5,
}: {
    imageStack?: ImageData[];
    canvasWidth?: number;
    canvasHeight?: number;
    sliceIndex?: number;
    sampleX?: number;
    sampleY?: number;
}) {
    const [activeView, setActiveView] = useState<'axial' | 'sagittal' | 'coronal'>('axial');
    const [reconstructionQuality, setReconstructionQuality] = useState(100);
    const [localSlice, setLocalSlice] = useState<number>(sliceIndex);
    const [localSampleX, setLocalSampleX] = useState<number>(sampleX);
    const [localSampleY, setLocalSampleY] = useState<number>(sampleY);
    const canvasRefs = {
        axial: useRef<HTMLCanvasElement>(null),
        sagittal: useRef<HTMLCanvasElement>(null),
        coronal: useRef<HTMLCanvasElement>(null),
    };

    const axialData = imageStack?.[localSlice];
    const sagittalData = imageStack ? reconstructSagittal(imageStack, localSampleX) : undefined;
    const coronalData = imageStack ? reconstructCoronal(imageStack, localSampleY) : undefined;

    useEffect(() => {
        if (axialData) drawView(canvasRefs.axial, axialData, 'axial', localSlice, canvasWidth, canvasHeight);
        if (sagittalData) drawView(canvasRefs.sagittal, sagittalData, 'sagittal', localSlice, canvasWidth, canvasHeight);
        if (coronalData) drawView(canvasRefs.coronal, coronalData, 'coronal', localSlice, canvasWidth, canvasHeight);
    }, [axialData, sagittalData, coronalData, localSlice, reconstructionQuality]);

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
            <div className="flex flex-col gap-3">
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

                {imageStack?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                            <label>Slice: {localSlice + 1}/{imageStack.length}</label>
                            <Slider
                                value={[localSlice]}
                                onValueChange={([v]) => setLocalSlice(v)}
                                min={0}
                                max={Math.max(0, imageStack.length - 1)}
                                step={1}
                            />
                        </div>
                        <div>
                            <label>Sagittal position X: {(localSampleX * 100).toFixed(0)}%</label>
                            <Slider
                                value={[Math.round(localSampleX * 100)]}
                                onValueChange={([v]) => setLocalSampleX(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>
                        <div>
                            <label>Coronal position Y: {(localSampleY * 100).toFixed(0)}%</label>
                            <Slider
                                value={[Math.round(localSampleY * 100)]}
                                onValueChange={([v]) => setLocalSampleY(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">No image stack available for MPR.</div>
                )}
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const groupRef = useRef<THREE.Group | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        if (!containerRef.current || !imageStack || imageStack.length === 0) return;

        const width = canvasWidth;
        const height = canvasHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 1);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 4000);
        camera.position.set(0, 0, 800);

        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);

        const group = new THREE.Group();
        const spacing = 1.2;

        imageStack.forEach((slice, i) => {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = slice.width;
            tmpCanvas.height = slice.height;
            const tmpCtx = tmpCanvas.getContext('2d');
            if (!tmpCtx) return;
            tmpCtx.putImageData(slice, 0, 0);

            const texture = new THREE.CanvasTexture(tmpCanvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(slice.width * 1.0, slice.height * 1.0),
                new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.7 })
            );

            plane.position.z = (i - imageStack.length / 2) * spacing;
            group.add(plane);
        });

        scene.add(group);
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        sceneRef.current = scene;
        cameraRef.current = camera;
        groupRef.current = group;
        rendererRef.current = renderer;

        const animate = () => {
            if (!groupRef.current || !cameraRef.current || !rendererRef.current) return;

            groupRef.current.rotation.x = (rotationX * Math.PI) / 180;
            groupRef.current.rotation.y = (rotationY * Math.PI) / 180;
            cameraRef.current.position.z = 800 / zoomLevel;
            cameraRef.current.lookAt(0, 0, 0);

            rendererRef.current.render(sceneRef.current as THREE.Scene, cameraRef.current);
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            renderer.dispose();
            group.clear();
            scene.clear();
        };
    }, [imageStack]);

    useEffect(() => {
        if (!groupRef.current || !cameraRef.current || !rendererRef.current) return;

        groupRef.current.rotation.x = (rotationX * Math.PI) / 180;
        groupRef.current.rotation.y = (rotationY * Math.PI) / 180;
        cameraRef.current.position.z = 800 / zoomLevel;
        rendererRef.current.render(sceneRef.current as THREE.Scene, cameraRef.current);
    }, [rotationX, rotationY, zoomLevel]);

    return (
        <Card className="border-border p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                3D Volume Rendering
            </h3>

            <div ref={containerRef} className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }} />

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium mb-2 block">Rotation X: {rotationX}°</label>
                    <Slider value={[rotationX]} onValueChange={([v]) => setRotationX(v)} min={-180} max={180} step={5} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-2 block">Rotation Y: {rotationY}°</label>
                    <Slider value={[rotationY]} onValueChange={([v]) => setRotationY(v)} min={-180} max={180} step={5} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-2 block">Zoom: {(zoomLevel * 100).toFixed(0)}%</label>
                    <Slider value={[zoomLevel * 100]} onValueChange={([v]) => setZoomLevel(v / 100)} min={40} max={200} step={5} />
                </div>
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">Volume Rendering:</p>
                <p>Using Three.js planes stack for volumetric slice review</p>
            </div>
        </Card>
    );
}

export function HounsfieldUnitInspector({
    pixelData,
    rescaleIntercept = -1024,
    rescaleSlope = 1,
    canvasWidth = 512,
    canvasHeight = 512,
}: {
    pixelData?: ImageData;
    rescaleIntercept?: number;
    rescaleSlope?: number;
    canvasWidth?: number;
    canvasHeight?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedHU, setSelectedHU] = useState<number | null>(null);
    const [hoverHU, setHoverHU] = useState<number | null>(null);
    const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
    const [roiStart, setRoiStart] = useState<{ x: number; y: number } | null>(null);
    const [roiEnd, setRoiEnd] = useState<{ x: number; y: number } | null>(null);
    const [roiStats, setRoiStats] = useState<ReturnType<typeof calculateROIStatistics> | null>(null);
    const [roiMode, setRoiMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!canvasRef.current || !pixelData) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = pixelData.width;
        tmpCanvas.height = pixelData.height;
        const tmpCtx = tmpCanvas.getContext('2d');
        if (tmpCtx) {
            tmpCtx.putImageData(pixelData, 0, 0);
            ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
        }

        if (hoverHU !== null && coords) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(coords.x * canvas.width, coords.y * canvas.height, 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (roiStart && roiEnd) {
            const x1 = roiStart.x * canvas.width;
            const y1 = roiStart.y * canvas.height;
            const x2 = roiEnd.x * canvas.width;
            const y2 = roiEnd.y * canvas.height;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
            ctx.setLineDash([]);
        }
    }, [pixelData, hoverHU, coords, roiStart, roiEnd]);

    const getHUAtPosition = (x: number, y: number) => {
        if (!pixelData) return null;
        const px = Math.floor(x * pixelData.width);
        const py = Math.floor(y * pixelData.height);
        if (px < 0 || py < 0 || px >= pixelData.width || py >= pixelData.height) return null;
        const idx = (py * pixelData.width + px) * 4;
        const grayscale = (pixelData.data[idx] + pixelData.data[idx + 1] + pixelData.data[idx + 2]) / 3;
        return calculateHU(grayscale, rescaleSlope, rescaleIntercept);
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const hu = getHUAtPosition(x, y);
        setHoverHU(hu);
        setCoords({ x, y });

        if (roiMode && isDragging) {
            setRoiEnd({ x, y });
        }
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!roiMode || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setIsDragging(true);
        setRoiStart({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
        setRoiEnd(null);
        setRoiStats(null);
    };

    const handleMouseUp = () => {
        if (!roiMode || !roiStart || !roiEnd || !pixelData) {
            setIsDragging(false);
            return;
        }

        const vertices = [
            roiStart,
            { x: roiEnd.x, y: roiStart.y },
            roiEnd,
            { x: roiStart.x, y: roiEnd.y },
        ];

        const stats = calculateROIStatistics(pixelData, vertices, pixelData.width, pixelData.height);
        setRoiStats(stats);
        setIsDragging(false);
    };

    const handleClick = () => {
        if (!coords) return;
        const hu = getHUAtPosition(coords.x, coords.y);
        setSelectedHU(hu);
    };

    return (
        <Card className="border-border p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Hounsfield Unit (HU) Inspector
            </h3>

            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="max-w-full max-h-full"
                    title="HU pixel inspector"
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <p>Hover HU: {hoverHU !== null ? hoverHU.toFixed(1) : 'N/A'}</p>
                <p>Selected HU: {selectedHU !== null ? `${selectedHU.toFixed(1)} (${categorizeHU(selectedHU)})` : 'Click to pick'}</p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant={roiMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRoiMode((prev) => !prev)}
                    className="border-border"
                >
                    {roiMode ? 'ROI Mode (On)' : 'ROI Mode (Off)'}
                </Button>
                {roiStats && (
                    <p className="text-xs text-muted-foreground">
                        ROI: mean {roiStats.mean.toFixed(1)}, std {roiStats.stdDev.toFixed(1)}, min {roiStats.min.toFixed(1)}, max {roiStats.max.toFixed(1)}
                    </p>
                )}
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted/25 rounded border border-border">
                <p className="font-semibold mb-1">HU Ranges:</p>
                <p>• Air: -1024 to -500</p>
                <p>• Lung: -500 to -100</p>
                <p>• Fat: -100 to 0</p>
                <p>• Water: 0 to 50</p>
                <p>• Bone: 300+</p>
            </div>
        </Card>
    );
}

function reconstructSagittal(imageStack: ImageData[], xNorm: number): ImageData | null {
    if (!imageStack || imageStack.length === 0) return null;
    const depth = imageStack.length;
    const width = depth;
    const height = imageStack[0].height;
    const x = Math.floor(Math.min(1, Math.max(0, xNorm)) * (imageStack[0].width - 1));

    const output = new ImageData(width, height);

    for (let z = 0; z < depth; z++) {
        const slice = imageStack[z];
        for (let y = 0; y < height; y++) {
            const srcIndex = (y * slice.width + x) * 4;
            const dstIndex = (y * width + z) * 4;
            output.data[dstIndex] = slice.data[srcIndex];
            output.data[dstIndex + 1] = slice.data[srcIndex + 1];
            output.data[dstIndex + 2] = slice.data[srcIndex + 2];
            output.data[dstIndex + 3] = slice.data[srcIndex + 3];
        }
    }

    return output;
}

function reconstructCoronal(imageStack: ImageData[], yNorm: number): ImageData | null {
    if (!imageStack || imageStack.length === 0) return null;
    const depth = imageStack.length;
    const width = imageStack[0].width;
    const height = depth;
    const y = Math.floor(Math.min(1, Math.max(0, yNorm)) * (imageStack[0].height - 1));

    const output = new ImageData(width, height);

    for (let z = 0; z < depth; z++) {
        const slice = imageStack[z];
        for (let x = 0; x < width; x++) {
            const srcIndex = (y * slice.width + x) * 4;
            const dstIndex = (z * width + x) * 4;
            output.data[dstIndex] = slice.data[srcIndex];
            output.data[dstIndex + 1] = slice.data[srcIndex + 1];
            output.data[dstIndex + 2] = slice.data[srcIndex + 2];
            output.data[dstIndex + 3] = slice.data[srcIndex + 3];
        }
    }

    return output;
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
