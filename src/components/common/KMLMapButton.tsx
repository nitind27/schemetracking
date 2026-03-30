'use client';

import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';

interface KMLMapProps {
  kmlFile?: string;
  title?: string;
  className?: string;
}

// Type definitions for Leaflet and Omnivore
interface LeafletMap {
  removeLayer: (layer: unknown) => void;
  remove: () => void;
  fitBounds: (bounds: unknown, options?: { padding: number[] }) => void;
}

interface LeafletIcon {
  Default: {
    prototype: {
      _getIconUrl?: string; // Made optional to fix delete error
    };
    mergeOptions: (options: {
      iconRetinaUrl: string;
      iconUrl: string;
      shadowUrl: string;
    }) => void;
  };
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => void;
}

interface Leaflet {
  map: (element: HTMLElement, options: {
    center: [number, number];
    zoom: number;
    minZoom: number;
    maxZoom: number;
    zoomSnap: number;
    zoomDelta: number;
  }) => LeafletMap;
  tileLayer: (url: string, options: {
    maxZoom: number;
    maxNativeZoom: number;
    noWrap: boolean;
    attribution: string;
  }) => LeafletTileLayer;
  Icon: LeafletIcon;
}

interface Omnivore {
  kml: (url: string) => {
    on: (event: string, callback: (error?: Error) => void) => void;
    addTo: (map: LeafletMap) => void;
    getBounds?: () => { isValid: () => boolean };
  };
}

// Global window interface with proper typing
declare global {
  interface Window {
    L?: Leaflet;
    omnivore?: Omnivore;
  }
}

let leafletLoaded = false;
let omnivoreLoaded = false;

const loadScript = (src: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

const ensureLeafletAssets = async (): Promise<void> => {
  if (!document.querySelector('link[data-leaflet-css="1"]')) {
    const l = document.createElement('link');
    l.setAttribute('rel', 'stylesheet');
    l.setAttribute('href', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    l.setAttribute('data-leaflet-css', '1');
    document.head.appendChild(l);
  }
  if (!leafletLoaded) {
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    leafletLoaded = true;
  }
  if (!omnivoreLoaded) {
    await loadScript('https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js');
    omnivoreLoaded = true;
  }
};

const KMLMap: React.FC<KMLMapProps> = ({
  kmlFile,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const kmlLayerRef = useRef<ReturnType<Omnivore['kml']> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolveApiUrl = useCallback((file: string): string => {
    let p = file.trim();
    p = p.replace(/^\/public\//, '');
    p = p.replace(/^\/?kml\//, '');
    p = p.replace(/^\//, '');
    const encoded = p.split('/').map(encodeURIComponent).join('/');
    if (typeof window === 'undefined') return `/api/kml/${encoded}`;
    return `${window.location.origin}/api/kml/${encoded}`;
  }, []);

  const kmlUrl = useMemo((): string | null => {
    if (!kmlFile) return null;
    if (kmlFile.startsWith('http')) return kmlFile;
    return resolveApiUrl(kmlFile);
  }, [kmlFile, resolveApiUrl]);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      try {
        if (kmlLayerRef.current && leafletMapRef.current) {
          leafletMapRef.current.removeLayer(kmlLayerRef.current);
        }
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }
      } catch {
        // Ignore cleanup errors
      }
      kmlLayerRef.current = null;
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const initMap = async (): Promise<void> => {
      if (!mapRef.current || !kmlUrl) return;

      setIsLoading(true);
      await ensureLeafletAssets();

      // Safe type checking for window properties
      const L = window.L;
      if (!L) {
        console.error('Leaflet not loaded');
        setIsLoading(false);
        return;
      }
      // Fix icon URLs with proper type checking
      if ('_getIconUrl' in L.Icon.Default.prototype) {
        delete L.Icon.Default.prototype._getIconUrl;
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
        maxZoom: 22,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
      });
      leafletMapRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 22,
        maxNativeZoom: 19,
        noWrap: true,
        attribution: 'Tiles © Esri',
      }).addTo(map);

      // Safe type checking for omnivore
      const omnivore = window.omnivore;
      if (!omnivore) {
        console.error('Omnivore not loaded');
        setIsLoading(false);
        return;
      }

      const kml = omnivore.kml(kmlUrl);
      kmlLayerRef.current = kml;

      kml.on('ready', function () {
        kml.addTo(map);
        try {
          const bounds = kml.getBounds?.();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch {
          // Ignore bounds errors
        }
        setIsLoading(false);
      });

      kml.on('error', function (error?: Error) {
        console.error('KML loading error:', error);
        alert('Error loading KML file. Please check the file path and try again.');
        setIsLoading(false);
      });
    };

    initMap();
  }, [kmlUrl]);

  if (!kmlFile) return null;

  return (
    <div className={`relative w-full h-[500px] ${className}`}>
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="truncate text-sm text-gray-700">{kmlFile}</div>
        <div className="text-xs text-gray-500">Satellite</div>
      </div>
      <div className="absolute inset-0 pt-10">
        <div ref={mapRef} className="w-full h-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};

export default KMLMap;