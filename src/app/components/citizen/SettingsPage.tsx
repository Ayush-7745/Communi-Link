import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, User, Mail, Phone, Lock, Bell, Shield, Globe, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

export function SettingsPage() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { userProfile, updateUserProfile, uploadProfilePhoto } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = effectiveTheme === 'dark';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadProfilePhoto(file);
    }
  };

  const [settings, setSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    smsAlerts: false,
    issueUpdates: true,
    volunteerAssignment: true,
    issueCompletion: true,
    profileVisibility: true,
    hidePersonalDetails: false,
    language: 'English',
    fontSize: 'medium',
    highContrast: false,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing password...');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Settings</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage your account preferences and settings</p>
      </div>

      {/* Appearance */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Appearance</h2>
        <div>
          <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light Mode', icon: Sun },
              { value: 'dark', label: 'Dark Mode', icon: Moon },
              { value: 'system', label: 'System Default', icon: Monitor },
            ].map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  type="button"
                  onClick={() => setTheme(themeOption.value as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${theme === themeOption.value
                    ? 'border-[#3B82F6] bg-blue-50'
                    : isDark
                      ? 'border-gray-600 hover:border-[#3B82F6]'
                      : 'border-gray-200 hover:border-[#3B82F6]'
                    }`}
                >
                  <Icon className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{themeOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Account Settings</h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={userProfile?.fullName || ""}
                onChange={(e) => updateUserProfile({ fullName: e.target.value })}
                className={`w-full pl-11 pr-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={userProfile?.email || ""}
                onChange={(e) => updateUserProfile({ email: e.target.value })}
                className={`w-full pl-11 pr-24 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" />
                Verified
              </span>
            </div>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={userProfile?.phone || ""}
                onChange={(e) => updateUserProfile({ phone: e.target.value })}
                className={`w-full pl-11 pr-24 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" />
                Verified
              </span>
            </div>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Profile Photo</label>
            <div className="flex items-center gap-4">
              {userProfile?.profilePhoto ? (
                <img
                  src={userProfile.profilePhoto}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : userProfile?.fullName ? (
                <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-2xl">
                  {userProfile.fullName.charAt(0)}
                </div>
              ) : (
                <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-2xl">
                  U
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
              >
                <Upload className="w-4 h-4" />
                Upload New Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Security</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className={`w-full pl-11 pr-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className={`w-full pl-11 pr-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`w-full pl-11 pr-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Change Password
          </button>
        </form>

        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button className="text-sm text-red-600 hover:underline">
            Logout from all devices
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>Email Notifications</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Receive updates via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>App Notifications</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Push notifications in app</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.appNotifications}
                onChange={(e) => setSettings({ ...settings, appNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>SMS Alerts</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Receive SMS for critical updates</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Notify me about:</p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.issueUpdates}
                onChange={(e) => setSettings({ ...settings, issueUpdates: e.target.checked })}
                className="w-4 h-4 accent-[#3B82F6]"
              />
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issue updates</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.volunteerAssignment}
                onChange={(e) => setSettings({ ...settings, volunteerAssignment: e.target.checked })}
                className="w-4 h-4 accent-[#3B82F6]"
              />
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Volunteer assignment</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.issueCompletion}
                onChange={(e) => setSettings({ ...settings, issueCompletion: e.target.checked })}
                className="w-4 h-4 accent-[#3B82F6]"
              />
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issue completion</label>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Safety */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Privacy & Safety</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>Profile Visibility</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Make your profile visible to NGOs</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.profileVisibility}
                onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>Hide Personal Details</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hide phone and email from NGOs</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hidePersonalDetails}
                onChange={(e) => setSettings({ ...settings, hidePersonalDetails: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button className="text-sm text-red-600 hover:underline">Report Abuse</button>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Verification Status</h2>
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg`}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>ID Proof Uploaded</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Verified Citizen</p>
              </div>
            </div>
            <span className={`px-3 py-1 ${isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'} text-sm rounded-full`}>Verified</span>
          </div>
          <button className="text-sm text-[#3B82F6] hover:underline">Re-upload ID Proof</button>
        </div>
      </div>

      {/* Language & Accessibility */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Language & Accessibility</h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Font Size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
              className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>High Contrast Mode</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enhance readability</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => setSettings({ ...settings, highContrast: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border-2 ${isDark ? 'border-red-900/50' : 'border-red-200'} p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-red-400' : 'text-red-600'} mb-4 flex items-center gap-2`}>
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>Deactivate Account</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Temporarily disable your account</p>
            </div>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className={`px-4 py-2 border ${isDark ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' : 'border-orange-500 text-orange-600 hover:bg-orange-50'} rounded-lg transition-colors`}
            >
              Deactivate
            </button>
          </div>
          <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div>
              <p className={isDark ? 'text-gray-200' : 'text-gray-900'}>Delete Account</p>
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>This action cannot be undone</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${isDark ? 'bg-red-900/30' : 'bg-red-100'} p-3 rounded-full`}>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Delete Account</h3>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${isDark ? 'bg-orange-900/30' : 'bg-orange-100'} p-3 rounded-full`}>
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Deactivate Account</h3>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Your account will be temporarily disabled. You can reactivate it anytime by logging in again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
