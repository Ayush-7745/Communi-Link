import { useState } from 'react';
import { Mail, Lock, Phone, MapPin, Upload, Building2, FileText, Calendar, Globe, User, Briefcase, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

interface SignupPageProps {
  onBackToLogin: () => void;
}

type UserType = 'volunteer' | 'ngo' | 'citizen';

export function SignupPage({ onBackToLogin }: SignupPageProps) {
  const initialRole = new URLSearchParams(window.location.search).get("role");
  const defaultRole: UserType = (initialRole === 'citizen' || initialRole === 'ngo' || initialRole === 'volunteer') ? initialRole : 'volunteer';
  const [userType, setUserType] = useState<UserType>(defaultRole);
  const [formData, setFormData] = useState({
    // Volunteer fields
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    skills: [] as string[],
    availability: '',
    idProof: null as File | null,
    volunteerConfirm: false,

    // Citizen fields
    citizenFullName: '',
    citizenEmail: '',
    citizenPassword: '',
    citizenConfirmPassword: '',
    citizenLocation: '',
    citizenIdProof: null as File | null,
    citizenConfirm: false,

    // NGO fields
    ngoName: '',
    orgType: '',
    registrationNumber: '',
    registrationCertificate: null as File | null,
    officialEmail: '',
    orgPhone: '',
    orgAddress: '',
    yearEstablished: '',
    areaOfWork: '',
    inchargeName: '',
    inchargeEmail: '',
    inchargePhone: '',
    website: '',
    ngoConfirm: false,
  });

  const skillOptions = ['Medical', 'Teaching', 'Logistics', 'Technical', 'Construction', 'Food Distribution'];
  const availabilityOptions = ['Full-time', 'Part-time', 'Weekends'];
  const orgTypeOptions = ['NGO', 'Trust', 'Foundation'];
  const areaOfWorkOptions = ['Healthcare', 'Education', 'Food', 'Disaster Relief', 'Environment', 'Women Empowerment'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [fieldName]: file });
    }
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter(s => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills: newSkills });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let email = '';
    let password = '';
    let confirm = '';
    let profileData: any = {};

    if (userType === 'volunteer') {
      email = formData.email;
      password = formData.password;
      confirm = formData.confirmPassword;
      profileData = {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        skills: formData.skills,
        availability: formData.availability,
      };
    } else if (userType === 'citizen') {
      email = formData.citizenEmail;
      password = formData.citizenPassword;
      confirm = formData.citizenConfirmPassword;
      profileData = {
        fullName: formData.citizenFullName,
        location: formData.citizenLocation,
      };
    } else if (userType === 'ngo') {
      email = formData.officialEmail;
      password = formData.password;
      confirm = formData.confirmPassword;
      profileData = {
        fullName: formData.ngoName, // Using NGO name as fullName for UI compatibility
        orgType: formData.orgType,
        registrationNumber: formData.registrationNumber,
        phone: formData.orgPhone,
        orgAddress: formData.orgAddress,
        yearEstablished: formData.yearEstablished,
        areaOfWork: formData.areaOfWork,
        inchargeName: formData.inchargeName,
        inchargeEmail: formData.inchargeEmail,
        inchargePhone: formData.inchargePhone,
        website: formData.website,
      };
    }

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: email,
        role: userType,
        points: 0,
        profilePhoto: null,
        ...profileData
      });

      alert("Registration successful!");
      onBackToLogin();
    } catch (error: any) {
      console.error("Signup Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-6 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl text-white mb-2">Create an Account</h1>
            <p className="text-gray-400">Join as a Volunteer, NGO, or Citizen</p>
          </div>

          {/* User Type Toggle */}
          <div className="grid grid-cols-3 gap-2 mb-8 bg-gray-900 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('volunteer')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'volunteer'
                ? 'bg-[#3B82F6] text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => setUserType('ngo')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'ngo'
                ? 'bg-[#3B82F6] text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              NGO
            </button>
            <button
              type="button"
              onClick={() => setUserType('citizen')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'citizen'
                ? 'bg-[#3B82F6] text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Citizen
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div key={userType}>
              {userType === 'volunteer' ? (
                <>
                  {/* Volunteer Form */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Location (City / Area) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Mumbai, Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Skills (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {skillOptions.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`py-2 px-4 rounded-lg border transition-all ${formData.skills.includes(skill)
                            ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-[#3B82F6]'
                            }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Availability *</label>
                    <select
                      required
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    >
                      <option value="">Select availability</option>
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">ID Proof Upload (Aadhar / Student ID / Govt ID) *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'idProof')}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#3B82F6] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      />
                    </div>
                    {formData.idProof && (
                      <p className="text-sm text-green-400 mt-1">✓ {formData.idProof.name}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={formData.volunteerConfirm}
                      onChange={(e) => setFormData({ ...formData, volunteerConfirm: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#3B82F6]"
                    />
                    <label className="text-sm text-gray-300">
                      I confirm I am willing to volunteer for social causes *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
                  >
                    Register as Volunteer
                  </button>
                </>
              ) : userType === 'citizen' ? (
                <>
                  {/* Citizen Form */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.citizenFullName}
                        onChange={(e) => setFormData({ ...formData, citizenFullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={formData.citizenEmail}
                        onChange={(e) => setFormData({ ...formData, citizenEmail: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.citizenPassword}
                          onChange={(e) => setFormData({ ...formData, citizenPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.citizenConfirmPassword}
                          onChange={(e) => setFormData({ ...formData, citizenConfirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Location (City / Area) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.citizenLocation}
                        onChange={(e) => setFormData({ ...formData, citizenLocation: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Mumbai, Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Upload ID Proof (Aadhar / Student ID / Govt ID) *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'citizenIdProof')}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#3B82F6] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      />
                    </div>
                    {formData.citizenIdProof && (
                      <p className="text-sm text-green-400 mt-1">✓ {formData.citizenIdProof.name}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={formData.citizenConfirm}
                      onChange={(e) => setFormData({ ...formData, citizenConfirm: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#3B82F6]"
                    />
                    <label className="text-sm text-gray-300">
                      I confirm the information provided is accurate *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
                  >
                    Register as Citizen
                  </button>
                </>
              ) : (
                <>
                  {/* NGO Form */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">NGO Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.ngoName}
                        onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Organization name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Organization Type *</label>
                    <select
                      required
                      value={formData.orgType}
                      onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    >
                      <option value="">Select organization type</option>
                      {orgTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Registration Number *</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="Registration number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Upload Registration Certificate *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'registrationCertificate')}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#3B82F6] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                      />
                    </div>
                    {formData.registrationCertificate && (
                      <p className="text-sm text-green-400 mt-1">✓ {formData.registrationCertificate.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Official Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={formData.officialEmail}
                        onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="contact@yourorganization.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={formData.orgPhone}
                        onChange={(e) => setFormData({ ...formData, orgPhone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Organization Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                      <textarea
                        required
                        value={formData.orgAddress}
                        onChange={(e) => setFormData({ ...formData, orgAddress: e.target.value })}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all resize-none"
                        placeholder="Full address with city, state, and pincode"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Year of Establishment *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="number"
                        required
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.yearEstablished}
                        onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="2020"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Area of Work *</label>
                    <select
                      required
                      value={formData.areaOfWork}
                      onChange={(e) => setFormData({ ...formData, areaOfWork: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    >
                      <option value="">Select area of work</option>
                      {areaOfWorkOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-700 pt-5 mt-5">
                    <h3 className="text-lg text-white mb-4">Contact Person Details</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Incharge / Contact Person Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            required
                            value={formData.inchargeName}
                            onChange={(e) => setFormData({ ...formData, inchargeName: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                            placeholder="Contact person name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Incharge Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="email"
                            required
                            value={formData.inchargeEmail}
                            onChange={(e) => setFormData({ ...formData, inchargeEmail: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                            placeholder="person@yourorganization.org"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Incharge Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="tel"
                            required
                            value={formData.inchargePhone}
                            onChange={(e) => setFormData({ ...formData, inchargePhone: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                            placeholder="+91 9876543210"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Website URL (Optional)</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                        placeholder="https://www.yourorganization.org"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={formData.ngoConfirm}
                      onChange={(e) => setFormData({ ...formData, ngoConfirm: e.target.checked })}
                      className="mt-1 w-4 h-4 accent-[#3B82F6]"
                    />
                    <label className="text-sm text-gray-300">
                      I confirm this organization is legally registered *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
                  >
                    Register as NGO
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-[#3B82F6] hover:underline">
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
