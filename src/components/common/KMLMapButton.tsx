'use client';

import React, { useCallback, useMemo } from 'react';

interface KMLMapButtonProps {
	kmlFile?: string; // e.g. "/kml/Harankhuri CFR.kml" or "Harankhuri CFR.kml"
	title?: string;
	className?: string;
}

const KMLMapButton: React.FC<KMLMapButtonProps> = ({
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

		// Create a blob URL with the HTML content
		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KML Viewer - ${kmlFile}</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .header { 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            z-index: 1000; 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            padding: 10px 20px; 
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { margin: 0; font-size: 16px; font-weight: 600; color: #374151; }
        .area-info { 
            background: #f3f4f6; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 14px; 
            color: #6b7280;
        }
        .close-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
        }
        .close-btn:hover { background: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <h1>KML Viewer: ${kmlFile}</h1>
        <div style="display: flex; align-items: center;">
            <div id="areaInfo" class="area-info" style="display: none;">Area: <span id="areaValue">0</span> km²</div>
            <button class="close-btn" onclick="window.close()">Close</button>
        </div>
    </div>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
    <script>
        // Fix Leaflet icon paths
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Initialize map
        const map = L.map('map', {
            center: [20.5937, 78.9629],
            zoom: 5,
            minZoom: 3,
            maxZoom: 22,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
        });

        // Add satellite layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 22,
            maxNativeZoom: 19,
            noWrap: true,
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }).addTo(map);

        // Load KML
        const kmlUrl = '${kmlUrl}';
        const kmlLayer = omnivore.kml(kmlUrl);

        kmlLayer.on('ready', function() {
            kmlLayer.addTo(map);
            
            // Fit bounds to KML
            try {
                const bounds = kmlLayer.getBounds();
                if (bounds && bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [20, 20] });
                }
            } catch (e) {
                console.log('Could not fit bounds:', e);
            }

            // Calculate area
            try {
                let totalArea = 0;
                
                function calculateArea(layer) {
                    if (layer.getLatLngs) {
                        const latlngs = layer.getLatLngs();
                        if (Array.isArray(latlngs) && latlngs.length > 0) {
                            if (Array.isArray(latlngs[0])) {
                                // MultiPolygon or Polygon with holes
                                latlngs.forEach(ring => {
                                    if (Array.isArray(ring) && ring.length > 0) {
                                        totalArea += calculateRingArea(ring);
                                    }
                                });
                            } else {
                                // Simple polygon
                                totalArea += calculateRingArea(latlngs);
                            }
                        }
                    }
                    if (layer.eachLayer) {
                        layer.eachLayer(calculateArea);
                    }
                }

                function calculateRingArea(ring) {
                    if (ring.length < 3) return 0;
                    
                    const R = 6371000; // Earth radius in meters
                    let area = 0;
                    
                    for (let i = 0; i < ring.length - 1; i++) {
                        const lat1 = (ring[i].lat * Math.PI) / 180;
                        const lat2 = (ring[i + 1].lat * Math.PI) / 180;
                        const dLng = ((ring[i + 1].lng - ring[i].lng) * Math.PI) / 180;
                        area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
                    }
                    
                    return Math.abs((area * R * R) / 2) / 1000000; // Convert to km²
                }

                calculateArea(kmlLayer);
                
                if (totalArea > 0) {
                    document.getElementById('areaValue').textContent = totalArea.toFixed(3);
                    document.getElementById('areaInfo').style.display = 'block';
                }
            } catch (e) {
                console.log('Could not calculate area:', e);
            }
        });

        kmlLayer.on('error', function(e) {
            console.error('KML loading error:', e);
            alert('Error loading KML file. Please check the file path and try again.');
        });
    </script>
</body>
</html>`;

		// Create blob and open in new tab
		const blob = new Blob([htmlContent], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
		
		// Clean up the URL after a delay
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

export default KMLMapButton;