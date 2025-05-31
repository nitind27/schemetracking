'use client'
import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

const DistrictMap = () => {
  const districts = [
    { name: 'Nandurbar', lat: 21.3700, lng: 74.2400 },
    { name: 'Navapur', lat: 21.1667, lng: 73.7833 },
    { name: 'Shahada', lat: 21.5453, lng: 74.4711 },
    { name: 'Taloda', lat: 21.5614, lng: 74.2125 },
    { name: 'Akkalkuwa', lat: 21.5199, lng: 74.0217 },
    { name: 'Akrani', lat: 21.8242, lng: 74.2208 },
    { name: 'Dhadgaon', lat: 21.8222, lng: 74.2233 }
  ];

  // State to track which marker is open
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <APIProvider apiKey="AIzaSyBDR0JbLRuagtWQgA2bpRUTprisPetZ1wA">
        <Map
          mapId="districts-map"
          defaultCenter={{ lat: 21.5, lng: 74.2 }}
          defaultZoom={9}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {districts.map((district, index) => {
            const [markerRef, marker] = useAdvancedMarkerRef();
            return (
              <React.Fragment key={index}>
                <AdvancedMarker
                  position={{ lat: district.lat, lng: district.lng }}
                  title={district.name}
                  clickable={true}
                  onClick={() => setOpenIndex(index)}
                  ref={markerRef}
                >
                  <Pin
                    background="#4285F4"
                    borderColor="#4285F4"
                    glyphColor="white"
                    scale={1.4}
                  />
                </AdvancedMarker>
                {openIndex === index && marker && (
                  <InfoWindow anchor={marker} onCloseClick={() => setOpenIndex(null)}>
                    <div style={{
                      fontWeight: 600,
                      color: '#4285F4',
                      fontSize: '16px',
                      padding: '4px 8px'
                    }}>
                     
                      {district.name}
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
};

export default DistrictMap;
