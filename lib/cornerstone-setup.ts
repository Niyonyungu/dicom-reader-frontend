// Cornerstone setup and utility functions
// Note: For production, you would initialize Cornerstone.js properly
// This is a placeholder that demonstrates the structure

export interface CornerstoneImage {
  id: string;
  instanceNumber: number;
  filename: string;
  seriesDescription: string;
  windowCenter: number;
  windowWidth: number;
  sliceThickness?: string;
  pixelData?: ImageData;
  rescaleSlope?: number;
  rescaleIntercept?: number;
}

declare global {
  interface Window {
    cornerstone?: any;
    dicomParser?: any;
  }
}

export interface ViewerState {
  currentImage: number;
  zoom: number;
  pan: { x: number; y: number };
  windowCenter: number;
  windowWidth: number;
  rotation: number;
  isFlipped: boolean;
}

export const defaultViewerState: ViewerState = {
  currentImage: 0,
  zoom: 1,
  pan: { x: 0, y: 0 },
  windowCenter: 40,
  windowWidth: 400,
  rotation: 0,
  isFlipped: false,
};

// Mock DICOM image data generator
export function generateMockDICOMImage(
  instanceNumber: number,
  seriesDescription: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Create a grayscale gradient to simulate DICOM image
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#4a4a6a');
  gradient.addColorStop(1, '#2a2a4e');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Add some patterns to simulate medical image
  ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
  ctx.beginPath();
  ctx.arc(
    256 + Math.sin(instanceNumber) * 50,
    256 + Math.cos(instanceNumber) * 50,
    100 - instanceNumber,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Add text label
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText(`Image ${instanceNumber}/${seriesDescription}`, 10, 30);
  ctx.fillText(`Window: W:${400} C:${40}`, 10, 510);

  return canvas;
}

// Cornerstone window/level presets for different imaging modalities
export const windowPresets = {
  mri: {
    brain: { windowCenter: 40, windowWidth: 80 },
    default: { windowCenter: 128, windowWidth: 256 },
  },
  ct: {
    brain: { windowCenter: 40, windowWidth: 80 },
    lung: { windowCenter: -400, windowWidth: 1500 },
    bone: { windowCenter: 300, windowWidth: 1500 },
    abdomen: { windowCenter: 40, windowWidth: 400 },
  },
  xray: {
    default: { windowCenter: 127, windowWidth: 255 },
  },
  ultrasound: {
    default: { windowCenter: 128, windowWidth: 256 },
  },
};

export function getWindowPreset(modality: string, preset: string = 'default') {
  const modalityLower = modality.toLowerCase() as keyof typeof windowPresets;
  const presets = windowPresets[modalityLower] || windowPresets.xray;
  return presets[preset as keyof typeof presets] || presets.default;
}

// Load DICOM files (demo fallback): if `dicomParser` is available, parse, else create mock pixel data.
export async function loadDicomFiles(files: FileList | File[]): Promise<CornerstoneImage[]> {
  const selected = Array.from(files as File[] | FileList);
  const loaded: CornerstoneImage[] = [];

  for (let i = 0; i < selected.length; i++) {
    const file = selected[i];
    const id = `dicom-${Date.now()}-${i}-${file.name}`;
    const seriesDescription = `Imported ${file.name}`;
    let pixelData: ImageData | undefined;

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8ClampedArray(buffer);
      const edge = Math.floor(Math.sqrt(bytes.length / 4)) || 256;
      const size = edge * edge;
      const imageData = new ImageData(edge, edge);
      for (let p = 0; p < size; p++) {
        const value = bytes[p * 4] ?? 128;
        const idx = p * 4;
        imageData.data[idx] = value;
        imageData.data[idx + 1] = value;
        imageData.data[idx + 2] = value;
        imageData.data[idx + 3] = 255;
      }
      pixelData = imageData;
    } catch (error) {
      // fallback mock
      pixelData = undefined;
    }

    loaded.push({
      id,
      instanceNumber: i + 1,
      filename: file.name,
      seriesDescription,
      windowCenter: 40,
      windowWidth: 400,
      rescaleSlope: 1,
      rescaleIntercept: -1024,
      pixelData,
    });
  }

  return loaded;
}

