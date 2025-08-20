import React from 'react';

interface KMLMapButtonProps {
	kmlFile?: string;
	title?: string;
	className?: string;
}

const KMLMapButton: React.FC<KMLMapButtonProps> = ({ 
	kmlFile, 
	title = 'Open in Google Earth',
	className = ''
}) => {
	const handleMapClick = async () => {
		if (!kmlFile) return;

		try {
			// Get the full URL for the KML file
			let kmlUrl = '';
			
			if (kmlFile.startsWith('http')) {
				kmlUrl = kmlFile;
			} else if (kmlFile.startsWith('/')) {
				// Remove /public from the path since Next.js serves public files from root
				const publicPath = kmlFile.replace('/public', '');
				kmlUrl = `${window.location.origin}${publicPath}`;
			} else {
				// If it's just a filename, assume it's in /public/kml/
				const kmlPath = `/kml/${kmlFile}`;
				kmlUrl = `${window.location.origin}${kmlPath}`;
			}

			// Method 1: Try to open in Google Earth Web with proper KML URL
			// This should work better for hosted KML files
			const googleEarthUrl = `https://earth.google.com/web/ge/kml?url=${encodeURIComponent(kmlUrl)}`;
			window.open(googleEarthUrl, '_blank');

		} catch (error) {
			console.error('Error opening KML file:', error);
			
			// Method 2: Fallback - Try Google Maps with KML overlay
			try {
				let kmlUrl = '';
				if (kmlFile.startsWith('http')) {
					kmlUrl = kmlFile;
				} else if (kmlFile.startsWith('/')) {
					const publicPath = kmlFile.replace('/public', '');
					kmlUrl = `${window.location.origin}${publicPath}`;
				} else {
					const kmlPath = `/kml/${kmlFile}`;
					kmlUrl = `${window.location.origin}${kmlPath}`;
				}
				
				// Try Google Maps with KML overlay
				const googleMapsUrl = `https://www.google.com/maps/d/u/0/viewer?mid=1&ll=0,0&z=1&kml=${encodeURIComponent(kmlUrl)}`;
				window.open(googleMapsUrl, '_blank');
				
			} catch (fallbackError) {
				console.error('Fallback error:', fallbackError);
				
				// Method 3: Last resort - Try to download and open locally
				try {
					let kmlUrl = '';
					if (kmlFile.startsWith('http')) {
						kmlUrl = kmlFile;
					} else if (kmlFile.startsWith('/')) {
						const publicPath = kmlFile.replace('/public', '');
						kmlUrl = `${window.location.origin}${publicPath}`;
					} else {
						const kmlPath = `/kml/${kmlFile}`;
						kmlUrl = `${window.location.origin}${kmlPath}`;
					}
					
					// Try to open the KML file directly
					window.open(kmlUrl, '_blank');
				} catch (finalError) {
					console.error('Final error:', finalError);
					alert('Unable to open KML file. Please try downloading it manually.');
				}
			}
		}
	};

	const isDisabled = !kmlFile;

	return (
		<button
			onClick={handleMapClick}
			disabled={isDisabled}
			className={`
				p-2 rounded-lg transition-all duration-200 flex items-center justify-center
				${isDisabled 
					? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
					: 'bg-blue-100 hover:bg-blue-200 text-blue-600 hover:scale-105 shadow-sm hover:shadow-md'
				}
				${className}
			`}
			title={isDisabled ? 'No KML file available' : title}
		>
			<svg 
				width="20" 
				height="20" 
				viewBox="0 0 24 24" 
				fill="currentColor"
				className="inline-block"
			>
				<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
			</svg>
		</button>
	);
};

export default KMLMapButton;
