'use client';

import React, { useCallback, useMemo } from 'react';

interface KMLMapButtonProps {
	kmlFile?: string;
	title?: string;
	className?: string;
}

const KMLMapdata: React.FC<KMLMapButtonProps> = ({
	kmlFile,
	title = 'View KML on Map',
	className = '',
}) => {
	const isDisabled = !kmlFile;

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

	const handleMapClick = () => {
		if (!kmlFile || !kmlUrl) return;

		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KML Viewer</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; }
        #map { height: 100vh; width: 100vw; }
        .header {
            position: absolute; top: 0; left: 0; right: 0; z-index: 1000;
            background: rgba(15,23,42,0.92); backdrop-filter: blur(12px);
            padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between; align-items: center; gap: 10px;
        }
        .header h1 { margin: 0; font-size: 14px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
        .header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .area-badge {
            background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);
            color: #86efac; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
            display: none;
        }
        .close-btn {
            background: #ef4444; color: white; border: none;
            padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
        }
        .close-btn:hover { background: #dc2626; }

        /* Loading overlay */
        #loadingOverlay {
            position: absolute; inset: 0; z-index: 2000;
            background: rgba(15,23,42,0.85); backdrop-filter: blur(4px);
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
        }
        .spinner {
            width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #3b82f6; border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #94a3b8; font-size: 14px; }

        /* Error / No data overlay */
        #errorOverlay {
            position: absolute; inset: 0; z-index: 2000;
            background: rgba(15,23,42,0.9); backdrop-filter: blur(4px);
            display: none; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        }
        .error-icon { font-size: 48px; }
        .error-title { color: #f1f5f9; font-size: 18px; font-weight: 600; }
        .error-msg { color: #94a3b8; font-size: 13px; text-align: center; max-width: 320px; line-height: 1.5; }
        .retry-btn {
            margin-top: 8px; background: #3b82f6; color: white; border: none;
            padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;
        }
        .retry-btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📍 ${kmlFile}</h1>
        <div class="header-right">
            <div id="areaBadge" class="area-badge">Area: <span id="areaValue">0</span> km²</div>
            <button class="close-btn" onclick="window.close()">✕ Close</button>
        </div>
    </div>

    <div id="map"></div>

    <div id="loadingOverlay">
        <div class="spinner"></div>
        <div class="loading-text">Loading KML data...</div>
    </div>

    <div id="errorOverlay">
        <div class="error-icon">🗺️</div>
        <div class="error-title">Map Data Not Available</div>
        <div class="error-msg" id="errorMsg">The KML file could not be loaded. The file may be missing or inaccessible.</div>
        <button class="retry-btn" onclick="retryLoad()">↺ Retry</button>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
    <script>
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map('map', {
            center: [20.5937, 78.9629],
            zoom: 5,
            minZoom: 3,
            maxZoom: 22,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
        });

        const MAPBOX_TOKEN = '${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}';

        // Satellite layer
        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=' + MAPBOX_TOKEN, {
            maxZoom: 22,
            tileSize: 512,
            zoomOffset: -1,
            noWrap: true,
            attribution: '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const kmlUrl = '${kmlUrl}';
        let kmlLayer = null;

        function showLoading() {
            document.getElementById('loadingOverlay').style.display = 'flex';
            document.getElementById('errorOverlay').style.display = 'none';
        }

        function hideLoading() {
            document.getElementById('loadingOverlay').style.display = 'none';
        }

        function showError(msg) {
            hideLoading();
            document.getElementById('errorMsg').textContent = msg || 'The KML file could not be loaded.';
            document.getElementById('errorOverlay').style.display = 'flex';
        }

        function loadKML() {
            showLoading();
            if (kmlLayer) { map.removeLayer(kmlLayer); kmlLayer = null; }

            // Timeout fallback — if KML doesn't load in 15s show error
            const timeout = setTimeout(() => {
                showError('KML file took too long to load. The file may be missing or the server is unavailable.');
            }, 15000);

            kmlLayer = omnivore.kml(kmlUrl);

            kmlLayer.on('ready', function() {
                clearTimeout(timeout);
                hideLoading();

                try {
                    const bounds = kmlLayer.getBounds();
                    if (bounds && bounds.isValid()) {
                        kmlLayer.addTo(map);
                        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
                    } else {
                        // Layer loaded but has no geometry
                        showError('KML file loaded but contains no map geometry or boundary data.');
                        return;
                    }
                } catch(e) {
                    showError('KML file loaded but could not render map boundaries.');
                    return;
                }

                // Calculate area
                try {
                    let totalArea = 0;
                    function calcArea(layer) {
                        if (layer.getLatLngs) {
                            const ll = layer.getLatLngs();
                            const flat = Array.isArray(ll[0]) ? ll.flat(2) : ll;
                            if (flat.length >= 3) {
                                const R = 6371000;
                                let a = 0;
                                for (let i = 0; i < flat.length - 1; i++) {
                                    const lat1 = flat[i].lat * Math.PI / 180;
                                    const lat2 = flat[i+1].lat * Math.PI / 180;
                                    const dLng = (flat[i+1].lng - flat[i].lng) * Math.PI / 180;
                                    a += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
                                }
                                totalArea += Math.abs(a * R * R / 2) / 1e6;
                            }
                        }
                        if (layer.eachLayer) layer.eachLayer(calcArea);
                    }
                    calcArea(kmlLayer);
                    if (totalArea > 0) {
                        document.getElementById('areaValue').textContent = totalArea.toFixed(3);
                        document.getElementById('areaBadge').style.display = 'block';
                    }
                } catch(e) {}
            });

            kmlLayer.on('error', function(e) {
                clearTimeout(timeout);
                console.error('KML error:', e);
                showError('KML file not found or could not be loaded. Please check if the file exists on the server.');
            });
        }

        function retryLoad() { loadKML(); }

        loadKML();
    </script>
</body>
</html>`;

		const blob = new Blob([htmlContent], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	return (
		<button
			onClick={handleMapClick}
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
	);
};

export default KMLMapdata;
