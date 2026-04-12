/**
 * Instances Service
 * Handles DICOM instance viewing and rendering operations
 * 
 * Endpoints:
 * - GET /instances/{id} — get instance metadata
 * - GET /instances/{id}/image — render instance with parameters
 * - GET /instances/{id}/info — get DICOM tag list
 * - GET /instances/{id}/dicom — download original DICOM file
 * 
 * Permission requirements:
 * - instance.read (for GET operations)
 */

import {
  DicomInstance,
  DicomInfo,
  RenderParams,
  InstanceImageResponse,
} from "@/types/clinical-api";
import { getAccessToken } from "@/lib/token-storage";
import { parseApiError } from "@/lib/api-errors";
import { get, request } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_ROOT = `${BASE_URL}/api/v1`;

/**
 * Get instance metadata
 * 
 * @param instanceId - The instance ID
 * @returns DicomInstance with metadata
 * @throws ApiError on failure (403 if missing instance.read permission)
 * 
 * @example
 * ```ts
 * const instance = await instancesService.getInstance(123);
 * console.log(`Instance: ${instance.instance_uid}`);
 * ```
 */
export async function getInstance(instanceId: number): Promise<DicomInstance> {
  const token = getAccessToken();

  return get<DicomInstance>(`/instances/${instanceId}`, {
    authToken: token || undefined,
  });
}

/**
 * Get rendered image URL with optional parameters
 * 
 * Constructs a URL to the rendering endpoint with query parameters for:
 * - Window/level presets or custom HU values
 * - Zoom, rotation, flipping
 * - Image format and filters
 * 
 * @param instanceId - The instance ID
 * @param params - Rendering parameters (all optional, defaults used server-side)
 * @returns Object with rendered image URL and ETag for caching
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * // Quick lung preset
 * const { url } = await instancesService.getInstanceImageUrl(123, {
 *   preset: 'lung',
 *   zoom: 1.5,
 *   format: 'png'
 * });
 * 
 * // Custom window/level
 * const { url } = await instancesService.getInstanceImageUrl(123, {
 *   window_center: 40,
 *   window_width: 400,
 *   rotate: 90,
 *   flip_horizontal: true
 * });
 * ```
 */
export async function getInstanceImageUrl(
  instanceId: number,
  params: RenderParams = {}
): Promise<InstanceImageResponse> {
  const token = getAccessToken();

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (params.format) queryParams.append("format", params.format);
  if (params.preset) queryParams.append("preset", params.preset);
  if (params.window_center !== undefined) queryParams.append("window_center", params.window_center.toString());
  if (params.window_width !== undefined) queryParams.append("window_width", params.window_width.toString());
  if (params.zoom !== undefined) queryParams.append("zoom", params.zoom.toString());
  if (params.rotate !== undefined) queryParams.append("rotate", params.rotate.toString());
  if (params.flip_horizontal) queryParams.append("flip_horizontal", "true");
  if (params.flip_vertical) queryParams.append("flip_vertical", "true");
  if (params.filter && params.filter !== "none") queryParams.append("filter", params.filter);

  const url = `${API_ROOT}/instances/${instanceId}/image?${queryParams.toString()}`;

  try {
    // In this case, we're returning the URL for standard <img> tag usage.
    // We'll skip the HEAD request for ETag and just return the constructed URL.
    return {
      url,
      format: params.format || "png",
      cache_key: `instance_${instanceId}`,
    };
  } catch (error) {
    return {
      url,
      format: params.format || "png",
      cache_key: `instance_${instanceId}`,
    };
  }
}

/**
 * Get rendered image data (blob) for direct use
 * 
 * Fetches the rendered image as binary data. Useful for canvas operations
 * or offline storage.
 * 
 * @param instanceId - The instance ID
 * @param params - Rendering parameters
 * @returns Image blob
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * const blob = await instancesService.getInstanceImageBlob(123, {
 *   preset: 'bone',
 *   zoom: 2.0
 * });
 * const objUrl = URL.createObjectURL(blob);
 * imgElement.src = objUrl;
 * ```
 */
