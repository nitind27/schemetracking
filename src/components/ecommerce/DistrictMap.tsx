'use client'
import React from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const DistrictMap = () => {
  // Coordinates for the districts (approximate values - verify for production)
  const districts = [
    { name: 'Nandurbar', lat: 21.3700, lng: 74.2400 },
    { name: 'Navapur', lat: 21.1667, lng: 73.7833 },
    { name: 'Shahada', lat: 21.5453, lng: 74.4711 },
    { name: 'Taloda', lat: 21.5614, lng: 74.2125 },
    { name: 'Akkalkuwa', lat: 21.5199, lng: 74.0217 },
    { name: 'Akrani', lat: 21.8242, lng: 74.2208 },
    { name: 'Dhadgaon', lat: 21.8222, lng: 74.2233 }
  ];
  const alertdata = (v: string) => {
    alert(v)
  }
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <APIProvider apiKey="AIzaSyBDR0JbLRuagtWQgA2bpRUTprisPetZ1wA">
        <Map
          mapId="districts-map"
          defaultCenter={{ lat: 21.5, lng: 74.2 }}
          defaultZoom={8}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {districts.map((district, index) => (
            <>
              <div >

                <AdvancedMarker
                  key={index}
                  position={{ lat: district.lat, lng: district.lng }}
                  title={district.name}
                >
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px'

                  }}
                    onClick={() => alertdata(district.name)}>
                    {district.name}
                  </div>
                </AdvancedMarker>
              </div>
            </>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

export default DistrictMap;
