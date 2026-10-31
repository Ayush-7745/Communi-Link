import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from 'leaflet';

export const locationMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46" aria-hidden="true"><path fill="#dc2626" stroke="#fff" stroke-width="2" d="M19 1C9.1 1 1 9.1 1 19c0 13 18 26 18 26s18-13 18-26C37 9.1 28.9 1 19 1Z"/><circle cx="19" cy="19" r="6" fill="#fff"/></svg>',
  iconSize: [38, 46],
  iconAnchor: [19, 45],
  popupAnchor: [0, -42],
});

interface LocationPickerMapProps {
  position: { lat: number; lng: number } | null;
  onChange: (position: { lat: number; lng: number }) => void;
  height?: number;
}

function MapClickPicker({ onChange }: Pick<LocationPickerMapProps, 'onChange'>) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function RecenterAndResize({ position }: Pick<LocationPickerMapProps, 'position'>) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (position) map.setView([position.lat, position.lng], 15);
  }, [map, position?.lat, position?.lng]);

  return null;
}

export function LocationPickerMap({ position, onChange, height = 300 }: LocationPickerMapProps) {
  const initialCenter: [number, number] = [position?.lat ?? 19.076, position?.lng ?? 72.877];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={initialCenter} zoom={position ? 15 : 11} style={{ height, width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickPicker onChange={onChange} />
        <RecenterAndResize position={position} />
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={locationMarkerIcon}
            draggable
            eventHandlers={{
              dragend(event: { target: { getLatLng: () => LatLng } }) {
                const point = event.target.getLatLng();
                onChange({ lat: point.lat, lng: point.lng });
              },
            }}
          >
            <Popup>Selected location (drag to adjust)</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
