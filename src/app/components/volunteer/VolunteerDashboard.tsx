import { useState, useEffect } from 'react';
import { Home, ClipboardList, CheckSquare, Activity, Bell, Settings, LogOut, Search, Menu, X } from 'lucide-react';
import logo from '../../../imports/logo.jpeg';

import { VolunteerHome } from './VolunteerHome';
import { AvailableTasks } from './AvailableTasks';
import { MyTasks } from './MyTasks';
import { TaskHistory } from './TaskHistory';
import { VolunteerNotifications } from './VolunteerNotifications';
import { VolunteerSettings } from './VolunteerSettings';
import { TaskDetails } from './TaskDetails';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useIssues } from '../../contexts/IssuesContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ReportIssue } from "./ReportIssue";

interface VolunteerDashboardProps {
  onLogout: () => void;
}

type PageType =
  | 'dashboard'
  | 'available-tasks'
  | 'my-tasks'
  | 'task-details'
  | 'history'
  | 'notifications'
  | 'settings'
  | 'report';
export function VolunteerDashboard({ onLogout }: VolunteerDashboardProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();
  const { issues } = useIssues();

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

  // Calculate counts
  const myTasksCount = issues.filter(
    i =>
      i.assignedVolunteerId === userProfile?.userId &&
      i.status !== "completed"
  ).length;
  const { notifications } = useNotifications();

  const notificationsCount = notifications.filter(n => !n.read).length

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, count: null },
    { id: 'available-tasks', label: 'Available Tasks', icon: ClipboardList, count: null },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare, count: myTasksCount },
    { id: 'report', label: 'Report New Issue', icon: ClipboardList, count: null },
    { id: 'history', label: 'Activity', icon: Activity, count: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notificationsCount },
    { id: 'settings', label: 'Settings', icon: Settings, count: null },
  ];

  const handleViewTaskDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('task-details');
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-50' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 ${isDark ? 'bg-white border-slate-300' : 'bg-white border-gray-200'} border-r transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex h-16 shrink-0 items-center justify-between border-b px-4 ${isDark ? 'border-slate-300' : 'border-gray-200'}`}>
            <div className="flex items-center justify-center w-full">
              <img src={logo} alt="Communi-Link" className="h-12 max-w-full w-auto object-contain rounded-lg" />
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`md:hidden ${isDark ? 'text-slate-600 hover:text-gray-200' : 'text-slate-500 hover:text-gray-700'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
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
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#0d9488] text-white'
                    : isDark
                      ? 'text-slate-700 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== null && item.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500 text-white'
                      }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-300' : 'border-gray-200'}`}>
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
        <header className={`${isDark ? 'bg-white border-slate-300' : 'bg-white border-gray-200'} flex h-16 shrink-0 items-center border-b px-6`}>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`md:hidden ${isDark ? 'text-slate-600 hover:text-gray-200' : 'text-slate-500 hover:text-gray-700'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className={`hidden md:flex items-center gap-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-4 py-2 w-96`}>
                <Search className="w-5 h-5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className={`bg-transparent outline-none w-full ${isDark ? 'text-gray-200 placeholder-slate-400' : 'text-gray-700 placeholder-gray-400'}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('notifications')}
                className={`relative p-2 ${isDark ? 'text-slate-600 hover:text-gray-200 hover:bg-gray-700' : 'text-slate-500 hover:text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <Bell className="w-6 h-6" />
                {notificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
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
                    V
                  </div>
                )}
                <div className="hidden md:block">
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {userProfile?.fullName || "Volunteer"}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                    {userProfile?.email || "volunteer@demo.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-slate-50' : 'bg-gray-50'}`}>
          {currentPage === 'dashboard' && <VolunteerHome onViewTask={handleViewTaskDetails} />}
          {currentPage === 'available-tasks' && <AvailableTasks onViewTask={handleViewTaskDetails} />}
          {currentPage === 'my-tasks' && <MyTasks onViewTask={handleViewTaskDetails} />}
          {currentPage === 'task-details' && selectedTaskId && (
            <TaskDetails taskId={selectedTaskId} onBack={() => setCurrentPage('my-tasks')} />
          )}
          {currentPage === 'history' && <TaskHistory />}
          {currentPage === 'notifications' && <VolunteerNotifications />}
          {currentPage === 'settings' && <VolunteerSettings />}
          {currentPage === 'report' && <ReportIssue />}

        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className={`${isDark ? 'bg-white' : 'bg-white'} rounded-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Confirm Logout</h3>
            <p className={`${isDark ? 'text-slate-600' : 'text-gray-600'} mb-6`}>Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 text-slate-700 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
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
