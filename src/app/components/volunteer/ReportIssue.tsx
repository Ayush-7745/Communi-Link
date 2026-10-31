import { useState, useEffect } from "react";
import { useIssues } from "../../contexts/IssuesContext";
import { useUser } from "../../contexts/UserContext";
import "leaflet/dist/leaflet.css";
import { LocationPickerMap } from "../LocationPickerMap";
import { useGeolocation } from "../../../hooks/useGeolocation";

export function ReportIssue() {
    const { addIssue } = useIssues();
    const { userProfile } = useUser();
    const geo = useGeolocation();

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        urgency: "Low" as "Low" | "Medium" | "High",
        imageUrl: "",
        location: "",
        lat: 0,
        lng: 0,
    });

    useEffect(() => {
        void geo.detectLocation();
    }, []);

    useEffect(() => {
        if (!geo.location) return;
        const { lat, lng, address } = geo.location;
        setForm((previous) => ({
            ...previous,
            lat,
            lng,
            location: address,
        }));
    }, [geo.location?.lat, geo.location?.lng, geo.location?.address]);

    const handleSubmit = async () => {
        if (!form.title || !form.description || !form.category) {
            alert("Please fill all required fields");
            return;
        }

        if (!geo.location) {
            alert("Select a location on the map or detect your location first.");
            return;
        }

        if (!userProfile?.userId) return;

        try {
            const saved = await addIssue({
                title: form.title,
                description: form.description,
                category: form.category,
                urgency: form.urgency,
                imageUrl: form.imageUrl,
                lat: form.lat,
                lng: form.lng,
                locationAddress: geo.location.address,
                assignedVolunteerId: null,
                reportedBy: userProfile.userId,
            });
            if (!saved) return;
        } catch {
            return;
        }

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

                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => void geo.detectLocation()}
                        disabled={geo.isDetecting}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                    >
                        {geo.isDetecting ? "Detecting..." : "Detect my location"}
                    </button>
                    <p className="text-sm text-gray-500">Or click the map / drag the marker</p>
                </div>
                <LocationPickerMap
                    position={geo.location}
                    onChange={geo.setLocation}
                    height={256}
                />

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
