import React from 'react';

interface KMLMapButtonProps {
	kmlFile?: string; // e.g. "/kml/Harankhuri CFR.kml" or "Harankhuri CFR.kml"
	title?: string;
	className?: string;
}

const KMLMapButton: React.FC<KMLMapButtonProps> = ({
	kmlFile,
	title = 'Open in Google Earth',
	className = '',
}) => {
	const resolveApiUrl = (file: string) => {
		// normalize to "filename under public/kml"
		let p = file.trim();
		p = p.replace(/^\/public\//, '');   // "/public/kml/..." -> "kml/..."
		p = p.replace(/^\/?kml\//, '');     // "kml/..." or "/kml/..." -> "..."
		p = p.replace(/^\//, '');           // "/..." -> "..."
		const encoded = p.split('/').map(encodeURIComponent).join('/');
		return `${window.location.origin}/api/kml/${encoded}`;
	};

	const handleMapClick = () => {
		if (!kmlFile) return;

		try {
			let apiUrl: string;

			if (kmlFile.startsWith('http')) {
				// If already a full public URL with proper CORS, use as-is
				apiUrl = kmlFile;
			} else {
				apiUrl = resolveApiUrl(kmlFile);
			}

			// Open in Google Earth Web with the API URL
			const earthUrl = `https://earth.google.com/web/ge/kml?url=${encodeURIComponent(apiUrl)}`;
			window.open(earthUrl, '_blank');
		} catch (e) {
			console.error(e);
			// Fallback: open the KML directly from API (inline headers prevent download)
			try {
				const apiUrl = resolveApiUrl(kmlFile!);
				window.open(apiUrl, '_blank');
			} catch {}
		}
	};

	const isDisabled = !kmlFile;

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
