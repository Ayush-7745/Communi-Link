import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Issue } from '../../../types/issue';
import { useUser } from '../../contexts/UserContext';
import { locationMarkerIcon } from '../LocationPickerMap';

interface Props {
  issues: Issue[];
}

export function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (position) map.setView(position, 13);
  }, [position?.[0], position?.[1], map]);

  return null;
}

function MapLocationPicker({
  onSelect,
}: {
  onSelect: (position: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export function MapView({ issues }: Props) {
  const {
    currentUserLocation,
    currentUserLocationAddress,
    isDetectingLocation,
    locationError,
    detectCurrentLocation,
    selectCurrentLocation,
  } = useUser();
  const userLocation: [number, number] | null = currentUserLocation
    ? [currentUserLocation.lat, currentUserLocation.lng]
    : null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void detectCurrentLocation()}
        className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-md hover:bg-slate-50"
      >
        {isDetectingLocation && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />}
        {isDetectingLocation ? 'Detecting location…' : 'Auto-detect location'}
      </button>
      <MapContainer
        center={userLocation || [19.076, 72.877]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapLocationPicker onSelect={selectCurrentLocation} />
        <RecenterMap position={userLocation} />
        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.lat, issue.lng]}>
            <Popup className="community-map-popup">
              <strong>{issue.title}</strong>
              <br />
              {issue.description}
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={locationMarkerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const point = event.target.getLatLng();
                selectCurrentLocation({ lat: point.lat, lng: point.lng });
              },
            }}
          >
            <Popup>Your current location</Popup>
          </Marker>
        )}
      </MapContainer>
      <p className="px-2 pt-2 text-sm text-slate-600">
        {currentUserLocationAddress
          ? `Selected location: ${currentUserLocationAddress}`
          : 'Click the map or drag the marker to select a location manually.'}
      </p>
      {locationError && (
        <p role="alert" className="px-2 pt-1 text-sm text-red-600">
          {locationError}
        </p>
      )}
    </div>
  );
}
