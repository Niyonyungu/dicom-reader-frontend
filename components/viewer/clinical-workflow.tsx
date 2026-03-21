'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Layout,
    Copy,
    Save,
    Plus,
    Trash2,
    FileText,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';

/**
 * Hanging Protocol System
 * Preset viewing layouts automatically configured based on study type
 */
export function HangingProtocolManager({
    studyType,
    onProtocolSelect,
}: {
    studyType: string;
    onProtocolSelect?: (protocol: HangingProtocol) => void;
}) {
    const [customProtocols, setCustomProtocols] = useState<HangingProtocol[]>([]);
    const [selectedProtocol, setSelectedProtocol] = useState<HangingProtocol | null>(null);

    const defaultProtocols: Record<string, HangingProtocol[]> = {
        CT_CHEST: [
            {
                id: 'ct-chest-standard',
                name: 'Chest CT - Standard',
                description: '2x2 layout for axial, sagittal, coronal, and lung window',
                layout: '2x2',
                viewports: [
                    { position: 0, type: 'axial', window: 'mediastinal', label: 'Axial Mediastinal' },
                    { position: 1, type: 'axial', window: 'lung', label: 'Axial Lung' },
                    { position: 2, type: 'sagittal', window: 'mediastinal', label: 'Sagittal' },
                    { position: 3, type: 'coronal', window: 'mediastinal', label: 'Coronal' },
                ],
            },
            {
                id: 'ct-chest-pe',
                name: 'Chest CT - PE Protocol',
                description: '3x2 layout for pulmonary embolism detection',
                layout: '3x2',
                viewports: [
                    { position: 0, type: 'axial', window: 'mediastinal', label: 'Axial Level 1' },
                    { position: 1, type: 'axial', window: 'mediastinal', label: 'Axial Level 2' },
                    { position: 2, type: 'axial', window: 'mediastinal', label: 'Axial Level 3' },
                    { position: 3, type: 'mip', window: 'mediastinal', label: 'MIP Thorax' },
                    { position: 4, type: 'coronal', window: 'mediastinal', label: 'Coronal' },
                    { position: 5, type: 'sagittal', window: 'mediastinal', label: 'Sagittal' },
                ],
            },
        ],
        CT_ABDOMEN: [
            {
                id: 'ct-abdomen-standard',
                name: 'Abdomen CT - Standard',
                description: '2x3 layout for comprehensive abdominal imaging',
                layout: '2x3',
                viewports: [
                    { position: 0, type: 'axial', window: 'liver', label: 'Axial Liver' },
                    { position: 1, type: 'axial', window: 'pancreas', label: 'Axial Pancreas' },
                    { position: 2, type: 'coronal', window: 'liver', label: 'Coronal' },
                    { position: 3, type: 'sagittal', window: 'liver', label: 'Sagittal' },
                    { position: 4, type: 'mpr', window: 'liver', label: 'MPR' },
                    { position: 5, type: 'axial', window: 'bone', label: 'Axial Bone' },
                ],
            },
        ],
        MR_BRAIN: [
            {
                id: 'mr-brain-standard',
                name: 'Brain MR - Standard',
                description: '2x2 layout for brain imaging',
                layout: '2x2',
                viewports: [
                    { position: 0, type: 'axial', window: 'brain', label: 'Axial T2' },
                    { position: 1, type: 'coronal', window: 'brain', label: 'Coronal FLAIR' },
                    { position: 2, type: 'sagittal', window: 'brain', label: 'Sagittal T1' },
                    { position: 3, type: 'axial', window: 'brain', label: 'Axial DWI' },
                ],
            },
        ],
        XR_CHEST: [
            {
                id: 'xr-chest-standard',
                name: 'Chest X-ray - Standard',
                description: 'Single view with comparison space',
                layout: '1x2',
                viewports: [
                    { position: 0, type: 'radiograph', window: 'lung', label: 'Current' },
                    { position: 1, type: 'radiograph', window: 'lung', label: 'Prior' },
                ],
            },
        ],
    };

    const protocols = [...(defaultProtocols[studyType] || []), ...customProtocols];

    const handleProtocolSelect = (protocol: HangingProtocol) => {
        setSelectedProtocol(protocol);
        onProtocolSelect?.(protocol);

        auditLogger.log(
            AuditEventType.STUDY_OPENED,
            `Hanging protocol applied: ${protocol.name}`,
            {
                metadata: { protocolId: protocol.id, protocolName: protocol.name },
            }
        );
    };

    const handleSaveCustomProtocol = () => {
        // Implementation for saving custom protocol
    };

    return (
        <Card className="border-border p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Hanging Protocols
            </h3>

            <div className="space-y-2">
                {protocols.map(protocol => (
                    <button
                        key={protocol.id}
                        onClick={() => handleProtocolSelect(protocol)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${selectedProtocol?.id === protocol.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-muted/50'
                            }`}
                    >
                        <div className="font-medium text-sm">{protocol.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{protocol.description}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Layout: {protocol.layout}
                        </div>
                    </button>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCustomProtocol}
                className="w-full border-border"
            >
                <Plus className="h-4 w-4 mr-2" />
                Save Custom Protocol
            </Button>
        </Card>
    );
}

export interface HangingProtocol {
    id: string;
    name: string;
    description: string;
    layout: string;
    viewports: ViewportConfig[];
}

export interface ViewportConfig {
    position: number;
    type: 'axial' | 'coronal' | 'sagittal' | 'mip' | 'mpr' | 'radiograph';
    window: string;
    label: string;
}

/**
 * Image Comparison Tool
 * Side-by-side or difference overlay comparison for follow-up studies
 */
export function ImageComparisonTool({
    currentImage,
    priorImage,
    imageId: currentImageId,
    studyId,
}: {
    currentImage?: ImageData;
    priorImage?: ImageData;
    imageId?: string;
    studyId?: string;
}) {
    const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'difference'>('side-by-side');
    const [overlayOpacity, setOverlayOpacity] = useState(50);
    const canvasRefs = {
        current: React.useRef<HTMLCanvasElement>(null),
        prior: React.useRef<HTMLCanvasElement>(null),
        comparison: React.useRef<HTMLCanvasElement>(null),
    };

    React.useEffect(() => {
        if (comparisonMode === 'side-by-side') {
            // Draw current
            if (currentImage && canvasRefs.current.current) {
                const canvas = canvasRefs.current.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const tmpCanvas = document.createElement('canvas');
                    tmpCanvas.width = currentImage.width;
                    tmpCanvas.height = currentImage.height;
                    const tmpCtx = tmpCanvas.getContext('2d');
                    if (tmpCtx) {
                        tmpCtx.putImageData(currentImage, 0, 0);
                        ctx.drawImage(tmpCanvas, 0, 0);
                    }
                }
            }

            // Draw prior
            if (priorImage && canvasRefs.prior.current) {
                const canvas = canvasRefs.prior.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const tmpCanvas = document.createElement('canvas');
                    tmpCanvas.width = priorImage.width;
                    tmpCanvas.height = priorImage.height;
                    const tmpCtx = tmpCanvas.getContext('2d');
                    if (tmpCtx) {
                        tmpCtx.putImageData(priorImage, 0, 0);
                        ctx.drawImage(tmpCanvas, 0, 0);
                    }
                }
            }
        } else if (comparisonMode === 'overlay' && canvasRefs.comparison.current && currentImage && priorImage) {
            const canvas = canvasRefs.comparison.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw current
                const tmpCanvas1 = document.createElement('canvas');
                tmpCanvas1.width = currentImage.width;
                tmpCanvas1.height = currentImage.height;
                const tmpCtx1 = tmpCanvas1.getContext('2d');
                if (tmpCtx1) {
                    tmpCtx1.putImageData(currentImage, 0, 0);
                    ctx.drawImage(tmpCanvas1, 0, 0);
                }

                // Draw prior with opacity
                ctx.globalAlpha = overlayOpacity / 100;
                const tmpCanvas2 = document.createElement('canvas');
                tmpCanvas2.width = priorImage.width;
                tmpCanvas2.height = priorImage.height;
                const tmpCtx2 = tmpCanvas2.getContext('2d');
                if (tmpCtx2) {
                    tmpCtx2.putImageData(priorImage, 0, 0);
                    ctx.drawImage(tmpCanvas2, 0, 0);
                }
                ctx.globalAlpha = 1;
            }
        } else if (comparisonMode === 'difference' && canvasRefs.comparison.current && currentImage && priorImage) {
            const canvas = canvasRefs.comparison.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const imageDataOut = ctx.createImageData(canvas.width, canvas.height);
                const data1 = currentImage.data;
                const data2 = priorImage.data;
                const output = imageDataOut.data;

                // Calculate difference
                for (let i = 0; i < Math.min(data1.length, data2.length); i += 4) {
                    const diff = Math.abs(data1[i] - data2[i]);
                    output[i] = diff;
                    output[i + 1] = diff;
                    output[i + 2] = diff;
                    output[i + 3] = 255;
                }

                ctx.putImageData(imageDataOut, 0, 0);
            }
        }
    }, [comparisonMode, currentImage, priorImage, overlayOpacity]);

    return (
        <Card className="border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Image Comparison
                </h3>
            </div>

            <Tabs value={comparisonMode} onValueChange={(v: any) => setComparisonMode(v)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
                    <TabsTrigger value="overlay">Overlay</TabsTrigger>
                    <TabsTrigger value="difference">Difference</TabsTrigger>
                </TabsList>

                <TabsContent value="side-by-side" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Current Study</p>
                            <div className="bg-black rounded overflow-hidden" style={{ height: '250px' }}>
                                <canvas ref={canvasRefs.current} width={256} height={256} className="w-full h-full" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Prior Study</p>
                            <div className="bg-black rounded overflow-hidden" style={{ height: '250px' }}>
                                <canvas ref={canvasRefs.prior} width={256} height={256} className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="overlay" className="space-y-3">
                    <div className="bg-black rounded overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                        <canvas ref={canvasRefs.comparison} width={256} height={256} className="max-w-full max-h-full" />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-2 block">
                            Prior Image Opacity: {overlayOpacity}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={overlayOpacity}
                            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="difference" className="space-y-3">
                    <div className="bg-black rounded overflow-hidden flex items-center justify-center" style={{ height: '300px' }}>
                        <canvas ref={canvasRefs.comparison} width={256} height={256} className="max-w-full max-h-full" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Difference map shows areas that have changed between studies
                    </p>
                </TabsContent>
            </Tabs>

            <Button
                variant="outline"
                size="sm"
                className="w-full border-border"
                onClick={() => {
                    auditLogger.log(
                        AuditEventType.STUDY_OPENED,
                        'Image comparison performed',
                        {
                            studyId,
                            imageId: currentImageId,
                            metadata: { comparisonMode },
                        }
                    );
                }}
            >
                Save Comparison
            </Button>
        </Card>
    );
}

/**
 * Advanced Annotations Component
 * Arrows, text labels, geometric shapes, and measurement callouts
 */
export function AdvancedAnnotations({
    onAnnotationAdd,
    annotations = [],
}: {
    onAnnotationAdd?: (annotation: Annotation) => void;
    annotations?: Annotation[];
}) {
    const [annotationType, setAnnotationType] = useState<'arrow' | 'text' | 'circle' | 'rectangle' | 'line'>('arrow');
    const [annotationText, setAnnotationText] = useState('');
    const [color, setColor] = useState('#facc15');

    const handleAddAnnotation = () => {
        const annotation: Annotation = {
            id: `annotation_${Date.now()}`,
            type: annotationType,
            text: annotationText,
            color,
            timestamp: Date.now(),
            points: [],
        };

        onAnnotationAdd?.(annotation);
        setAnnotationText('');

        auditLogger.log(
            AuditEventType.ANNOTATION_CREATED,
            `Annotation added: ${annotationType}`,
            {
                metadata: { annotationType, color },
            }
        );
    };

    return (
        <Card className="border-border p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Advanced Annotations
            </h3>

            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium mb-2 block">Annotation Type</label>
                    <div className="grid grid-cols-5 gap-2">
                        {(
                            [
                                { value: 'arrow', label: '→' },
                                { value: 'text', label: 'A' },
                                { value: 'circle', label: '○' },
                                { value: 'rectangle', label: '▭' },
                                { value: 'line', label: '—' },
                            ] as const
                        ).map(type => (
                            <button
                                key={type.value}
                                onClick={() => setAnnotationType(type.value)}
                                className={`p-2 rounded border-2 font-semibold text-sm transition-colors ${annotationType === type.value
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border hover:border-primary'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {['text', 'arrow'].includes(annotationType) && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">Text</label>
                        <input
                            type="text"
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                            placeholder="Enter annotation text..."
                            className="w-full px-3 py-2 rounded border border-border bg-background text-foreground text-sm"
                        />
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium mb-2 block">Color</label>
                    <div className="flex gap-2">
                        {['#facc15', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ffffff'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded border-2 ${color === c ? 'border-foreground' : 'border-border'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <Button onClick={handleAddAnnotation} variant="default" size="sm" className="w-full">
                    Add Annotation
                </Button>
            </div>

            {annotations.length > 0 && (
                <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold mb-2">Recent Annotations ({annotations.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {annotations.slice(-5).map(ann => (
                            <div
                                key={ann.id}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs"
                            >
                                <div
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: ann.color }}
                                />
                                <span className="flex-1">{ann.type}: {ann.text || '(shape)'}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => {
                                        auditLogger.log(
                                            AuditEventType.ANNOTATION_DELETED,
                                            'Annotation deleted',
                                            {
                                                metadata: { annotationId: ann.id },
                                            }
                                        );
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                        }
                    </div>
                </div>
            )}
        </Card>
    );
}

export interface Annotation {
    id: string;
    type: 'arrow' | 'text' | 'circle' | 'rectangle' | 'line';
    text?: string;
    color: string;
    timestamp: number;
    points: Array<{ x: number; y: number }>;
}

/**
 * Reference Lines Component
 * Anatomical reference lines and coordinate systems
 */
export function ReferenceLines() {
    const [showCrosshairs, setShowCrosshairs] = useState(true);
    const [showOrientation, setShowOrientation] = useState(true);
    const [showScalebar, setShowScalebar] = useState(true);

    return (
        <Card className="border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Reference Lines & Orientation</h3>

            <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                        type="checkbox"
                        checked={showCrosshairs}
                        onChange={(e) => setShowCrosshairs(e.target.checked)}
                    />
                    <span>Show Crosshairs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                        type="checkbox"
                        checked={showOrientation}
                        onChange={(e) => setShowOrientation(e.target.checked)}
                    />
                    <span>Show Anatomical Orientation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                        type="checkbox"
                        checked={showScalebar}
                        onChange={(e) => setShowScalebar(e.target.checked)}
                    />
                    <span>Show Scale Bar</span>
                </label>
            </div>

            <div className="p-3 bg-muted/25 rounded border border-border text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">Orientation Abbreviations:</p>
                <p>A: Anterior | P: Posterior</p>
                <p>R: Right | L: Left</p>
                <p>H: Head | F: Feet</p>
            </div>
        </Card>
    );
}
