import { useState, useEffect } from 'react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, MapPin } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { api, pollEvery, resolveLocation } from '../../../services/api';
import { getIssueStatusPresentation, ISSUE_STATUS } from '../../../utils/issueStatus';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export function LiveTracking() {
  const { issues, issuesError, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { userProfile, currentUserLocation } = useUser();
  const ngoLocation = currentUserLocation || resolveLocation(userProfile?.location) || null;

  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    return pollEvery(
      api.getVolunteers,
      (users) => setVolunteers(users.map((data) => {
        const location = data.location as { lat?: number; lng?: number } | undefined;
        return {
          ...data,
          id: String(data.userId || ''),
          volLat: typeof location?.lat === 'number' ? location.lat : null,
          volLng: typeof location?.lng === 'number' ? location.lng : null,
        };
      }).filter((volunteer) => volunteer.id))
    );
  }, [ngoLocation?.lat, ngoLocation?.lng]);

  const activeTasks = issues.filter(i => i.status === ISSUE_STATUS.ASSIGNED || i.status === ISSUE_STATUS.COMPLETED);
  const incomingIssues = issues.filter(i => i.status === ISSUE_STATUS.PENDING || i.status === ISSUE_STATUS.APPROVED);

  const onTaskVolunteersIds = activeTasks.map(i => i.assignedVolunteerId);

  const formattedVolunteers = volunteers.map(v => {
    const isOnTask = onTaskVolunteersIds.includes(v.id);
    return {
      ...v,
      statusStr: isOnTask ? 'On Task' : 'Available',
    };
  });

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Live Tracking</h1>
      {issuesError && <p role="alert" className="text-sm text-red-600">{issuesError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                <span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span>
                Active Tasks
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{activeTasks.length}</span>
            </div>

            {activeTasks.length === 0 ? (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No active tasks being tracked</p>
            ) : (
              <ul className="space-y-3">
                {activeTasks.map(task => (
                  <li key={task.id} className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${task.urgency === 'High' ? 'bg-red-100 text-red-700' : task.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{task.urgency}</span>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex flex-col gap-1`}>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 📍 {typeof task.lat === 'number' ? task.lat.toFixed(4) : task.lat}, {typeof task.lng === 'number' ? task.lng.toFixed(4) : task.lng}</span>
                      <span className="flex items-center gap-1 text-purple-600"><User className="w-3 h-3" /> {volunteers.find(v => v.id === task.assignedVolunteerId)?.fullName || volunteers.find(v => v.id === task.assignedVolunteerId)?.name || task.assignedVolunteerId}</span>
                    </div>
                    {task.status === ISSUE_STATUS.COMPLETED && (
                      <button
                        type="button"
                        onClick={() => void updateIssue(task.id!, { status: ISSUE_STATUS.VERIFIED })}
                        className="mt-3 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Verify
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 h-fit max-h-[800px] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              <span className="w-3 h-3 bg-purple-500 rounded-full inline-block"></span>
              Volunteer Status
            </h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{formattedVolunteers.length} active</span>
          </div>

          {formattedVolunteers.length === 0 ? (
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No volunteers found</p>
          ) : (
            <ul className="space-y-3">
              {formattedVolunteers.map(vol => (
                <li key={vol.id} className={`p-4 flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-white'} border-b ${isDark ? 'border-gray-600' : 'border-gray-100'} last:border-0`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 text-white flex items-center justify-center rounded-full font-bold">
                      {(vol.fullName || vol.name || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{vol.fullName || vol.name || 'Volunteer User'}</h3>
                      <div className="flex items-center text-xs mt-1 text-gray-500 gap-1">
                        <span className={`w-2 h-2 rounded-full ${vol.statusStr === 'On Task' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                        {vol.statusStr}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${vol.statusStr === 'On Task' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {vol.statusStr}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 100% Width Incoming Issues */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 w-full`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
            Incoming Issues
          </h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{incomingIssues.filter(i => i.status === ISSUE_STATUS.PENDING).length} pending</span>
        </div>

        {incomingIssues.length === 0 ? (
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No incoming issues</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {incomingIssues.map(task => (
              <li key={task.id} className={`p-4 flex flex-col justify-between ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded-sm ${task.status === ISSUE_STATUS.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {getIssueStatusPresentation(task.status).label}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-sm">{task.category}</span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-sm">{task.urgency} urgency</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
