/**
 * Advanced Measurement Tools for DICOM Viewer
 * Supports angle, distance, area, volume, ROI statistics, and HU measurements
 */

export interface Point {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area' | 'roi' | 'hu';
  points: Point[];
  value: number;
  unit: string;
  imageId: string;
  timestamp: number;
  label: string;
}

export interface ROIStatistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  area: number;
  pixelCount: number;
}

export interface AngleMeasurement {
  angle: number; // in degrees
  point1: Point;
  vertex: Point;
  point2: Point;
}

// Calculate distance between two points
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate angle between three points (in degrees)
export function calculateAngle(p1: Point, vertex: Point, p2: Point): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

  return (angleRad * 180) / Math.PI;
}

// Calculate area of a polygon (Shoelace formula)
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }

  return Math.abs(area / 2);
}

// Calculate ROI statistics from image data
export function calculateROIStatistics(
  imageData: ImageData,
  roiPoints: Point[],
  canvasWidth: number,
  canvasHeight: number
): ROIStatistics | null {
  if (roiPoints.length < 3) return null;

  const data = imageData.data;
  const pixelValues: number[] = [];

  // Simple bounding box approach for now
  const minX = Math.max(0, Math.floor(Math.min(...roiPoints.map(p => p.x * canvasWidth))));
  const maxX = Math.min(canvasWidth, Math.ceil(Math.max(...roiPoints.map(p => p.x * canvasWidth))));
  const minY = Math.max(0, Math.floor(Math.min(...roiPoints.map(p => p.y * canvasHeight))));
  const maxY = Math.min(canvasHeight, Math.ceil(Math.max(...roiPoints.map(p => p.y * canvasHeight))));

  // Point-in-polygon test (simplified)
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (isPointInPolygon({ x: x / canvasWidth, y: y / canvasHeight }, roiPoints)) {
        const pixelIndex = (y * canvasWidth + x) * 4;
        // Average RGB for grayscale
        const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        pixelValues.push(gray);
      }
    }
  }

  if (pixelValues.length === 0) return null;

  const mean = pixelValues.reduce((a, b) => a + b) / pixelValues.length;
  const variance = pixelValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixelValues.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...pixelValues);
  const max = Math.max(...pixelValues);
  const area = calculatePolygonArea(roiPoints);

  return {
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    min: Math.round(min),
    max: Math.round(max),
    area: Math.round(area * 100) / 100,
    pixelCount: pixelValues.length,
  };
}

// Point-in-polygon test using ray casting algorithm
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Hounsfield Unit (HU) calculation from pixel values
export function calculateHU(pixelValue: number, rescaleSlope: number = 1, rescaleIntercept: number = 0): number {
  return pixelValue * rescaleSlope + rescaleIntercept;
}

// HU value categorization for tissues
export function categorizeHU(hu: number): string {
  if (hu < -1024) return 'Air';
  if (hu < -500) return 'Lung';
  if (hu < -100) return 'Fat';
  if (hu < 0) return 'Water/CSF';
  if (hu < 50) return 'Soft Tissue';
  if (hu < 300) return 'Contrast';
  if (hu < 1024) return 'Bone';
  return 'Metal/Unknown';
}

// 3D Volume calculation from multiple slices
export function calculateVolume(
  sliceAreas: number[],
  sliceThickness: number,
  pixelSpacing: number = 1
): number {
  if (sliceAreas.length === 0) return 0;

  // Simple integration: sum of areas * slice thickness
  const totalArea = sliceAreas.reduce((a, b) => a + b, 0);
  const volume = totalArea * sliceThickness * pixelSpacing * pixelSpacing;

  return Math.round(volume * 100) / 100;
}

// Generate unique measurement ID
export function generateMeasurementId(): string {
  return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format measurement for display
export function formatMeasurement(measurement: Measurement): string {
  let display = `${measurement.label}: ${measurement.value.toFixed(2)} ${measurement.unit}`;

  switch (measurement.type) {
    case 'angle':
      display += ' (angle)';
      break;
    case 'area':
      display += ' (area)';
      break;
    case 'roi':
      display += ' (ROI)';
      break;
    case 'hu':
      display += ` - ${categorizeHU(measurement.value)}`;
      break;
  }

  return display;
}

// Ellipse area for approximate circular/elliptical ROI
export function calculateEllipseArea(p1: Point, p2: Point): number {
  const a = Math.abs(p2.x - p1.x) / 2;
  const b = Math.abs(p2.y - p1.y) / 2;
  return Math.PI * a * b;
}

// Rectangle area for rectangular ROI
export function calculateRectangleArea(p1: Point, p2: Point): number {
  return Math.abs(p2.x - p1.x) * Math.abs(p2.y - p1.y);
}

// Circle area for circular ROI
export function calculateCircleArea(center: Point, radius: Point): number {
  const r = calculateDistance(center, radius);
  return Math.PI * r * r;
}
