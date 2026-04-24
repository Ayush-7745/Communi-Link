import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Issue } from '../../../types/issue';
import { useEffect, useState } from 'react';

interface Props {
    issues: Issue[];
}

/* 🔥 NEW: Auto recenter component */
function RecenterMap({ position }: { position: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 13);
        }
    }, [position, map]);

    return null;
}

export function MapView({ issues }: Props) {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([
                    position.coords.latitude,
                    position.coords.longitude
                ]);
            },
            (error) => console.log(error)
        );
    }, []);

    return (
        <MapContainer
            center={(userLocation || [19.076, 72.877]) as [number, number]}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 🔥 NEW: Auto focus on user */}
            <RecenterMap position={userLocation} />

            {/* Issue markers */}
            {issues.map((issue) => (
                <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                    <Popup>
                        <strong>{issue.title}</strong>
                        <br />
                        {issue.description}
                    </Popup>
                </Marker>
            ))}

            {/* User marker */}
            {userLocation && (
                <Marker position={userLocation}>
                    <Popup>You are here 📍</Popup>
                </Marker>
            )}
        </MapContainer>
    );
}