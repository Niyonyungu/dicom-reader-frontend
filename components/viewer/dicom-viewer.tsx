'use client';

import { useState, useRef, useEffect } from 'react';
import { DicomImage } from '@/lib/mock-data';
import {
  defaultViewerState,
  ViewerState,
  generateMockDICOMImage,
  getWindowPreset,
  windowPresets,
} from '@/lib/cornerstone-setup';
import { MultiPlanarReconstruction, VolumeRenderer, HounsfieldUnitInspector } from '@/components/viewer/advanced-visualization';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Star,
  Camera,
  FileText,
  Filter,
  BarChart3,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DicomViewerProps {
  images: (DicomImage & { pixelData?: ImageData })[];
  modality: string;
  description: string;
  syncIndex?: number;
  onIndexChange?: (index: number) => void;
  onImageViewed?: (imageId: string) => void;
  worklistItem?: any; // For metadata access
}

export function DicomViewer({
  images,
  modality,
  description,
  syncIndex,
  onIndexChange,
  onImageViewed,
  worklistItem,
}: DicomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewerState, setViewerState] = useState<ViewerState>(
    defaultViewerState
  );
  const [showWindowControls, setShowWindowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [keyImages, setKeyImages] = useState<Set<string>>(new Set());
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageFilter, setImageFilter] = useState<'none' | 'sharpen' | 'smooth' | 'edge'>('none');
  const [qualityMetrics, setQualityMetrics] = useState<{
    brightness: number;
    contrast: number;
    noise: number;
  } | null>(null);
  const [advancedMode, setAdvancedMode] = useState<'none' | 'mpr' | '3d' | 'hu'>('none');
  const [windowPresetName, setWindowPresetName] = useState<string>('default');
  const [annotations, setAnnotations] = useState<Array<{
    x: number;
    y: number;
    label: string;
    imageId: string;
  }>>([]);
  const [measurementPoints, setMeasurementPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [measurementDistance, setMeasurementDistance] = useState<number | null>(null);

  const currentImage = images[viewerState.currentImage];
  const volumeImageStack = images
    .map((img) => img.pixelData)
    .filter((pd): pd is ImageData => !!pd);

  // Sync with external index for multi-viewport sync
  useEffect(() => {
    if (typeof syncIndex === 'number' && syncIndex !== viewerState.currentImage) {
      setViewerState((prev) => ({
        ...prev,
        currentImage: Math.max(0, Math.min(images.length - 1, syncIndex)),
      }));
    }
  }, [syncIndex, images.length, viewerState.currentImage]);

  // Load and apply persisted window preset
  useEffect(() => {
    try {
      const savedPreset = localStorage.getItem('dicomViewerWindowPreset');
      if (savedPreset) {
        setWindowPresetName(savedPreset);
        const preset = getWindowPreset(modality, savedPreset);
        setViewerState((prev) => ({
          ...prev,
          windowCenter: preset.windowCenter,
          windowWidth: preset.windowWidth,
        }));
      }
    } catch {
      // ignore storage access errors
    }
  }, [modality]);

  const applyWindowPreset = (preset: string) => {
    const selectedPreset = getWindowPreset(modality, preset);
    setViewerState((prev) => ({
      ...prev,
      windowCenter: selectedPreset.windowCenter,
      windowWidth: selectedPreset.windowWidth,
    }));
    setWindowPresetName(preset);
    try {
      localStorage.setItem('dicomViewerWindowPreset', preset);
    } catch {
      // ignore
    }
  };

  const setCurrentImage = (index: number) => {
    const bounded = Math.max(0, Math.min(images.length - 1, index));
    setViewerState((prev) => ({ ...prev, currentImage: bounded }));
    onIndexChange?.(bounded);
  };

  // Mark current image as viewed
  useEffect(() => {
    if (currentImage && !currentImage.viewed && onImageViewed) {
      onImageViewed(currentImage.id);
    }
  }, [currentImage, onImageViewed]);

  // Draw image on canvas
  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background (typical for medical viewers)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (currentImage?.pixelData) {
      // actual pixel rendering path
      const pixel = currentImage.pixelData;
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = pixel.width;
      tmpCanvas.height = pixel.height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (tmpCtx) {
        tmpCtx.putImageData(pixel, 0, 0);
        ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);

        // Apply image filter
        if (imageFilter !== 'none') {
          applyImageFilter(ctx, imageFilter);
        }
      }
    } else {
      // Demo placeholder for missing parser
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';

      // Show demo message
      ctx.fillText('DICOM File Uploaded', centerX, centerY - 60);
      ctx.fillText('Demo Viewer - File Parsing Requires Backend', centerX, centerY - 30);
    }

    // Show file details
    if (currentImage) {
      ctx.font = '14px monospace';
      ctx.fillText(`File: ${currentImage.filename}`, centerX, centerY + 10);
      ctx.fillText(`Instance: ${currentImage.instanceNumber}`, centerX, centerY + 35);
      ctx.fillText(`Series: ${currentImage.seriesDescription}`, centerX, centerY + 60);
      ctx.fillText(`Modality: ${modality}`, centerX, centerY + 85);

      // Show viewed status
      if (currentImage.viewed) {
        ctx.fillStyle = '#10b981'; // green color
        ctx.font = 'bold 16px monospace';
        ctx.fillText('✓ VIEWED', centerX, centerY + 110);
        if (currentImage.viewedAt) {
          ctx.font = '12px monospace';
          ctx.fillStyle = '#6b7280';
          const viewedDate = new Date(currentImage.viewedAt).toLocaleString();
          ctx.fillText(`Viewed: ${viewedDate}`, centerX, centerY + 130);
        }
      } else {
        ctx.fillStyle = '#f59e0b'; // amber color
        ctx.font = 'bold 16px monospace';
        ctx.fillText('○ NOT VIEWED', centerX, centerY + 110);
      }
    }

    // Add border to indicate this is a file representation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // AI-based risk hint (placeholder for integration)
    if (currentImage) {
      const aiScore = ((currentImage.instanceNumber % 100) + 20) % 100;
      ctx.fillStyle = aiScore > 60 ? '#f43f5e' : '#22c55e';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`AI risk: ${aiScore}% (${aiScore > 60 ? 'Suspicious' : 'Normal'})`, centerX, 30);
    }

    // Add file icon representation
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(centerX - 30, centerY - 120, 60, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText('📄', centerX - 12, centerY - 70);

    // Key image indicator
    if (currentImage && keyImages.has(currentImage.id)) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('★ KEY IMAGE', centerX - 50, 50);
    }

    // Draw annotations for current image
    const currentAnnotations = annotations.filter((a) => a.imageId === currentImage?.id);
    currentAnnotations.forEach((annotation) => {
      const pointX = annotation.x * canvas.width;
      const pointY = annotation.y * canvas.height;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillText(annotation.label, pointX + 10, pointY - 10);
    });

    // Draw measurement line if available
    if (measurementPoints.length === 2) {
      const p1 = measurementPoints[0];
      const p2 = measurementPoints[1];
      const x1 = p1.x * canvas.width;
      const y1 = p1.y * canvas.height;
      const x2 = p2.x * canvas.width;
      const y2 = p2.y * canvas.height;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const distance = Math.hypot(x2 - x1, y2 - y1).toFixed(1);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText(`${distance} px`, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 8);
    }
  }, [viewerState, currentImage, images, modality, annotations, measurementPoints, imageFilter, keyImages]);

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.1 : 0.9;
    setViewerState((prev) => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom * factor)),
    }));
  };

  const handleRotate = () => {
    setViewerState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleFlip = () => {
    setViewerState((prev) => ({
      ...prev,
      isFlipped: !prev.isFlipped,
    }));
  };

  const handleImageChange = (index: number) => {
    setCurrentImage(index);
  };

  const handleWindowChange = (value: number[]) => {
    setViewerState((prev) => ({
      ...prev,
      windowCenter: value[0],
    }));
  };

  const handleReset = () => {
    applyWindowPreset(windowPresetName);
    setViewerState((prev) => ({
      ...prev,
      zoom: 1,
      rotation: 0,
      isFlipped: false,
      pan: { x: 0, y: 0 },
    }));
    setIsPlaying(false);
    setAnnotationMode(false);
    setAnnotations((prev) => prev.filter((a) => a.imageId !== currentImage?.id));
  };

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      setViewerState((prev) => ({
        ...prev,
        currentImage: (prev.currentImage + 1) % images.length,
      }));
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!annotationMode || !currentImage || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setAnnotations((prev) => [
      ...prev,
      {
        x,
        y,
        label: `A${prev.filter((item) => item.imageId === currentImage.id).length + 1}`,
        imageId: currentImage.id,
      },
    ]);
  };

  const getCanvasRelative = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!measurementMode || !canvasRef.current) return;
    const rel = getCanvasRelative(event);
    if (!rel) return;
    setMeasurementPoints([{ x: rel.x, y: rel.y }]);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!measurementMode || measurementPoints.length === 0 || !canvasRef.current) return;
    const rel = getCanvasRelative(event);
    if (!rel) return;
    setMeasurementPoints((prev) => [prev[0], rel]);
  };

  const handleCanvasMouseUp = () => {
    if (!measurementMode || measurementPoints.length !== 2 || !canvasRef.current) return;

    const [p1, p2] = measurementPoints;
    const dx = (p1.x - p2.x) * canvasRef.current.width;
    const dy = (p1.y - p2.y) * canvasRef.current.height;
    setMeasurementDistance(Math.hypot(dx, dy));
  };

  const toggleKeyImage = () => {
    if (!currentImage) return;
    setKeyImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentImage.id)) {
        newSet.delete(currentImage.id);
      } else {
        newSet.add(currentImage.id);
      }
      return newSet;
    });
  };

  const captureScreen = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `dicom-capture-${currentImage?.filename || 'image'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Screen capture failed:', error);
    }
  };

  const calculateQualityMetrics = () => {
    if (!currentImage?.pixelData) return;

    const data = currentImage.pixelData.data;
    let sum = 0, sumSq = 0, count = 0;
    let min = 255, max = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // Assuming grayscale
      sum += gray;
      sumSq += gray * gray;
      min = Math.min(min, gray);
      max = Math.max(max, gray);
      count++;
    }

    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    const stdDev = Math.sqrt(variance);

    setQualityMetrics({
      brightness: Math.round(mean),
      contrast: Math.round(max - min),
      noise: Math.round(stdDev)
    });
  };

  const applyImageFilter = (ctx: CanvasRenderingContext2D, filter: string) => {
    if (filter === 'none') return;

    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    if (filter === 'sharpen') {
      // Simple sharpen filter
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      applyConvolutionFilter(data, kernel);
    } else if (filter === 'smooth') {
      // Simple blur filter
      const kernel = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
      applyConvolutionFilter(data, kernel);
    } else if (filter === 'edge') {
      // Simple edge detection
      const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
      applyConvolutionFilter(data, kernel);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyConvolutionFilter = (data: Uint8ClampedArray, kernel: number[]) => {
    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);
    const src = new Uint8ClampedArray(data);
    const sw = Math.sqrt(data.length / 4);
    const sh = sw;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOff = (scy * sw + scx) * 4;
              const wt = kernel[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }
        }
        const dstOff = (y * sw + x) * 4;
        data[dstOff] = Math.min(255, Math.max(0, r));
        data[dstOff + 1] = Math.min(255, Math.max(0, g));
        data[dstOff + 2] = Math.min(255, Math.max(0, b));
      }
    }
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black rounded-lg border border-border">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No images available</p>
          <p className="text-xs text-muted-foreground">
            No DICOM images found for this study
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <Card className="border-border overflow-hidden">
        <div className="bg-black flex items-center justify-center" style={{ height: '600px' }}>
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="max-w-full max-h-full cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            title={annotationMode
              ? 'Click to add annotation'
              : measurementMode
                ? 'Drag to measure distance'
                : 'Image viewer'}
          />
        </div>
      </Card>

      {/* Controls */}
      <Card className="border-border p-4">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('in')}
              title="Zoom In"
              className="border-border"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('out')}
              title="Zoom Out"
              className="border-border"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              title="Rotate"
              className="border-border"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlip}
              title="Flip"
              className="border-border"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <select
              value={windowPresetName}
              onChange={(e) => applyWindowPreset(e.target.value)}
              className="rounded border border-border bg-surface text-xs py-1 px-2"
              title="Window/Level Preset"
            >
              {Object.keys(windowPresets[modality.toLowerCase() as keyof typeof windowPresets] || windowPresets.xray).map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWindowControls(!showWindowControls)}
              title="Window/Level"
              className="border-border"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant={advancedMode === 'mpr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdvancedMode((prev) => (prev === 'mpr' ? 'none' : 'mpr'))}
              className="border-border"
            >
              MPR
            </Button>
            <Button
              variant={advancedMode === '3d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdvancedMode((prev) => (prev === '3d' ? 'none' : '3d'))}
              className="border-border"
            >
              3D
            </Button>
            <Button
              variant={advancedMode === 'hu' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdvancedMode((prev) => (prev === 'hu' ? 'none' : 'hu'))}
              className="border-border"
            >
              HU
            </Button>
            <Button
              variant={isPlaying ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="border-border"
            >
              {isPlaying ? 'Pause Cine' : 'Play Cine'}
            </Button>
            <Button
              variant={annotationMode ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setAnnotationMode((prev) => !prev);
                if (measurementMode) setMeasurementMode(false);
              }}
              className="border-border"
            >
              {annotationMode ? 'Exit Annotate' : 'Annotate'}
            </Button>
            <Button
              variant={measurementMode ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setMeasurementMode((prev) => !prev);
                if (annotationMode) setAnnotationMode(false);
                setMeasurementPoints([]);
                setMeasurementDistance(null);
              }}
              className="border-border"
            >
              {measurementMode ? 'Exit Measure' : 'Measure'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMeasurementPoints([]);
                setMeasurementDistance(null);
              }}
              className="border-border"
            >
              Clear Measures
            </Button>
            <Button
              variant={keyImages.has(currentImage?.id || '') ? 'default' : 'outline'}
              size="sm"
              onClick={toggleKeyImage}
              title="Mark as Key Image"
              className="border-border"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={captureScreen}
              title="Capture Screen"
              className="border-border"
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              title="DICOM Metadata"
              className="border-border"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={calculateQualityMetrics}
              title="Quality Metrics"
              className="border-border"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-border ml-auto"
            >
              Reset
            </Button>
          </div>

          {/* Window/Level Controls */}
          {showWindowControls && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Window Center: {viewerState.windowCenter}
                </label>
                <Slider
                  value={[viewerState.windowCenter]}
                  onValueChange={handleWindowChange}
                  min={0}
                  max={255}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Image Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImageChange(viewerState.currentImage - 1)}
                disabled={viewerState.currentImage === 0}
                className="border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground font-medium px-3 py-1 rounded bg-muted">
                {viewerState.currentImage + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImageChange(viewerState.currentImage + 1)}
                disabled={viewerState.currentImage === images.length - 1}
                className="border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Info */}
            <div className="text-right text-xs text-muted-foreground">
              {currentImage && (
                <>
                  <div>{currentImage.seriesDescription}</div>
                  <div>{currentImage.filename}</div>
                </>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div>
              Zoom: {(viewerState.zoom * 100).toFixed(0)}% | Rotation:{' '}
              {viewerState.rotation}°
            </div>
            <div>
              W:{viewerState.windowWidth} L:{viewerState.windowCenter}
            </div>
          </div>

          {/* Slice Slider */}
          <div className="mt-4">
            <label className="text-xs font-medium text-foreground">
              Slice {viewerState.currentImage + 1} / {images.length}
            </label>
            <Slider
              value={[viewerState.currentImage]}
              onValueChange={([value]) => handleImageChange(value)}
              min={0}
              max={Math.max(0, images.length - 1)}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Metadata / AI Insight */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/25 border border-border">
              <h3 className="text-sm font-semibold mb-2">DICOM Metadata</h3>
              <p className="text-xs text-muted-foreground">Modality: {modality}</p>
              <p className="text-xs text-muted-foreground">Description: {description}</p>
              {currentImage && (
                <>
                  <p className="text-xs text-muted-foreground">Series: {currentImage.seriesDescription}</p>
                  <p className="text-xs text-muted-foreground">Instance: {currentImage.instanceNumber}</p>
                  <p className="text-xs text-muted-foreground">File: {currentImage.filename}</p>
                  <p className="text-xs text-muted-foreground">Viewed: {currentImage.viewed ? 'Yes' : 'No'}</p>
                </>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/25 border border-border">
              <h3 className="text-sm font-semibold mb-2">AI Pre-read (Demo)</h3>
              <p className="text-xs text-muted-foreground">
                The DICOM viewer is prepared for AI integration: lesion flags, required follow-up, and request prioritization.
              </p>
              <p className="mt-2 text-xs font-semibold">
                {currentImage ? (currentImage.instanceNumber % 3 === 0 ? 'Finding: Potential nodule' : 'Finding: No critical finding') : 'No image selected'}
              </p>
            </div>
          </div>

          {/* DICOM Metadata Viewer */}
          {showMetadata && currentImage && (
            <div className="mt-4 p-4 rounded-lg bg-muted/25 border border-border">
              <h3 className="text-sm font-semibold mb-3">DICOM Header Information</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">Study Information</p>
                  <p>Study ID: {worklistItem?.id || 'N/A'}</p>
                  <p>Study Date: {worklistItem?.studyDate || 'N/A'}</p>
                  <p>Study Time: {worklistItem?.studyTime || 'N/A'}</p>
                  <p>Modality: {modality}</p>
                  <p>Description: {description}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Image Information</p>
                  <p>Series: {currentImage.seriesDescription}</p>
                  <p>Instance: {currentImage.instanceNumber}</p>
                  <p>Filename: {currentImage.filename}</p>
                  <p>Window Center: {currentImage.windowCenter || 'N/A'}</p>
                  <p>Window Width: {currentImage.windowWidth || 'N/A'}</p>
                  <p>Slice Thickness: {currentImage.sliceThickness || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quality Metrics */}
          {qualityMetrics && (
            <div className="mt-4 p-4 rounded-lg bg-muted/25 border border-border">
              <h3 className="text-sm font-semibold mb-3">Image Quality Metrics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Brightness</p>
                  <p className="text-lg font-semibold">{qualityMetrics.brightness}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(qualityMetrics.brightness / 255) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contrast</p>
                  <p className="text-lg font-semibold">{qualityMetrics.contrast}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(qualityMetrics.contrast / 255) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Noise</p>
                  <p className="text-lg font-semibold">{qualityMetrics.noise}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min((qualityMetrics.noise / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Filters */}
          <div className="mt-4 p-4 rounded-lg bg-muted/25 border border-border">
            <h3 className="text-sm font-semibold mb-3">Image Processing</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={imageFilter === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageFilter('none')}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Original
              </Button>
              <Button
                variant={imageFilter === 'sharpen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageFilter('sharpen')}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Sharpen
              </Button>
              <Button
                variant={imageFilter === 'smooth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageFilter('smooth')}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Smooth
              </Button>
              <Button
                variant={imageFilter === 'edge' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageFilter('edge')}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Edge Detect
              </Button>
            </div>
          </div>

          {/* Advanced Visualization Modes */}
          {advancedMode !== 'none' && (
            <div className="mt-4">
              {advancedMode === 'mpr' && volumeImageStack.length > 0 && (
                <MultiPlanarReconstruction imageStack={volumeImageStack} sliceIndex={viewerState.currentImage} />
              )}
              {advancedMode === '3d' && volumeImageStack.length > 0 && (
                <VolumeRenderer imageStack={volumeImageStack} />
              )}
              {advancedMode === 'hu' && currentImage?.pixelData && (
                <HounsfieldUnitInspector
                  pixelData={currentImage.pixelData}
                  rescaleIntercept={currentImage.rescaleIntercept ?? -1024}
                  rescaleSlope={currentImage.rescaleSlope ?? 1}
                />
              )}
              {advancedMode === 'mpr' && !currentImage?.pixelData && (
                <p className="text-sm text-muted-foreground">MPR requires loaded pixel data in current slice.</p>
              )}
              {advancedMode === 'hu' && !currentImage?.pixelData && (
                <p className="text-sm text-muted-foreground">HU inspection requires loaded pixel data.</p>
              )}
              {advancedMode === '3d' && volumeImageStack.length === 0 && (
                <p className="text-sm text-muted-foreground">3D rendering requires a stack of image data across slices.</p>
              )}
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}
