'use client';

import { useState, useRef, useEffect } from 'react';
import { DicomImage } from '@/lib/mock-data';
import {
  defaultViewerState,
  ViewerState,
  generateMockDICOMImage,
  getWindowPreset,
} from '@/lib/cornerstone-setup';
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
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DicomViewerProps {
  images: DicomImage[];
  modality: string;
  description: string;
}

export function DicomViewer({
  images,
  modality,
  description,
}: DicomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewerState, setViewerState] = useState<ViewerState>(
    defaultViewerState
  );
  const [showWindowControls, setShowWindowControls] = useState(false);

  const currentImage = images[viewerState.currentImage];

  // Draw image on canvas
  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate mock DICOM image
    const imageCanvas = generateMockDICOMImage(
      viewerState.currentImage + 1,
      currentImage?.seriesDescription || 'Series'
    );

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((viewerState.rotation * Math.PI) / 180);
    ctx.scale(viewerState.zoom, viewerState.zoom);
    if (viewerState.isFlipped) ctx.scale(-1, 1);
    ctx.translate(-imageCanvas.width / 2, -imageCanvas.height / 2);

    // Apply window/level
    const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageCanvas.width;
    tempCanvas.height = imageCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(imageCanvas, 0, 0);
    }

    // Draw image
    ctx.drawImage(imageCanvas, 0, 0);
    ctx.restore();
  }, [viewerState, currentImage, images]);

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
    setViewerState((prev) => ({
      ...prev,
      currentImage: Math.max(0, Math.min(images.length - 1, index)),
    }));
  };

  const handleWindowChange = (value: number[]) => {
    setViewerState((prev) => ({
      ...prev,
      windowCenter: value[0],
    }));
  };

  const handleReset = () => {
    const preset = getWindowPreset(modality, 'default');
    setViewerState((prev) => ({
      ...prev,
      zoom: 1,
      rotation: 0,
      isFlipped: false,
      pan: { x: 0, y: 0 },
      windowCenter: preset.windowCenter,
      windowWidth: preset.windowWidth,
    }));
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
            className="max-w-full max-h-full"
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
        </div>
      </Card>
    </div>
  );
}
