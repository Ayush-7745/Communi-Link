import { useState, useEffect } from 'react';
import { Upload, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../../services/api';
import { LocationPickerMap } from '../LocationPickerMap';
import { useGeolocation } from '../../../hooks/useGeolocation';

export function ReportIssue() {
  const { addIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();
  const geo = useGeolocation();
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = ['Food', 'Health', 'Infrastructure', 'Disaster', 'Others'];
  const urgencyLevels = ['Low', 'Medium', 'High'];
  const location = geo.location;
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  useEffect(() => {
    void geo.detectLocation();
  }, [geo.detectLocation]);

  useEffect(() => {
    if (location) {
      setFormData((previous) => ({ ...previous, location: location.address }));
    }
  }, [location?.lat, location?.lng, location?.address]);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!location) {
      alert("Please select a location on the map");
      return;
    }

    // Add issue to context
    if (!userProfile?.userId) return;

    let imageBlob: string | undefined;
    if (imageFile) {
      try {
        imageBlob = (await api.uploadImage(imageFile)).blobName;
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to upload the issue image.');
        return;
      }
    }

    const saved = await addIssue({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      lat: location.lat,
      lng: location.lng,
      locationAddress: location.address,
      urgency: formData.urgency,
      imageUrl: formData.imageUrl,
      imageBlob,
      reportedBy: userProfile.userId,
    });
    if (!saved) return;

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
      setImageFile(null);
    }, 3000);
  };

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.category !== '' &&
      formData.location.trim() !== ''
    );
  };
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
            className="px-6 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors"
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

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void geo.detectLocation()}
              disabled={geo.isDetecting}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60"
            >
              <MapPin className="w-5 h-5" />
              {geo.isDetecting ? 'Detecting…' : 'Auto-detect'}
            </button>
            <span className="text-sm text-gray-500">Or click the map / drag the marker</span>
          </div>
          <LocationPickerMap position={location} onChange={geo.setLocation} />
        </div>
        {location && (
          <p className="text-sm mt-2">
            Selected: {location.address}
          </p>
        )}
        <div>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Issue Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all`}
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
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all resize-none`}
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
            className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all`}
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
              placeholder="Enter location or use auto-detect"
            />
            <button
              type="button"
              onClick={() => void geo.detectLocation()}
              disabled={geo.isDetecting}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <MapPin className="w-5 h-5" />
              {geo.isDetecting ? 'Detecting…' : 'Auto-detect'}
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
                  ? 'border-[#0d9488] bg-blue-50 text-[#0d9488]'
                  : 'border-gray-300 text-gray-700 hover:border-[#0d9488]'
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>

        <div>
          <label htmlFor="issue-image" className="block text-sm text-gray-700 mb-2">Upload an image (optional, max 5 MB)</label>
          <input
            id="issue-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                alert('Choose a JPG, PNG, or WebP image up to 5 MB.');
                event.target.value = '';
                setImageFile(null);
                return;
              }
              setImageFile(file);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Issue image preview" className="mt-3 max-h-56 rounded-lg object-contain" />
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Issue
          </button>
        </div>
      </form>
    </div>
  );
}
