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
	const isBadData = !!kmlFile && !kmlFile.toLowerCase().includes('.kml') && !kmlFile.toLowerCase().includes('.kmz');

	const resolveAbsoluteUrl = useCallback((file: string): string => {
		let p = file.trim();
		p = p.replace(/^\/public\//, '');
		return `${window.location.origin}${p.startsWith('/') ? '' : '/'}${p}`;
	}, []);

	const kmlUrl = useMemo(() => {
		if (!kmlFile) return null;
		if (typeof window === 'undefined') return null;
		if (kmlFile.startsWith('http')) return kmlFile;
		return resolveAbsoluteUrl(kmlFile);
	}, [kmlFile, resolveAbsoluteUrl]);

	const handleMapClick = async () => {
		if (!kmlFile || !kmlUrl) return;

		if (isBadData) {
			alert(`Invalid KML file reference: "${kmlFile}"\n\nThis record has corrupted file data. Please re-upload the KML file for this village.`);
			return;
		}

		let kmlContent = '';
		try {
			const res = await fetch(kmlUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			kmlContent = await res.text();
		} catch (err) {
			console.error('Failed to fetch KML:', err);
			alert(`KML file not found.\n\nExpected at: ${kmlUrl}\n\nPlease re-upload the KML file for this village.`);
			return;
		}

		const kmlJson = JSON.stringify(kmlContent);
		const filenameJson = JSON.stringify(kmlFile);

		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KML Viewer</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e}
#map{height:100vh;width:100vw}
.header{position:absolute;top:0;left:0;right:0;z-index:1000;background:rgba(15,23,42,0.92);backdrop-filter:blur(12px);padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;gap:10px}
.header h1{margin:0;font-size:14px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.header-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.area-badge{background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;display:none}
.close-btn{background:#ef4444;color:white;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500}
.close-btn:hover{background:#dc2626}
#loadingOverlay{position:absolute;inset:0;z-index:2000;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,0.1);border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-text{color:#94a3b8;font-size:14px}
#errorOverlay{position:absolute;inset:0;z-index:2000;background:rgba(15,23,42,0.9);backdrop-filter:blur(4px);display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px}
.error-icon{font-size:48px}
.error-title{color:#f1f5f9;font-size:18px;font-weight:600}
.error-msg{color:#94a3b8;font-size:13px;text-align:center;max-width:320px;line-height:1.5}
</style>
</head>
<body>
<div class="header">
  <h1 id="kmlTitle">📍 Loading...</h1>
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
  <div class="error-msg" id="errorMsg">The KML file could not be rendered.</div>
</div>
<script>
var KML_STRING = ${kmlJson};
var KML_FILENAME = ${filenameJson};

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function showError(msg) {
  document.getElementById('loadingOverlay').style.display = 'none';
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorOverlay').style.display = 'flex';
}

function initMap() {
  document.getElementById('kmlTitle').textContent = '📍 ' + KML_FILENAME;

  if (L.Icon.Default.prototype._getIconUrl) {
    delete L.Icon.Default.prototype._getIconUrl;
  }
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  var map = L.map('map', {
    center: [20.5937, 78.9629], zoom: 5, minZoom: 3, maxZoom: 22, zoomSnap: 0.5, zoomDelta: 0.5,
  });

  // Google satellite — full coverage across India at all zoom levels
  L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 22, maxNativeZoom: 22, noWrap: true, attribution: '© Google',
  }).addTo(map);
  L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
    maxZoom: 22, maxNativeZoom: 22, noWrap: true, opacity: 0.7, attribution: '© Google',
  }).addTo(map);

  // Embed KML as blob — no cross-origin fetch needed from blob page
  var kmlBlob = new Blob([KML_STRING], { type: 'application/vnd.google-earth.kml+xml' });
  var kmlObjectUrl = URL.createObjectURL(kmlBlob);

  var kmlLayer = omnivore.kml(kmlObjectUrl);

  kmlLayer.on('ready', function() {
    URL.revokeObjectURL(kmlObjectUrl);
    document.getElementById('loadingOverlay').style.display = 'none';
    try {
      var bounds = kmlLayer.getBounds();
      if (bounds && bounds.isValid()) {
        kmlLayer.addTo(map);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
      } else {
        showError('KML loaded but contains no map geometry.');
        return;
      }
    } catch(e) {
      showError('KML loaded but could not render boundaries.');
      return;
    }
    try {
      var totalArea = 0;
      function calcArea(layer) {
        if (layer.getLatLngs) {
          var ll = layer.getLatLngs();
          var flat = Array.isArray(ll[0]) ? ll.flat(2) : ll;
          if (flat.length >= 3) {
            var R = 6371000, a = 0;
            for (var i = 0; i < flat.length - 1; i++) {
              var lat1 = flat[i].lat * Math.PI / 180;
              var lat2 = flat[i+1].lat * Math.PI / 180;
              var dLng = (flat[i+1].lng - flat[i].lng) * Math.PI / 180;
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
    URL.revokeObjectURL(kmlObjectUrl);
    console.error('KML error:', e);
    showError('KML file could not be parsed.');
  });
}

loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
  .then(function() { return loadScript('https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js'); })
  .then(initMap)
  .catch(function() { showError('Failed to load map libraries. Check your internet connection.'); });
</script>
</body>
</html>`;

		const blob = new Blob([htmlContent], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
		setTimeout(() => URL.revokeObjectURL(url), 3000);
	};

	return (
		<button
			onClick={handleMapClick}
			disabled={isDisabled}
			className={`p-2 rounded-lg transition-all flex items-center justify-center ${
				isDisabled
					? 'bg-gray-100 text-gray-400 cursor-not-allowed'
					: isBadData
					? 'bg-orange-100 text-orange-400 cursor-not-allowed'
					: 'bg-blue-100 hover:bg-blue-200 text-blue-600'
			} ${className}`}
			title={isDisabled ? 'No KML file available' : isBadData ? 'KML file data is invalid — please re-upload' : title}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
			</svg>
		</button>
	);
};

export default KMLMapdata;
