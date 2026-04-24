import { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, CheckCircle, Phone, FileText, Upload, Building2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

type RecoveryType = 'volunteer' | 'ngo';

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [recoveryType, setRecoveryType] = useState<RecoveryType>('volunteer');
  const [formData, setFormData] = useState({
    // Volunteer/Citizen fields
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',

    // NGO fields
    ngoName: '',
    ngoEmail: '',
    registrationNumber: '',
    inchargeName: '',
    inchargeEmail: '',
    registrationCertificate: null as File | null,
    ngoNewPassword: '',
    ngoConfirmPassword: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, registrationCertificate: file });
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (recoveryType === 'volunteer') {
      // Validate email
      if (!validateEmail(formData.email)) {
        setErrors({ ...errors, email: 'Please enter a valid email address' });
        return;
      }

      // Validate password match
      if (formData.newPassword !== formData.confirmPassword) {
        setErrors({ ...errors, password: 'Passwords do not match' });
        return;
      }
    } else {
      // NGO validation
      if (!validateEmail(formData.ngoEmail)) {
        setErrors({ ...errors, email: 'Please enter a valid email address' });
        return;
      }

      if (formData.ngoNewPassword !== formData.ngoConfirmPassword) {
        setErrors({ ...errors, password: 'Passwords do not match' });
        return;
      }
    }

    // Clear errors and show success
    setErrors({ email: '', password: '' });
    setShowSuccess(true);
  };

  const isFormValid = () => {
    if (recoveryType === 'volunteer') {
      return (
        formData.username.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.newPassword.trim() !== '' &&
        formData.confirmPassword.trim() !== ''
      );
    } else {
      return (
        formData.ngoName.trim() !== '' &&
        formData.ngoEmail.trim() !== '' &&
        formData.registrationNumber.trim() !== '' &&
        formData.inchargeName.trim() !== '' &&
        formData.inchargeEmail.trim() !== '' &&
        formData.registrationCertificate !== null &&
        formData.ngoNewPassword.trim() !== '' &&
        formData.ngoConfirmPassword.trim() !== ''
      );
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-500 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl text-white mb-3">Recovery Email Sent Successfully!</h1>
              <p className="text-gray-400">
                Please check your email to complete the password reset process
              </p>
            </div>

            {/* Back to Login Button */}
            <button
              onClick={onBackToLogin}
              className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Title and Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl text-white mb-2">
              {recoveryType === 'volunteer' ? 'Forgot Password' : 'Recover NGO Account'}
            </h1>
            <p className="text-gray-400">
              {recoveryType === 'volunteer'
                ? 'Recover your account by entering your details'
                : 'Verify your organization details to reset your password'}
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="flex gap-2 mb-8 bg-gray-900 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setRecoveryType('volunteer')}
              className={`flex-1 py-3 rounded-md transition-all ${
                recoveryType === 'volunteer'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Volunteer / Citizen
            </button>
            <button
              type="button"
              onClick={() => setRecoveryType('ngo')}
              className={`flex-1 py-3 rounded-md transition-all ${
                recoveryType === 'ngo'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              NGO
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div key={recoveryType}>
            {recoveryType === 'volunteer' ? (
              <>
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm text-gray-300 mb-2">
                Username (or Full Name) *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  id="username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Registered Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-300 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  id="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, newPassword: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

              </>
            ) : (
              <>
                {/* NGO Form */}
                <div>
                  <label htmlFor="ngoName" className="block text-sm text-gray-300 mb-2">
                    NGO Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      id="ngoName"
                      required
                      value={formData.ngoName}
                      onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="Organization name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ngoEmail" className="block text-sm text-gray-300 mb-2">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      id="ngoEmail"
                      required
                      value={formData.ngoEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoEmail: e.target.value });
                        setErrors({ ...errors, email: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="contact@yourorganization.org"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm text-gray-300 mb-2">
                    Registration Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      id="registrationNumber"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="Registration number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inchargeName" className="block text-sm text-gray-300 mb-2">
                    Incharge / Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      id="inchargeName"
                      required
                      value={formData.inchargeName}
                      onChange={(e) => setFormData({ ...formData, inchargeName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inchargeEmail" className="block text-sm text-gray-300 mb-2">
                    Incharge Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      id="inchargeEmail"
                      required
                      value={formData.inchargeEmail}
                      onChange={(e) => setFormData({ ...formData, inchargeEmail: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="person@yourorganization.org"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Upload Registration Certificate (for verification) *
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#3B82F6] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    />
                  </div>
                  {formData.registrationCertificate && (
                    <p className="text-sm text-green-400 mt-1">✓ {formData.registrationCertificate.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ngoNewPassword" className="block text-sm text-gray-300 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      id="ngoNewPassword"
                      required
                      value={formData.ngoNewPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoNewPassword: e.target.value });
                        setErrors({ ...errors, password: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ngoConfirmPassword" className="block text-sm text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      id="ngoConfirmPassword"
                      required
                      value={formData.ngoConfirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoConfirmPassword: e.target.value });
                        setErrors({ ...errors, password: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>
              </>
            )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Recovery Email
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