export async function getInstanceImageBlob(
  instanceId: number,
  params: RenderParams = {}
): Promise<Blob> {
  const token = getAccessToken();

  const queryParams = new URLSearchParams();
  
  if (params.format) queryParams.append("format", params.format);
  if (params.preset) queryParams.append("preset", params.preset);
  if (params.window_center !== undefined) queryParams.append("window_center", params.window_center.toString());
  if (params.window_width !== undefined) queryParams.append("window_width", params.window_width.toString());
  if (params.zoom !== undefined) queryParams.append("zoom", params.zoom.toString());
  if (params.rotate !== undefined) queryParams.append("rotate", params.rotate.toString());
  if (params.flip_horizontal) queryParams.append("flip_horizontal", "true");
  if (params.flip_vertical) queryParams.append("flip_vertical", "true");
  if (params.filter && params.filter !== "none") queryParams.append("filter", params.filter);

  return request<Blob>("GET", `/instances/${instanceId}/image?${queryParams.toString()}`, {
    authToken: token || undefined,
    responseType: "blob",
  });
}

/**
 * Get DICOM tags and clinical information for an instance
 * 
 * Returns parsed DICOM tags in an easy-to-read format including
 * clinical metadata like patient info, study parameters, etc.
 * 
 * @param instanceId - The instance ID
 * @returns DicomInfo with tags and clinical metadata
 * @throws ApiError on failure (403 if missing instance.read permission)
 * 
 * @example
 * ```ts
 * const info = await instancesService.getInstanceInfo(123);
 * console.log(`Patient: ${info.patient_name}`);
 * console.log(`Total tags: ${info.tags.length}`);
 * 
 * // Find specific tag
 * const birthDateTag = info.tags.find(t => t.tag === '0010,0030');
 * console.log(`Birth Date: ${birthDateTag?.value}`);
 * ```
 */
export async function getInstanceInfo(instanceId: number): Promise<DicomInfo> {
  const token = getAccessToken();

  return get<DicomInfo>(`/instances/${instanceId}/info`, {
    authToken: token || undefined,
  });
}

/**
 * Download the original DICOM file (.dcm)
 * 
 * Triggers a browser download of the raw DICOM file. Use for
 * external analysis or archival.
 * 
 * @param instanceId - The instance ID
 * @param filename - Optional custom filename (defaults to instance_uid.dcm)
 * @throws ApiError on failure
 * 
 * @example
 * ```ts
 * await instancesService.downloadInstance(123);
 * // Browser will trigger download of the .dcm file
 * 
 * // With custom name
 * await instancesService.downloadInstance(123, 'patient_chest_ct.dcm');
 * ```
 */
export async function downloadInstance(
  instanceId: number,
  filename?: string
): Promise<void> {
  const token = getAccessToken();

  try {
    const blob = await request<Blob>("GET", `/instances/${instanceId}/dicom`, {
      authToken: token || undefined,
      responseType: "blob",
    });

    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || `instance_${instanceId}.dcm`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw parseApiError(error);
  }
}

// ============================================================================
// IMAGE CACHING UTILITY
// ============================================================================

/**
 * Client-side ETag-based cache for rendered images
 * 
 * Stores rendered image URLs and their ETags to avoid re-rendering
 * identical images when parameters haven't changed.
 */
class ImageCache {
  private cache = new Map<string, { url: string; etag?: string }>();
  private maxSize = 50; // Max cached images

  set(key: string, url: string, etag?: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { url, etag });
  }

  get(key: string): { url: string; etag?: string } | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const imageCache = new ImageCache();

/**
 * Get render preset window/level values
 * 
 * @param preset - Preset name
 * @returns { window_center, window_width } for the preset
 */
export function getPresetValues(preset: 'lung' | 'bone' | 'brain' | 'mediastinum'): {
  window_center: number;
  window_width: number;
} {
  const presets: Record<string, { window_center: number; window_width: number }> = {
    lung: { window_center: -500, window_width: 1500 },      // HU range: -1250 to 250
    bone: { window_center: 500, window_width: 2000 },       // HU range: 0 to 1000
    brain: { window_center: 40, window_width: 400 },        // HU range: -160 to 240
    mediastinum: { window_center: 40, window_width: 350 },  // HU range: -135 to 215
  };

  return presets[preset] || presets.lung;
}

// Export service as object for convenience
export const instancesService = {
  getInstance,
  getInstanceImageUrl,
  getInstanceImageBlob,
  getInstanceInfo,
  downloadInstance,
};

export default instancesService;
