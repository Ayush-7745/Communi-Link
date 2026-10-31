import { useState, useEffect } from 'react';
import { Home, Inbox, ClipboardList, Users, Activity, BarChart3, Bell, Settings, LogOut, Search, Menu, X, CheckSquare } from 'lucide-react';
import logo from '../../../imports/logo.jpeg';

import { NGOHome } from './NGOHome';
import { IncomingIssues } from './IncomingIssues';
import { IssueVerification } from './IssueVerification';
import { TaskManagement } from './TaskManagement';
import { VolunteerManagement } from './VolunteerManagement';
import { LiveTracking } from './LiveTracking';
import { Analytics } from './Analytics';
import { NGONotifications } from './NGONotifications';
import { NGOSettings } from './NGOSettings';
import { IssueDetailsNGO } from './IssueDetailsNGO';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface NGODashboardProps {
  onLogout: () => void;
}

type PageType = 'dashboard' | 'incoming-issues' | 'issue-verification' | 'task-management' | 'volunteers' | 'live-tracking' | 'analytics' | 'notifications' | 'settings' | 'issue-details';

export function NGODashboard({ onLogout }: NGODashboardProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [previousPage, setPreviousPage] = useState<PageType>('dashboard');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();

  const isDark = effectiveTheme === 'dark';

  // Handle browser back button to stay on the dashboard or return to 'dashboard' sub-page
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (currentPage !== 'dashboard') {
        setCurrentPage('dashboard');
        window.history.pushState(null, '', window.location.href);
      } else {
        // If already on dashboard, stay on dashboard
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPage]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'incoming-issues', label: 'Incoming Issues', icon: Inbox },
    { id: 'issue-verification', label: 'Issue Verification', icon: CheckSquare },
    { id: 'task-management', label: 'Task Management', icon: ClipboardList },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'live-tracking', label: 'Live Tracking', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleViewIssue = (issueId: string) => {
    setSelectedIssueId(issueId);
    setPreviousPage(currentPage);
    setCurrentPage('issue-details');
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-center w-full">
              <img src={logo} alt="Communi-Link" className="h-16 w-auto object-contain rounded-lg" />
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`md:hidden ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as PageType);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#0d9488] text-white'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`md:hidden ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className={`hidden md:flex items-center gap-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-4 py-2 w-96`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues, volunteers..."
                  className={`bg-transparent outline-none w-full ${isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('notifications')}
                className={`relative p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                {userProfile?.profilePhoto ? (
                  <img
                    src={userProfile.profilePhoto}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : userProfile?.fullName ? (
                  <div className="w-10 h-10 bg-[#0d9488] rounded-full flex items-center justify-center text-white font-bold">
                    {userProfile.fullName.charAt(0)}
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-[#0d9488] rounded-full flex items-center justify-center text-white font-bold">
                    N
                  </div>
                )}
                <div className="hidden md:block">
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{userProfile?.fullName || "NGO Organization"}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userProfile?.email || "ngo@demo.com"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {currentPage === 'dashboard' && <NGOHome onViewIssue={handleViewIssue} />}
          {currentPage === 'incoming-issues' && <IncomingIssues onViewIssue={handleViewIssue} />}
          {currentPage === 'issue-verification' && <IssueVerification onViewIssue={handleViewIssue} />}
          {currentPage === 'task-management' && <TaskManagement onViewIssue={handleViewIssue} />}
          {currentPage === 'volunteers' && <VolunteerManagement />}
          {currentPage === 'live-tracking' && <LiveTracking />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'notifications' && <NGONotifications onViewIssue={handleViewIssue} />}
          {currentPage === 'settings' && <NGOSettings />}
          {currentPage === 'issue-details' && selectedIssueId && (
            <IssueDetailsNGO issueId={selectedIssueId} onBack={() => setCurrentPage(previousPage)} />
          )}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Confirm Logout</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
