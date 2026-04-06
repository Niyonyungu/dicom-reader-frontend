'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DicomImage } from '@/lib/mock-data';
import { DicomViewer } from './dicom-viewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Grid3X3,
  Grid2X2,
  Square,
  History,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';

interface ViewportState {
  id: string;
  images: (DicomImage & { pixelData?: ImageData })[];
  currentImageIndex: number;
  modality: string;
  description: string;
  worklistItem?: any;
  isActive: boolean;
}

interface MultiViewportDicomViewerProps {
  worklistItem: any;
  patient: any;
  onImageViewed?: (imageId: string) => void;
}

export function MultiViewportDicomViewer({
  worklistItem,
  patient,
  onImageViewed,
}: MultiViewportDicomViewerProps) {
  const [gridLayout, setGridLayout] = useState<'1x1' | '1x2' | '2x1' | '2x2' | '3x2' | '2x3'>('1x1');
  const [viewports, setViewports] = useState<ViewportState[]>([
    {
      id: 'viewport-0',
      images: worklistItem?.images || [],
      currentImageIndex: 0,
      modality: worklistItem?.modality || '',
      description: worklistItem?.description || '',
      worklistItem,
      isActive: true,
    },
  ]);
  const [draggedImage, setDraggedImage] = useState<DicomImage | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load patient history
  useEffect(() => {
    if (patient?.id) {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockWorklist = [
        {
          id: 'W001',
          patientId: 'P001',
          patientName: 'John Doe',
          studyDate: '2026-03-10',
          studyTime: '09:30',
          modality: 'MRI',
          description: 'Brain MRI with Contrast',
          imageCount: 45,
        },
        {
          id: 'W006',
          patientId: 'P001',
          patientName: 'John Doe',
          studyDate: '2026-03-08',
          studyTime: '16:30',
          modality: 'CT',
          description: 'Abdomen and Pelvis CT',
          imageCount: 150,
        },
      ];

      const history = mockWorklist.filter(item => item.patientId === patient.id && item.id !== worklistItem?.id);
      setPatientHistory(history);

      auditLogger.log(
        AuditEventType.STUDY_OPENED,
        `Patient history loaded for ${patient.id}`,
        {
          metadata: { patientId: patient.id, historyCount: history.length },
        }
      );
    }
  }, [patient?.id, worklistItem?.id]);

  const getGridClasses = (layout: string) => {
    switch (layout) {
      case '1x1': return 'grid-cols-1 grid-rows-1';
      case '1x2': return 'grid-cols-2 grid-rows-1';
      case '2x1': return 'grid-cols-1 grid-rows-2';
      case '2x2': return 'grid-cols-2 grid-rows-2';
      case '3x2': return 'grid-cols-3 grid-rows-2';
      case '2x3': return 'grid-cols-2 grid-rows-3';
      default: return 'grid-cols-1 grid-rows-1';
    }
  };

  const getViewportCount = (layout: string) => {
    switch (layout) {
      case '1x1': return 1;
      case '1x2': return 2;
      case '2x1': return 2;
      case '2x2': return 4;
      case '3x2': return 6;
      case '2x3': return 6;
      default: return 1;
    }
  };

  const updateGridLayout = (newLayout: '1x1' | '1x2' | '2x1' | '2x2' | '3x2' | '2x3') => {
    const newViewportCount = getViewportCount(newLayout);
    const currentViewportCount = viewports.length;

    setViewports(prev => {
      let newViewports = [...prev];

      // Add viewports if needed
      while (newViewports.length < newViewportCount) {
        newViewports.push({
          id: `viewport-${newViewports.length}`,
          images: [],
          currentImageIndex: 0,
          modality: '',
          description: '',
          isActive: false,
        });
      }

      // Remove excess viewports
      if (newViewports.length > newViewportCount) {
        newViewports = newViewports.slice(0, newViewportCount);
      }

      // Ensure at least one viewport is active
      if (!newViewports.some(v => v.isActive)) {
        newViewports[0].isActive = true;
      }

      return newViewports;
    });

    setGridLayout(newLayout);
  };

  const setActiveViewport = (viewportId: string) => {
    setViewports(prev =>
      prev.map(vp => ({
        ...vp,
        isActive: vp.id === viewportId,
      }))
    );
  };

  const handleImageDragStart = (image: DicomImage, viewportId: string) => {
    setDraggedImage(image);
  };

  const handleViewportDrop = (targetViewportId: string) => {
    if (!draggedImage) return;

    setViewports(prev => prev.map(vp => {
      if (vp.id === targetViewportId) {
        // Add image to target viewport if not already there
        const imageExists = vp.images.some(img => img.id === draggedImage.id);
        if (!imageExists) {
          return {
            ...vp,
            images: [...vp.images, draggedImage],
            currentImageIndex: vp.images.length, // Set to the new image
            modality: vp.modality || draggedImage.seriesDescription || '',
            description: vp.description || draggedImage.seriesDescription || '',
          };
        }
      }
      return vp;
    }));

    setDraggedImage(null);

    auditLogger.log(
      AuditEventType.STUDY_OPENED,
      `Image dragged to viewport ${targetViewportId}`,
      {
        metadata: { imageId: draggedImage.id, targetViewportId },
      }
    );
  };

  const loadStudyIntoViewport = (study: any, viewportId: string) => {
    // In a real app, this would load the actual images for the study
    // For now, we'll create mock images
    const mockImages: DicomImage[] = [];
    for (let i = 1; i <= Math.min(study.imageCount, 10); i++) {
      mockImages.push({
        id: `${study.id}_IMG${i.toString().padStart(3, '0')}`,
        instanceNumber: i,
        filename: `IMG_${i.toString().padStart(3, '0')}.dcm`,
        seriesDescription: study.description,
        viewed: false,
      });
    }

    setViewports(prev => prev.map(vp => {
      if (vp.id === viewportId) {
        return {
          ...vp,
          images: mockImages,
          currentImageIndex: 0,
          modality: study.modality,
          description: study.description,
          worklistItem: study,
        };
      }
      return vp;
    }));

    auditLogger.log(
      AuditEventType.STUDY_OPENED,
      `Study loaded into viewport: ${study.description}`,
      {
        metadata: { studyId: study.id, viewportId, imageCount: mockImages.length },
      }
    );
  };

  const closeViewport = (viewportId: string) => {
    if (viewports.length <= 1) return; // Don't close the last viewport

    setViewports(prev => {
      const newViewports = prev.filter(vp => vp.id !== viewportId);
      // Ensure at least one viewport is active
      if (!newViewports.some(vp => vp.isActive)) {
        newViewports[0].isActive = true;
      }
      return newViewports;
    });
  };

  const activeViewport = viewports.find(vp => vp.isActive);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Grid Layout:</label>
              <select
                value={gridLayout}
                onChange={(event) => updateGridLayout(event.target.value as any)}
                className="rounded border border-border bg-background text-sm px-3 py-2"
              >
                <option value="1x1">1×1</option>
                <option value="1x2">1×2</option>
                <option value="2x1">2×1</option>
                <option value="2x2">2×2</option>
                <option value="3x2">3×2</option>
                <option value="2x3">2×3</option>
              </select>
            </div>

            {patientHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="border-border"
              >
                <History className="h-4 w-4 mr-2" />
                Patient History ({patientHistory.length})
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Active Viewport: {activeViewport?.id || 'None'}
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Load & Compare Studies</p>
          <p className="text-xs text-muted-foreground mt-1">
            Select a prior study from patient history and load it directly into any viewport for side-by-side review.
          </p>
        </div>

        {/* Patient History */}
        {showHistory && patientHistory.length > 0 && (
          <div className="mt-4 p-4 bg-muted/25 rounded-lg border border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Prior Studies
            </h3>
            <div className="space-y-2">
              {patientHistory.map(study => (
                <div key={study.id} className="flex items-center justify-between p-3 bg-background rounded border">
                  <div>
                    <div className="font-medium">{study.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {study.studyDate} {study.studyTime} • {study.modality} • {study.imageCount} images
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {viewports.map((vp, idx) => (
                      <Button
                        key={vp.id}
                        variant="outline"
                        size="sm"
                        onClick={() => loadStudyIntoViewport(study, vp.id)}
                        className="text-xs"
                      >
                        Load in Viewport {idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Viewport Grid */}
      <div className={`grid gap-2 min-h-[600px] ${getGridClasses(gridLayout)}`}>
        {viewports.map((viewport, index) => (
          <div
            key={viewport.id}
            className={`relative border-2 rounded-lg overflow-auto ${
              viewport.isActive ? 'border-primary' : 'border-border'
            }`}
            onClick={() => setActiveViewport(viewport.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleViewportDrop(viewport.id)}
          >
            {/* Viewport Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black/75 text-white p-2 flex items-center justify-between">
              <div className="text-xs font-medium">
                {viewport.id}
                {viewport.images.length > 0 && ` (${viewport.currentImageIndex + 1}/${viewport.images.length})`}
              </div>
              {viewports.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewport(viewport.id);
                  }}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* DICOM Viewer */}
            <DicomViewer
              images={viewport.images}
              modality={viewport.modality}
              description={viewport.description}
              syncIndex={viewport.currentImageIndex}
              onIndexChange={(index) => {
                setViewports(prev => prev.map(vp =>
                  vp.id === viewport.id
                    ? { ...vp, currentImageIndex: index }
                    : vp
                ));
              }}
              onImageViewed={onImageViewed}
              worklistItem={viewport.worklistItem}
              showControls={true}
            />

            {/* Drag Handle */}
            {viewport.images.length > 0 && (
              <div className="absolute bottom-2 right-2 z-10">
                <div
                  draggable
                  onDragStart={() => handleImageDragStart(
                    viewport.images[viewport.currentImageIndex],
                    viewport.id
                  )}
                  className="bg-black/75 text-white p-2 rounded cursor-move text-xs"
                  title="Drag to move image to another viewport"
                >
                  ⋮⋮
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unified Controls for Active Viewport */}
      {activeViewport && activeViewport.images.length > 0 && (
        <Card className="border-border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Controls for {activeViewport.id}: {activeViewport.description}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newIndex = Math.max(0, activeViewport.currentImageIndex - 1);
                  setViewports(prev => prev.map(vp =>
                    vp.id === activeViewport.id
                      ? { ...vp, currentImageIndex: newIndex }
                      : vp
                  ));
                }}
                disabled={activeViewport.currentImageIndex === 0}
                className="border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3 py-1 bg-muted rounded">
                {activeViewport.currentImageIndex + 1} / {activeViewport.images.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newIndex = Math.min(activeViewport.images.length - 1, activeViewport.currentImageIndex + 1);
                  setViewports(prev => prev.map(vp =>
                    vp.id === activeViewport.id
                      ? { ...vp, currentImageIndex: newIndex }
                      : vp
                  ));
                }}
                disabled={activeViewport.currentImageIndex === activeViewport.images.length - 1}
                className="border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}