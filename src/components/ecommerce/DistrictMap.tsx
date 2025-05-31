'use client'
import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';

// 1. Define the type for a district
type District = {
  name: string;
  lat: number;
  lng: number;
};

const districts: District[] = [
  { name: 'Nandurbar', lat: 21.3700, lng: 74.2400 },
  { name: 'Navapur', lat: 21.1667, lng: 73.7833 },
  { name: 'Shahada', lat: 21.5453, lng: 74.4711 },
  { name: 'Taloda', lat: 21.5614, lng: 74.2125 },
  { name: 'Akkalkuwa', lat: 21.5199, lng: 74.0217 },
  { name: 'Akrani', lat: 21.8242, lng: 74.2208 },
  { name: 'Dhadgaon', lat: 21.8222, lng: 74.2233 }
];

// 2. Define props type for the child marker component
type DistrictMarkerProps = {
  district: District;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const DistrictMarker: React.FC<DistrictMarkerProps> = ({
  district,
  open,
  onOpen,
  onClose
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        position={{ lat: district.lat, lng: district.lng }}
        title={district.name}
        clickable={true}
        onClick={onOpen}
        ref={markerRef}
      >
        <Pin
          background="#4285F4"
          borderColor="#4285F4"
          glyphColor="white"
          scale={1.4}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={onClose}
          headerDisabled={true}        >
          <div
            style={{
              fontWeight: 600,
              color: '#4285F4',
              fontSize: '16px',
              padding: '0px 0px',
              cursor:"pointer"
            }}
          >
            {district.name}
          </div>
        </InfoWindow>

      )}
    </>
  );
};

const DistrictMap: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  console.log("openIndex",openIndex)

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <APIProvider apiKey="AIzaSyBDR0JbLRuagtWQgA2bpRUTprisPetZ1wA">
        <Map
          mapId="districts-map"
          defaultCenter={{ lat: 21.5, lng: 74.2 }}
          defaultZoom={10}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {districts.map((district, idx) => (
            <DistrictMarker
              key={idx}
              district={district}
              open={true}
              onOpen={() => setOpenIndex(idx)}
              onClose={() => setOpenIndex(null)}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

export default DistrictMap;
