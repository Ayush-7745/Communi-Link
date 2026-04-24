import { useState, useEffect } from "react";
import { useIssues } from "../../contexts/IssuesContext";
import { useUser } from "../../contexts/UserContext";
import { Timestamp } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useNotifications } from "../../contexts/NotificationContext";

function LocationPicker({ setForm }: any) {
    useMapEvents({
        click(e: { latlng: { lat: number; lng: number } }) {
            const { lat, lng } = e.latlng;

            setForm((prev: any) => ({
                ...prev,
                lat,
                lng,
                location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            }));
        },
    });


    return null;
}
function RecenterMap({ position }: { position: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.setView(position, 13);
    }, [position]);

    return null;
}




import { useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export function ReportIssue() {
    const { addIssue, issues } = useIssues();
    const { userProfile, currentUserLocation } = useUser();
    const [position, setPosition] = useState<[number, number] | null>(
        currentUserLocation ? [currentUserLocation.lat, currentUserLocation.lng] : null
    );
    const { addNotification } = useNotifications();
    const mapRef = useRef<LeafletMap | null>(null);

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (currentUserLocation) {
            const coords: [number, number] = [currentUserLocation.lat, currentUserLocation.lng];
            setPosition(coords);
            setForm((prev: any) => ({
                ...prev,
                lat: coords[0],
                lng: coords[1],
                location: `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
            }));
        } else {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [
                        pos.coords.latitude,
                        pos.coords.longitude,
                    ];

                    setPosition(coords);

                    setForm((prev: any) => ({
                        ...prev,
                        lat: coords[0],
                        lng: coords[1],
                        location: `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
                    }));
                },
                (err) => {
                    console.log("Location error:", err);
                }
            );
        }
    }, [currentUserLocation]);

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        urgency: "Low" as "Low" | "Medium" | "High",
        imageUrl: "",
        location: currentUserLocation ? `${currentUserLocation.lat.toFixed(5)}, ${currentUserLocation.lng.toFixed(5)}` : "",
        lat: currentUserLocation?.lat || 0,
        lng: currentUserLocation?.lng || 0,
    });

    const handleSubmit = async () => {
        if (!form.title || !form.description || !form.category) {
            alert("Please fill all required fields");
            return;
        }

        if (!userProfile?.userId) return;

        addIssue({
            title: form.title,
            description: form.description,
            category: form.category,
            urgency: form.urgency,
            imageUrl: form.imageUrl,
            lat: form.lat,
            lng: form.lng,
            assignedVolunteerId: null,
            reportedBy: userProfile.userId,
        });

        alert("Issue reported successfully 🚀");

        setForm({
            title: "",
            description: "",
            category: "",
            urgency: "Low",
            imageUrl: "",
            location: "",
            lat: 0,
            lng: 0,
        });
        await updateDoc(doc(db, "users", userProfile.userId), {
            points: increment(10),
        });
    };

    return (

        <div className="bg-white p-6 rounded-2xl shadow-md space-y-6">
            <h1 className="text-2xl font-semibold">Report New Issue</h1>

            {/* Title */}
            <div>
                <label className="block mb-2 font-semibold text-gray-700">
                    Title
                </label>
                <input
                    type="text"
                    placeholder="Enter issue title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block mb-2 font-semibold text-gray-700">
                    Description
                </label>
                <textarea
                    placeholder="Describe the issue..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
            </div>

            {/* Category */}
            <div>
                <label className="block mb-3 font-semibold text-gray-700">
                    Category
                </label>

                <div className="grid grid-cols-3 gap-4">
                    {["Food", "Health", "Infrastructure", "Disaster", "Others"].map((cat) => (
                        <div
                            key={cat}
                            onClick={() => setForm({ ...form, category: cat })}
                            className={`p-4 rounded-xl border cursor-pointer text-center transition 
        ${form.category === cat
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "hover:border-blue-400 hover:shadow-sm"}`}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            </div>

            {/* Urgency */}
            <div>
                <label className="block mb-3 font-semibold text-gray-700">
                    Urgency
                </label>

                <div className="grid grid-cols-3 gap-4">
                    {["Low", "Medium", "High"].map((u) => (
                        <div
                            key={u}
                            onClick={() =>
                                setForm({ ...form, urgency: u as "Low" | "Medium" | "High" })
                            }
                            className={`p-4 rounded-xl border text-center cursor-pointer transition
        ${form.urgency === u
                                    ? "bg-red-500 text-white shadow-md"
                                    : "hover:border-red-400 hover:shadow-sm"}`}
                        >
                            {u}
                        </div>
                    ))}
                </div>
            </div>

            {/* Image URL */}
            <div>
                <label className="block mb-2 font-semibold text-gray-700">
                    Image (Optional)
                </label>
                <input
                    type="text"
                    placeholder="Paste image URL"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
            </div>

            {/* Location */}
            <div>
                <label className="block mb-2 font-semibold text-gray-700">
                    Location
                </label>

                <input
                    type="text"
                    placeholder="Auto detected location"
                    value={form.location}
                    readOnly
                    className="w-full p-3 border rounded-lg mb-3 bg-gray-100"
                />

                <div className="h-64 rounded-xl overflow-hidden border">
                    {position ? (
                        <MapContainer
                            ref={mapRef}
                            center={position}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                            preferCanvas={true}
                        >
                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                keepBuffer={2}
                            />

                            <LocationPicker setForm={setForm} />
                            <RecenterMap position={position} />

                            {/* New Issue Selection Marker */}
                            {form.lat !== 0 && (
                                <Marker position={[form.lat, form.lng]}>
                                    <Popup>Reporting Location</Popup>
                                </Marker>
                            )}

                            {/* User Location Marker */}
                            <Marker position={position}>
                                <Popup>You are here 📍</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                            <p className="text-sm">Detecting your location...</p>
                        </div>
                    )}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                    Click on map to select location
                </p>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition"
            >
                Submit Issue (+10 pts)
            </button>
        </div>
    );
}
