/// <reference lib="webworker" />

/**
 * Service Worker for DICOM Viewer - Offline Capability
 * Enables caching, offline browsing, and background sync
 */

const CACHE_VERSION = 'dicom-viewer-v1';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

const URLS_TO_CACHE = [
  '/',
  '/layout.tsx',
  '/page.tsx',
  '/dashboard/layout.tsx',
  '/dashboard/page.tsx',
];

const API_ENDPOINTS_TO_CACHE = [
  '/api/studies',
  '/api/patients',
  '/api/worklist',
];

// Install event - cache essential files
(self as any).addEventListener('install', (event: any) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.addAll(URLS_TO_CACHE);
      console.log('[Service Worker] Files cached');
      (self as any).skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
(self as any).addEventListener('activate', (event: any) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith(CACHE_VERSION) && cacheName !== RUNTIME_CACHE) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
      await (self as any).clients.claim();
      console.log('[Service Worker] Ready to handle requests');
    })()
  );
});

// Fetch event - implement caching strategies
(self as any).addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Image/media files - Cache first, fallback to network
  if (isMediaFile(request.url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGES_CACHE));
    return;
  }

  // HTML/JS/CSS - Stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
});

// Strategies
async function networkFirstStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({
        error: 'Offline: Resource not available',
        cached: false,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Resource not found', { status: 404 });
  }
}

async function staleWhileRevalidateStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

// Helper function to detect media files
function isMediaFile(url: string): boolean {
  const mediaExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.mp4', '.webm', '.ogg',
    '.woff', '.woff2', '.ttf',
  ];
  const urlLower = url.toLowerCase();
  return mediaExtensions.some(ext => urlLower.includes(ext));
}

// Background sync for audit logs
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-audit-logs') {
    event.waitUntil(syncAuditLogs());
  }
});

async function syncAuditLogs(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const pendingLogs = await getAllPendingLogs(db);

    for (const log of pendingLogs) {
      try {
        const response = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
        });

        if (response.ok) {
          await markLogAsSynced(db, log.id);
        }
      } catch (error) {
        console.error('Failed to sync audit log:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dicom-viewer-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('audiLogs')) {
        db.createObjectStore('auditLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('measurements')) {
        db.createObjectStore('measurements', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offlineImages')) {
        db.createObjectStore('offlineImages', { keyPath: 'id' });
      }
    };
  });
}

async function getAllPendingLogs(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['auditLogs'], 'readonly');
    const store = transaction.objectStore('auditLogs');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.filter((log: any) => !log.synced));
  });
}

async function markLogAsSynced(db: IDBDatabase, logId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['auditLogs'], 'readwrite');
    const store = transaction.objectStore('auditLogs');
    const request = store.get(logId);

    request.onsuccess = () => {
      const log = request.result;
      log.synced = true;
      store.put(log);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

// Message handler for communication with client
(self as any).addEventListener('message', (event: any) => {
  if (event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }

  if (event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }
});

async function getCacheStats(): Promise<any> {
  const cacheNames = await caches.keys();
  const stats: any = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = {
      count: keys.length,
      urls: keys.map(k => k.url),
    };
  }

  return stats;
}

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}
