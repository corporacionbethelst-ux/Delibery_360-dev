'use client';

import { useEffect, useState } from 'react';
// Nota: Para producción, asegúrate de instalar: npm install leaflet react-leaflet @types/leaflet
// Si no se puede instalar ahora, este componente usa un fallback visual seguro.
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false, loading: () => <div className="h-full w-full bg-gray-200 flex items-center justify-center">Cargando Mapa...</div> });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Iconos customizados simples
const createMarkerIcon = (color: string) => ({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RiderLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'available' | 'busy';
}

interface LiveTrackingMapProps {
  center?: [number, number];
  zoom?: number;
  riders?: RiderLocation[];
}

export default function LiveTrackingMap({ 
  center = [40.416775, -3.703790], // Madrid por defecto
  zoom = 13,
  riders = [
    { id: 'r1', name: 'Pedro (Bici)', lat: 40.416, lng: -3.703, status: 'available' },
    { id: 'r2', name: 'Sofia (Moto)', lat: 40.420, lng: -3.710, status: 'busy' },
  ]
}: LiveTrackingMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[500px] w-full bg-gray-100 animate-pulse rounded-lg" />;

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {riders.map((rider) => (
          <Marker 
            key={rider.id} 
            position={[rider.lat, rider.lng]}
            // En un entorno real usaríamos L.icon({...}) aquí
          >
            <Popup>
              <div className="text-sm">
                <strong>{rider.name}</strong><br/>
                Estado: <span className={rider.status === 'available' ? 'text-green-600' : 'text-red-600'}>
                  {rider.status === 'available' ? 'Disponible' : 'Ocupado'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay de leyenda */}
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow text-xs z-[1000]">
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Disponible</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Ocupado</div>
      </div>
    </div>
  );
}