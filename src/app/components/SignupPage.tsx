import { useState } from 'react';
import { Mail, Lock, Phone, MapPin, Upload, Building2, FileText, Calendar, Globe, User, Briefcase, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { api } from "../../services/api";
import { useUser, type UserProfile } from "../contexts/UserContext";

interface SignupPageProps {
  onBackToLogin: () => void;
}

type UserType = 'volunteer' | 'ngo' | 'citizen';

export function SignupPage({ onBackToLogin }: SignupPageProps) {
  const { setUserProfile } = useUser();
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

      try {
        const savedProfile = await api.createProfile({
          userId: user.uid,
          email,
          role: userType,
          points: 0,
          profilePhoto: null,
          ...profileData
        });
        setUserProfile(savedProfile as unknown as UserProfile);
      } catch (profileError) {
        console.error("Signup profile creation failed:", profileError);
        try {
          await deleteUser(user);
        } catch (cleanupError) {
          console.error("Unable to remove Firebase user after profile creation failed:", cleanupError);
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error("Unable to sign out after profile creation failed:", signOutError);
          }
          alert("We could not save your profile, and the new Firebase account could not be removed automatically. Please contact support before trying again.");
          return;
        }
        alert("We could not save your profile. The newly created account was removed; please try again.");
        return;
      }

      alert("Registration successful!");
      onBackToLogin();
    } catch (error: any) {
      console.error("Signup Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 py-12 px-4 sm:px-6 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">
        <div className="auth-card rounded-2xl bg-white shadow-xl p-6 sm:p-8 ring-1 ring-slate-200">
          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl text-white mb-2">Create an Account</h1>
            <p className="text-slate-600">Join as a Volunteer, NGO, or Citizen</p>
          </div>

          {/* User Type Toggle */}
          <div className="grid grid-cols-3 gap-2 mb-8 bg-slate-50 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('volunteer')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'volunteer'
                ? 'bg-[#0d9488] text-white'
                : 'text-slate-600 hover:text-teal-700'
                }`}
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => setUserType('ngo')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'ngo'
                ? 'bg-[#0d9488] text-white'
                : 'text-slate-600 hover:text-teal-700'
                }`}
            >
              NGO
            </button>
            <button
              type="button"
              onClick={() => setUserType('citizen')}
              className={`py-3 rounded-md transition-all text-sm ${userType === 'citizen'
                ? 'bg-[#0d9488] text-white'
                : 'text-slate-600 hover:text-teal-700'
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
                    <label className="block text-sm text-slate-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Location (City / Area) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Mumbai, Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Skills (Select all that apply) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {skillOptions.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`py-2 px-4 rounded-lg border transition-all ${formData.skills.includes(skill)
                            ? 'bg-[#0d9488] border-[#0d9488] text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-[#0d9488]'
                            }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Availability *</label>
                    <select
                      required
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                    >
                      <option value="">Select availability</option>
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">ID Proof Upload (Aadhar / Student ID / Govt ID) *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'idProof')}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#0d9488] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
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
                      className="mt-1 w-4 h-4 accent-[#0d9488]"
                    />
                    <label className="text-sm text-slate-700">
                      I confirm I am willing to volunteer for social causes *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d9488] text-white py-3 rounded-lg hover:bg-[#0f766e] transition-colors"
                  >
                    Register as Volunteer
                  </button>
                </>
              ) : userType === 'citizen' ? (
                <>
                  {/* Citizen Form */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.citizenFullName}
                        onChange={(e) => setFormData({ ...formData, citizenFullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={formData.citizenEmail}
                        onChange={(e) => setFormData({ ...formData, citizenEmail: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.citizenPassword}
                          onChange={(e) => setFormData({ ...formData, citizenPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.citizenConfirmPassword}
                          onChange={(e) => setFormData({ ...formData, citizenConfirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Location (City / Area) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.citizenLocation}
                        onChange={(e) => setFormData({ ...formData, citizenLocation: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Mumbai, Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Upload ID Proof (Aadhar / Student ID / Govt ID) *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'citizenIdProof')}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#0d9488] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
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
                      className="mt-1 w-4 h-4 accent-[#0d9488]"
                    />
                    <label className="text-sm text-slate-700">
                      I confirm the information provided is accurate *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d9488] text-white py-3 rounded-lg hover:bg-[#0f766e] transition-colors"
                  >
                    Register as Citizen
                  </button>
                </>
              ) : (
                <>
                  {/* NGO Form */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">NGO Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.ngoName}
                        onChange={(e) => setFormData({ ...formData, ngoName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Organization name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Organization Type *</label>
                    <select
                      required
                      value={formData.orgType}
                      onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                    >
                      <option value="">Select organization type</option>
                      {orgTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Registration Number *</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="Registration number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Upload Registration Certificate *</label>
                    <div className="relative">
                      <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'registrationCertificate')}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#0d9488] file:text-white file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                      />
                    </div>
                    {formData.registrationCertificate && (
                      <p className="text-sm text-green-400 mt-1">✓ {formData.registrationCertificate.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Official Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={formData.officialEmail}
                        onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="contact@yourorganization.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={formData.orgPhone}
                        onChange={(e) => setFormData({ ...formData, orgPhone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Organization Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-500" />
                      <textarea
                        required
                        value={formData.orgAddress}
                        onChange={(e) => setFormData({ ...formData, orgAddress: e.target.value })}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all resize-none"
                        placeholder="Full address with city, state, and pincode"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Year of Establishment *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="number"
                        required
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.yearEstablished}
                        onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                        placeholder="2020"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Area of Work *</label>
                    <select
                      required
                      value={formData.areaOfWork}
                      onChange={(e) => setFormData({ ...formData, areaOfWork: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                    >
                      <option value="">Select area of work</option>
                      {areaOfWorkOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-slate-300 pt-5 mt-5">
                    <h3 className="text-lg text-white mb-4">Contact Person Details</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-700 mb-2">Incharge / Contact Person Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={formData.inchargeName}
                            onChange={(e) => setFormData({ ...formData, inchargeName: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                            placeholder="Contact person name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-700 mb-2">Incharge Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="email"
                            required
                            value={formData.inchargeEmail}
                            onChange={(e) => setFormData({ ...formData, inchargeEmail: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                            placeholder="person@yourorganization.org"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-700 mb-2">Incharge Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="tel"
                            required
                            value={formData.inchargePhone}
                            onChange={(e) => setFormData({ ...formData, inchargePhone: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
                            placeholder="+91 9876543210"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Website URL (Optional)</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition-all"
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
                      className="mt-1 w-4 h-4 accent-[#0d9488]"
                    />
                    <label className="text-sm text-slate-700">
                      I confirm this organization is legally registered *
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d9488] text-white py-3 rounded-lg hover:bg-[#0f766e] transition-colors"
                  >
                    Register as NGO
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-[#0d9488] hover:underline">
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
