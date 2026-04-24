import { useState, useEffect } from 'react';
import { Upload, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

export function ReportIssue() {
  const { addIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();
  const isDark = effectiveTheme === 'dark';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    urgency: 'Low' as 'Low' | 'Medium' | 'High',
    imageUrl: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const categories = ['Food', 'Health', 'Infrastructure', 'Disaster', 'Others'];
  const urgencyLevels = ['Low', 'Medium', 'High'];
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude
        ];
        setUserLocation(coords);
        setLocation({ lat: coords[0], lng: coords[1] }); // also sync your existing state
      },
      (err) => console.log(err)
    );
  }, []);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!location) {
      alert("Please select a location on the map");
      return;
    }

    // Add issue to context
    if (!userProfile?.userId) return;

    addIssue({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      urgency: formData.urgency,
      imageUrl: formData.imageUrl,
      reportedBy: userProfile.userId,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        urgency: 'Low',
        imageUrl: '',
      });
    }, 3000);
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLocation({ lat, lng });

          setFormData((prev) => ({
            ...prev,
            location: `${lat}, ${lng}`,
          }));
        },
        () => {
          alert('Unable to detect location. Please enter manually.');
        }
      );
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.category !== '' &&
      formData.location.trim() !== ''
    );
  };
  function LocationPicker({ setLocation }: any) {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        setLocation({ lat, lng });

        // ✅ AUTO-FILL INPUT FIELD
        setFormData((prev: any) => ({
          ...prev,
          location: `${lat}, ${lng}`,
        }));
      },
    });
    return null;
  }
  function AutoCenterMap({ userLocation }: { userLocation: [number, number] | null }) {
    const map = useMapEvents({});

    useEffect(() => {
      if (userLocation) {
        map.setView(userLocation, 15);
      }
    }, [userLocation, map]);

    return null;
  }
  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-8 text-center`}>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Issue Reported Successfully!</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            Your issue has been submitted. Our team will review it shortly and assign it to the nearest NGO or volunteer.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Report an Issue</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Help your community by reporting issues that need attention</p>
      </div>

      <form onSubmit={handleSubmit} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 space-y-6`}>
        {/* Issue Title */}
        <div className="mt-4">
          <h3 className="mb-2 font-semibold">Select Location on Map</h3>

          <MapContainer
            center={(userLocation ? userLocation : location ? [location.lat, location.lng] : [19.076, 72.877]) as [number, number]}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AutoCenterMap userLocation={userLocation} />
            <LocationPicker setLocation={setLocation} />

            {location && (
              <Marker position={[location.lat, location.lng]}>
                <Popup>Selected Location</Popup>
              </Marker>
            )}

            {userLocation && (
              <Marker position={userLocation}>
                <Popup>You are here 📍</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        {location && (
          <p className="text-sm mt-2">
            Selected: {location.lat}, {location.lng}
          </p>
        )}
        <div>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Issue Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all`}
            placeholder="Brief description of the issue"
          />
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-none`}
            placeholder="Provide detailed information about the issue"
          />
        </div>

        {/* Category */}
        <div>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Category *</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all`}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Location *</label>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
              placeholder="Enter location or use auto-detect"
            />
            <button
              type="button"
              onClick={detectLocation}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <MapPin className="w-5 h-5" />
              Auto-detect
            </button>
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Urgency Level *</label>
          <div className="grid grid-cols-3 gap-3">
            {urgencyLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    urgency: level as 'Low' | 'Medium' | 'High',
                  })
                } className={`py-3 px-4 rounded-lg border transition-all ${formData.urgency === level
                  ? 'border-[#3B82F6] bg-blue-50 text-[#3B82F6]'
                  : 'border-gray-300 text-gray-700 hover:border-[#3B82F6]'
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Images */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Image URL</label>
          <input
            type="text"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="Paste image link (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Issue
          </button>
        </div>
      </form>
    </div>
  );
}
