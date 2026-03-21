'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ServiceWorkerStats {
  isOnline: boolean;
  isRegistered: boolean;
  cacheSize: number;
  pendingSyncs: number;
  hasUpdate: boolean;
}

export function useServiceWorker(): ServiceWorkerStats & {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  clearCache: () => Promise<void>;
  syncNow: () => Promise<void>;
} {
  const [stats, setStats] = useState<ServiceWorkerStats>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isRegistered: false,
    cacheSize: 0,
    pendingSyncs: 0,
    hasUpdate: false,
  });

  // Register service worker
  const register = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.ts', {
        scope: '/',
      });

      console.log('[Service Worker] Registered successfully');

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every 60 seconds

      // Listen for new service worker ready
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setStats(prev => ({ ...prev, hasUpdate: true }));
            }
          });
        }
      });

      setStats(prev => ({
        ...prev,
        isRegistered: true,
      }));

      // Get initial cache stats
      await updateCacheStats();
    } catch (error) {
      console.error('[Service Worker] Registration failed:', error);
    }
  }, []);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      setStats(prev => ({
        ...prev,
        isRegistered: false,
      }));
      console.log('[Service Worker] Unregistered');
    } catch (error) {
      console.error('[Service Worker] Unregistration failed:', error);
    }
  }, []);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.postMessage({ type: 'CLEAR_CACHE' });
      }

      setStats(prev => ({
        ...prev,
        cacheSize: 0,
      }));
      console.log('[Cache] Cleared successfully');
    } catch (error) {
      console.error('[Cache] Clear failed:', error);
    }
  }, []);

  // Trigger background sync
  const syncNow = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-audit-logs');
        console.log('[Sync] Background sync registered');
      }
    } catch (error) {
      console.error('[Sync] Failed to trigger sync:', error);
    }
  }, []);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        const channel = new MessageChannel();
        controller.postMessage({ type: 'GET_CACHE_STATS' }, [channel.port2]);

        channel.port1.onmessage = (event) => {
          const cacheStats = event.data;
          let totalSize = 0;

          for (const cacheName in cacheStats) {
            totalSize += cacheStats[cacheName].count * 1024; // Rough estimate
          }

          setStats(prev => ({
            ...prev,
            cacheSize: totalSize,
          }));
        };
      }
    } catch (error) {
      console.error('[Cache Stats] Failed to get stats:', error);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStats(prev => ({ ...prev, isOnline: true }));
      syncNow();
    };

    const handleOffline = () => {
      setStats(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Auto-register on component mount
  useEffect(() => {
    register();
    const statsInterval = setInterval(updateCacheStats, 30000); // Update every 30 seconds

    return () => clearInterval(statsInterval);
  }, [register, updateCacheStats]);

  return {
    ...stats,
    register,
    unregister,
    clearCache,
    syncNow,
  };
}

/**
 * Hook for handling offline-first data operations
 */
export function useOfflineData() {
  const [isOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const storeDataLocally = useCallback(
    async (key: string, data: any): Promise<void> => {
      try {
        // Try IndexedDB first (better for large data)
        const db = await openIndexedDB();
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await new Promise((resolve, reject) => {
          const request = store.put({ key, data, timestamp: Date.now() });
          request.onsuccess = () => resolve(null);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        // Fallback to localStorage
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to store data locally:', e);
        }
      }
    },
    []
  );

  const retrieveLocalData = useCallback(
    async (key: string): Promise<any | null> => {
      try {
        // Try IndexedDB first
        const db = await openIndexedDB();
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        return new Promise((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result?.data || null);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : null;
        } catch (e) {
          console.warn('Failed to retrieve local data:', e);
          return null;
        }
      }
    },
    []
  );

  return {
    isOnline,
    storeDataLocally,
    retrieveLocalData,
  };
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dicom-viewer-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}
