import { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, CheckCircle, Phone, FileText, Upload, Building2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = recoveryType === 'volunteer' ? formData.email : formData.ngoEmail;
    if (!validateEmail(email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }

    setErrors({ email: '', password: '' });
    try {
      await sendPasswordResetEmail(auth, email);
      setShowSuccess(true);
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : code === 'auth/too-many-requests'
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Unable to send a password reset email. Please try again.';
      setErrors({ email: message, password: '' });
    }
  };

  const isFormValid = () => {
    const email = recoveryType === 'volunteer' ? formData.email : formData.ngoEmail;
    return validateEmail(email);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <div className="auth-card rounded-2xl bg-white shadow-xl p-6 sm:p-8 ring-1 ring-slate-200">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-700 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl text-white mb-3">Recovery Email Sent Successfully!</h1>
              <p className="text-slate-600">
                Please check your email to complete the password reset process
              </p>
            </div>

            {/* Back to Login Button */}
            <button
              onClick={onBackToLogin}
              className="w-full bg-[#0d9488] text-white py-3 rounded-lg hover:bg-[#0f766e] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        <div className="auth-card rounded-2xl bg-white shadow-xl p-6 sm:p-8 ring-1 ring-slate-200">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Title and Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl text-white mb-2">
              {recoveryType === 'volunteer' ? 'Forgot Password' : 'Recover NGO Account'}
            </h1>
            <p className="text-slate-600">
              {recoveryType === 'volunteer'
                ? 'Recover your account by entering your details'
                : 'Verify your organization details to reset your password'}
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="flex gap-2 mb-8 bg-slate-50 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setRecoveryType('volunteer')}
              className={`flex-1 py-3 rounded-md transition-all ${
                recoveryType === 'volunteer'
                  ? 'bg-[#0d9488] text-white'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Volunteer / Citizen
            </button>
            <button
              type="button"
              onClick={() => setRecoveryType('ngo')}
              className={`flex-1 py-3 rounded-md transition-all ${
                recoveryType === 'ngo'
                  ? 'bg-[#0d9488] text-white'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              NGO
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div key={recoveryType}>
            {recoveryType === 'volunteer' ? (
              <>
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm text-slate-700 mb-2">
                Username (or Full Name) *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  id="username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-slate-700 mb-2">
                Registered Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm text-slate-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  id="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, newPassword: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-slate-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
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
                  <label htmlFor="ngoName" className="block text-sm text-slate-700 mb-2">
                    NGO Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      id="ngoName"
                      required
                      value={formData.ngoName}
                      onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="Organization name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ngoEmail" className="block text-sm text-slate-700 mb-2">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      id="ngoEmail"
                      required
                      value={formData.ngoEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoEmail: e.target.value });
                        setErrors({ ...errors, email: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="contact@yourorganization.org"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm text-slate-700 mb-2">
                    Registration Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      id="registrationNumber"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="Registration number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inchargeName" className="block text-sm text-slate-700 mb-2">
                    Incharge / Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      id="inchargeName"
                      required
                      value={formData.inchargeName}
                      onChange={(e) => setFormData({ ...formData, inchargeName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inchargeEmail" className="block text-sm text-slate-700 mb-2">
                    Incharge Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      id="inchargeEmail"
                      required
                      value={formData.inchargeEmail}
                      onChange={(e) => setFormData({ ...formData, inchargeEmail: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="person@yourorganization.org"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Upload Registration Certificate (for verification) *
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#0d9488] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                    />
                  </div>
                  {formData.registrationCertificate && (
                    <p className="text-sm text-green-400 mt-1">✓ {formData.registrationCertificate.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ngoNewPassword" className="block text-sm text-slate-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      id="ngoNewPassword"
                      required
                      value={formData.ngoNewPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoNewPassword: e.target.value });
                        setErrors({ ...errors, password: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ngoConfirmPassword" className="block text-sm text-slate-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      id="ngoConfirmPassword"
                      required
                      value={formData.ngoConfirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, ngoConfirmPassword: e.target.value });
                        setErrors({ ...errors, password: '' });
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
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
              className="w-full bg-[#0d9488] text-white py-3 rounded-lg hover:bg-[#0f766e] transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Recovery Email
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
