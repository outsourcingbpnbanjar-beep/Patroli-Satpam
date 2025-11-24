import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { PatrolLog, PatrolStatus } from '../types';
import { OFFICE_LOCATION } from '../constants';
import L from 'leaflet';

// Fix for default Leaflet icons in React-Leaflet
// We use a custom SVG for markers to avoid 404s on marker-icon.png
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface PatrolMapProps {
  logs: PatrolLog[];
}

export const PatrolMap: React.FC<PatrolMapProps> = ({ logs }) => {
  // Center on the office
  const position: [number, number] = [OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude];

  // Filter logs that have valid coordinates
  const logsWithCoords = logs.filter(log => log.coordinates && log.coordinates.latitude && log.coordinates.longitude);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0">
      <MapContainer 
        center={position} 
        zoom={17} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Office Radius Zone */}
        <Circle 
          center={position}
          radius={OFFICE_LOCATION.radiusMeters}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
        >
          <Popup>
            <div className="text-center">
              <strong className="block text-sm">Kantor Pertanahan Kota Banjar</strong>
              <span className="text-xs">Zona Validasi Patroli ({OFFICE_LOCATION.radiusMeters}m)</span>
            </div>
          </Popup>
        </Circle>

        {/* Patrol Markers */}
        {logsWithCoords.map((log) => (
          <Marker 
            key={log.id} 
            position={[log.coordinates!.latitude, log.coordinates!.longitude]}
            icon={createCustomIcon(
              log.aiAnalysis?.status === PatrolStatus.SECURE ? '#22c55e' : 
              log.aiAnalysis?.status === PatrolStatus.DANGER ? '#ef4444' : '#eab308'
            )}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-bold text-sm mb-1">{log.locationName}</h3>
                <p className="text-xs text-slate-500 mb-1">{log.guardName}</p>
                <p className="text-xs mb-1">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className={`text-xs px-2 py-1 rounded inline-block font-semibold ${
                   log.aiAnalysis?.status === PatrolStatus.SECURE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {log.aiAnalysis?.status || 'Manual'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};