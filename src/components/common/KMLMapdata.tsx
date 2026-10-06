'use client';

import React, { useCallback, useMemo } from 'react';

interface KMLMapButtonProps {
	kmlFile?: string;
	villageId?: string | number;
	title?: string;
	className?: string;
}

interface WorkMapPoint {
	lat: number;
	lng: number;
	name: string;
	status: string;
	area: string;
}

function toWorkPoints(rows: unknown): WorkMapPoint[] {
	if (!Array.isArray(rows)) return [];
	const points: WorkMapPoint[] = [];
	for (const row of rows) {
		if (!row || typeof row !== 'object') continue;
		const rec = row as Record<string, unknown>;
		const lat = parseFloat(String(rec.latitude ?? '').trim());
		const lng = parseFloat(String(rec.longitude ?? '').trim());
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
		if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
		if (lat === 0 && lng === 0) continue;
		points.push({
			lat,
			lng,
			name: String(rec.work_name ?? '').trim() || 'काम',
			status: String(rec.work_status ?? '').trim(),
			area: String(rec.total_area ?? '').trim(),
		});
	}
	return points;
}

const KMLMapdata: React.FC<KMLMapButtonProps> = ({
	kmlFile,
	villageId,
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

		let workMarkers: WorkMapPoint[] = [];
		if (villageId != null && String(villageId).trim() !== '') {
			try {
				const fd = new FormData();
				fd.append('village_id', String(villageId).trim());
				const workRes = await fetch('/api/presentworkidwise', { method: 'POST', body: fd });
				if (workRes.ok) {
					workMarkers = toWorkPoints(await workRes.json());
				}
			} catch (err) {
				console.error('Failed to fetch work locations:', err);
			}
		}

		const kmlJson = JSON.stringify(kmlContent);
		const filenameJson = JSON.stringify(kmlFile);
		const workMarkersJson = JSON.stringify(workMarkers).replace(/</g, '\\u003c');

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
.works-badge{background:rgba(220,38,38,0.18);border:1px solid rgba(248,113,113,0.45);color:#fecaca;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;display:none}
#workList{position:absolute;z-index:1000;left:12px;bottom:12px;display:none;max-width:320px;max-height:40vh;overflow:auto;background:rgba(15,23,42,0.92);color:#fee2e2;border:1px solid rgba(248,113,113,0.45);border-radius:10px;padding:8px}
#workList button{display:block;width:100%;text-align:left;background:transparent;color:#fecaca;border:0;border-bottom:1px solid rgba(255,255,255,0.08);padding:6px 4px;cursor:pointer;font-size:12px;line-height:1.35}
#workList button:hover{background:rgba(220,38,38,0.25)}
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
    <div id="worksBadge" class="works-badge">कामे: <span id="worksCount">0</span></div>
    <div id="areaBadge" class="area-badge">Area: <span id="areaValue">0</span> km²</div>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>
</div>
<div id="map"></div>
<div id="workList"></div>
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
var WORK_MARKERS = ${workMarkersJson};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function addWorkMarkers(map, bounds) {
  if (!WORK_MARKERS || !WORK_MARKERS.length) return bounds;
  if (!map.getPane('workPins')) {
    var pane = map.createPane('workPins');
    pane.style.zIndex = '650';
    pane.style.pointerEvents = 'auto';
  }
  var buckets = {};
  WORK_MARKERS.forEach(function(point) {
    var key = point.lat.toFixed(5) + ',' + point.lng.toFixed(5);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(point);
  });
  var group = L.featureGroup();
  var markerByKey = {};
  Object.keys(buckets).forEach(function(key) {
    var list = buckets[key];
    var first = list[0];
    var html = list.map(function(point, index) {
      return '<div style="margin-bottom:8px">'
        + '<div style="font-weight:600;color:#0f172a">' + (list.length > 1 ? (index + 1) + '. ' : '') + escapeHtml(point.name) + '</div>'
        + (point.status ? '<div>स्थिती: ' + escapeHtml(point.status) + '</div>' : '')
        + (point.area ? '<div>क्षेत्र: ' + escapeHtml(point.area) + '</div>' : '')
        + '<div style="color:#64748b;font-size:12px">' + point.lat + ', ' + point.lng + '</div>'
        + '</div>';
    }).join('');
    var marker = L.circleMarker([first.lat, first.lng], {
      pane: 'workPins',
      radius: 11,
      color: '#ffffff',
      weight: 3,
      fillColor: '#dc2626',
      fillOpacity: 1
    });
    marker.bindPopup('<div style="min-width:200px;max-width:280px;font-size:13px;line-height:1.4"><div style="font-weight:700;margin-bottom:6px;color:#dc2626">काम स्थान</div>' + html + '</div>', { maxWidth: 320 });
    marker.addTo(group);
    markerByKey[key] = marker;
  });
  group.addTo(map);
  if (group.bringToFront) group.bringToFront();
  document.getElementById('worksCount').textContent = String(WORK_MARKERS.length);
  document.getElementById('worksBadge').style.display = 'block';

  var listEl = document.getElementById('workList');
  listEl.style.display = 'block';
  listEl.innerHTML = '';
  WORK_MARKERS.forEach(function(point, index) {
    var key = point.lat.toFixed(5) + ',' + point.lng.toFixed(5);
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = (index + 1) + '. ' + point.name;
    button.onclick = function() {
      var target = markerByKey[key];
      map.setView([point.lat, point.lng], 18);
      if (target) target.openPopup();
    };
    listEl.appendChild(button);
  });

  try {
    if (bounds && bounds.isValid && bounds.isValid()) {
      var padded = bounds.pad(0.35);
      WORK_MARKERS.forEach(function(point) {
        var ll = L.latLng(point.lat, point.lng);
        if (padded.contains(ll)) bounds.extend(ll);
      });
      return bounds;
    }
    return group.getBounds();
  } catch (e) {
    return bounds || group.getBounds();
  }
}

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
    var bounds = null;
    try {
      kmlLayer.addTo(map);
      bounds = kmlLayer.getBounds();
      if (!bounds || !bounds.isValid()) bounds = null;
    } catch(e) {
      bounds = null;
    }
    bounds = addWorkMarkers(map, bounds);
    map.invalidateSize();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else {
      showError('KML loaded but contains no map geometry.');
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
    var bounds = addWorkMarkers(map, null);
    if (bounds && bounds.isValid()) {
      document.getElementById('loadingOverlay').style.display = 'none';
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
      return;
    }
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
