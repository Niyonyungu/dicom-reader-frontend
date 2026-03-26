import { describe, it, expect } from 'vitest';
import { calculateHU, categorizeHU, calculateROIStatistics, Point } from './measurement-utils';

describe('measurement-utils', () => {
  it('calculateHU should apply slope and intercept', () => {
    expect(calculateHU(100, 1.5, -1024)).toBeCloseTo(100 * 1.5 - 1024);
  });

  it('categorizeHU should categorize based on thresholds', () => {
    expect(categorizeHU(-1100)).toBe('Air');
    expect(categorizeHU(-300)).toBe('Lung');
    expect(categorizeHU(-50)).toBe('Fat');
    expect(categorizeHU(20)).toBe('Water/CSF');
    expect(categorizeHU(100)).toBe('Soft Tissue');
    expect(categorizeHU(600)).toBe('Bone');
    expect(categorizeHU(1200)).toBe('Metal/Unknown');
  });

  it('calculateROIStatistics should compute ROI stats', () => {
    const width = 4;
    const height = 4;
    const imageData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const value = i * 10;
      imageData.data[i * 4] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }

    const roi: Point[] = [
      { x: 0.25, y: 0.25 },
      { x: 0.75, y: 0.25 },
      { x: 0.75, y: 0.75 },
      { x: 0.25, y: 0.75 },
    ];

    const stats = calculateROIStatistics(imageData, roi, width, height);

    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.pixelCount).toBeGreaterThan(0);
      expect(stats.min).toBeGreaterThanOrEqual(0);
      expect(stats.max).toBeLessThanOrEqual(255);
    }
  });
});

