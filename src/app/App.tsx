import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { SignupPage } from './components/SignupPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { VolunteerDashboard } from './components/volunteer/VolunteerDashboard';
import { NGODashboard } from './components/ngo/NGODashboard';
import { RoleSelection } from './pages/RoleSelection';
import logo from '../imports/logo.jpeg';

import { auth } from "../config/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { api, ApiError } from "../services/api";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { useUser } from './contexts/UserContext';
import { useIssues } from './contexts/IssuesContext';

const getDashboardPath = (role: unknown) => {
  if (role === 'citizen') return '/citizen-dashboard';
  if (role === 'volunteer') return '/volunteer-dashboard';
  if (role === 'ngo') return '/ngo-dashboard';
  return null;
};

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
  const { userProfile, authUser, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Communi-Link" className="h-16 w-auto rounded-xl bg-white p-1" />
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!authUser || !userProfile || userProfile.userId !== authUser.uid || userProfile.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const { userProfile, authUser, authLoading, authProfileError, authProfileMissing, clearSessionState } = useUser();
  const { issues } = useIssues();

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, loginData.username, loginData.password);
      try {
        const profile = await api.getProfile();
        const dashboardPath = getDashboardPath(profile.role);
        if (dashboardPath) navigate(dashboardPath);
        else alert('Unknown role found: ' + profile.role);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          return;
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error(error);
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearSessionState();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Unable to log out. Please try again.');
      return;
    }

    navigate('/login');
    setLoginData({ username: '', password: '' });
  };

  // Shared full-screen loading screen while Firebase resolves auth
  const authLoadingScreen = (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src={logo} alt="Communi-Link" className="h-16 w-auto rounded-xl bg-white p-1" />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
        authUser ? (
          <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8 ring-1 ring-slate-200">
              <h1 className="text-xl font-semibold text-slate-800">
                {authProfileMissing ? 'Your profile is missing' : 'Unable to load your profile'}
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                {authProfileMissing
                  ? 'This account does not have a CommuniLink profile. Please sign up with email and password or contact support if you believe this is an error.'
                  : authProfileError
                    ? 'We could not reach your profile right now. Please try again later or contact support if the problem continues.'
                    : 'Your profile is being checked. Please wait a moment or log out and try again.'}
              </p>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-6 w-full bg-primary text-white py-3 rounded-lg hover:bg-teal-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        ) :
        <div className="size-full flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 min-h-screen px-4 py-8">
          <div className="w-full max-w-md px-6">
            <div className="auth-card rounded-2xl bg-white shadow-xl p-8 ring-1 ring-slate-200">
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
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-teal-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Login
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                <h3 className="text-sm text-slate-800 mb-2">Note</h3>
                <div className="space-y-1 text-xs text-slate-600">
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