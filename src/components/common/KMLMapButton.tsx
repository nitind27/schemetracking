'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomModel from '@/common/CustomModel';

interface KMLMapButtonProps {
	kmlFile?: string; // e.g. "/kml/Harankhuri CFR.kml" or "Harankhuri CFR.kml"
	title?: string;
	className?: string;
}

let leafletLoaded = false;
let omnivoreLoaded = false;

const loadScript = (src: string) =>
	new Promise<void>((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) return resolve();
		const s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.onload = () => resolve();
		s.onerror = () => reject(new Error(`Failed to load ${src}`));
		document.head.appendChild(s);
	});

const ensureLeafletAssets = async () => {
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

const KMLMapButton: React.FC<KMLMapButtonProps> = ({
	kmlFile,
	title = 'View KML on Map',
	className = '',
}) => {
	const isDisabled = !kmlFile;
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const mapRef = useRef<HTMLDivElement | null>(null);
	const leafletMapRef = useRef<any>(null);
	const kmlLayerRef = useRef<any>(null);

	const resolveApiUrl = useCallback((file: string) => {
		let p = file.trim();
		p = p.replace(/^\/public\//, '');
		p = p.replace(/^\/?kml\//, '');
		p = p.replace(/^\//, '');
		const encoded = p.split('/').map(encodeURIComponent).join('/');
		if (typeof window === 'undefined') return `/api/kml/${encoded}`;
		return `${window.location.origin}/api/kml/${encoded}`;
	}, []);

	const kmlUrl = useMemo(() => {
		if (!kmlFile) return null;
		if (kmlFile.startsWith('http')) return kmlFile;
		return resolveApiUrl(kmlFile);
	}, [kmlFile, resolveApiUrl]);

	const handleOpen = async () => {
		if (isDisabled) return;
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
		try {
			if (kmlLayerRef.current && leafletMapRef.current) {
				leafletMapRef.current.removeLayer(kmlLayerRef.current);
			}
			if (leafletMapRef.current) {
				leafletMapRef.current.remove();
			}
		} catch {}
		kmlLayerRef.current = null;
		leafletMapRef.current = null;
		setIsLoading(false);
	};

	useEffect(() => {
		const initMap = async () => {
			if (!isOpen || !mapRef.current || !kmlUrl) return;

			setIsLoading(true);
			await ensureLeafletAssets();

			// @ts-ignore
			const L = (window as any).L;
			// @ts-ignore
			delete L.Icon.Default.prototype._getIconUrl;
			// @ts-ignore
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			});

			// @ts-ignore
			const map = L.map(mapRef.current, {
				center: [20.5937, 78.9629],
				zoom: 5,
				minZoom: 3,
				maxZoom: 22,
				zoomSnap: 0.5,
				zoomDelta: 0.5,
			});
			leafletMapRef.current = map;

			// @ts-ignore
			L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
				maxZoom: 22,
				maxNativeZoom: 19,
				noWrap: true,
				attribution: 'Tiles © Esri',
			}).addTo(map);

			// @ts-ignore
			const kml = (window as any).omnivore.kml(kmlUrl);
			kmlLayerRef.current = kml;

			kml.on('ready', function () {
				kml.addTo(map);
				try {
					const b = kml.getBounds?.();
					if (b && b.isValid()) map.fitBounds(b, { padding: [20, 20] });
				} catch {}
				setIsLoading(false);
			});

			kml.on('error', function (e: any) {
				console.error('KML loading error:', e);
				alert('Error loading KML file. Please check the file path and try again.');
				setIsLoading(false);
			});
		};

		initMap();
	}, [isOpen, kmlUrl]);

	return (
		<>
			<button
				onClick={handleOpen}
				disabled={isDisabled}
				className={`p-2 rounded-lg transition-all flex items-center justify-center ${
					isDisabled
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-blue-100 hover:bg-blue-200 text-blue-600'
				} ${className}`}
				title={isDisabled ? 'No KML file available' : title}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
				</svg>
			</button>

			<CustomModel
				isOpen={isOpen}
				onClose={handleClose}
				title={title}
				isFullScreen={true}
			>
				<div className="relative w-screen h-screen">
					{/* Optional top info bar; remove if not needed */}
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
			</CustomModel>
		</>
	);
};

export default KMLMapButton;