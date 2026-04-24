import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { SignupPage } from './components/SignupPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { VolunteerDashboard } from './components/volunteer/VolunteerDashboard';
import { NGODashboard } from './components/ngo/NGODashboard';
import { RoleSelection } from './pages/RoleSelection';
import logo from '../imports/logo.jpeg';

import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { useUser } from './contexts/UserContext';
import { useIssues } from './contexts/IssuesContext';

// ─── Auth-aware route guard ───────────────────────────────────────────────────
// While Firebase is still resolving the session, render a neutral loading screen.
// Only redirect to /login after Firebase confirms there is NO authenticated user.
function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: 'citizen' | 'volunteer' | 'ngo';
}) {
  const { userProfile, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Communi-Link" className="h-16 w-auto rounded-xl bg-white p-1" />
          <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const { userProfile, authLoading } = useUser();
  const { issues } = useIssues();

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.username, loginData.password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === 'citizen') navigate('/citizen-dashboard');
        else if (data.role === 'volunteer') navigate('/volunteer-dashboard');
        else if (data.role === 'ngo') navigate('/ngo-dashboard');
        else alert('Unknown role found: ' + data.role);
      } else {
        alert('User profile missing in database.');
      }
    } catch (error: any) {
      console.error(error);
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
    setLoginData({ username: '', password: '' });
  };

  // Shared full-screen loading screen while Firebase resolves auth
  const authLoadingScreen = (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src={logo} alt="Communi-Link" className="h-16 w-auto rounded-xl bg-white p-1" />
        <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/role-selection" />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/signup" element={<SignupPage onBackToLogin={() => navigate('/login')} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage onBackToLogin={() => navigate('/login')} />} />

      <Route path="/login" element={
        // While loading, show spinner. Once resolved, redirect logged-in users away from login.
        authLoading ? authLoadingScreen :
        userProfile ? (
          <Navigate to={
            userProfile.role === 'citizen' ? '/citizen-dashboard' :
            userProfile.role === 'volunteer' ? '/volunteer-dashboard' :
            '/ngo-dashboard'
          } replace />
        ) : (
        <div className="size-full flex items-center justify-center bg-gray-900 min-h-screen">
          <div className="w-full max-w-md px-6">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src={logo}
                  alt="Communi-Link Logo"
                  className="h-24 w-auto object-contain rounded-lg"
                />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="sr-only">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      placeholder="Email"
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="Password"
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-[#3B82F6] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
                >
                  Login
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-[#3B82F6] hover:underline"
                >
                  Sign up
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4">
                <h3 className="text-sm text-gray-300 mb-2">Note</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>Sign up to create an account, or log in with your email and password.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )
      } />

      {/* Protected Routes — guarded by ProtectedRoute which waits for Firebase before deciding */}
      <Route path="/citizen-dashboard" element={
        <ProtectedRoute requiredRole="citizen">
          <CitizenDashboard onLogout={handleLogout} issues={issues} />
        </ProtectedRoute>
      } />
      <Route path="/volunteer-dashboard" element={
        <ProtectedRoute requiredRole="volunteer">
          <VolunteerDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/ngo-dashboard" element={
        <ProtectedRoute requiredRole="ngo">
          <NGODashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}