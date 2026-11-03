import { AlertCircle, Clock, CheckCircle, Inbox, TrendingUp, AlertTriangle, Users, Star, ClipboardCheck } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { MapView } from '../citizen/MapView';
import { api, pollEvery } from '../../../services/api';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

interface NGOHomeProps {
  onViewIssue: (issueId: string) => void;
}

export function NGOHome({ onViewIssue }: NGOHomeProps) {
  const { issues, issuesLoading, issuesError } = useIssues();
  const { userProfile, currentUserLocation } = useUser();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [fetchedVolunteers, setFetchedVolunteers] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const { updateIssue } = useIssues();

  const resolveLocation = (loc: any) => {
    if (!loc) return null;
    if (typeof loc === 'object' && 'lat' in loc && 'lng' in loc) {
      return { lat: Number(loc.lat), lng: Number(loc.lng) };
    }
    if (typeof loc === 'string' && loc.includes(',')) {
      const parts = loc.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }
    return null;
  };

  const ngoLocation = currentUserLocation || resolveLocation(userProfile?.location) || null;

  useEffect(() => {
    return pollEvery(
      api.getVolunteers,
      (users) => setFetchedVolunteers(users.map((data) => {
        const location = data.location as { lat?: number; lng?: number } | undefined;
        return {
          ...data,
          id: String(data.userId || ''),
          name: data.fullName || data.name || 'Volunteer',
          rating: typeof data.rating === 'number' ? data.rating : 4.5,
          tasksCompleted: typeof data.tasksCompleted === 'number' ? data.tasksCompleted : 0,
          skills: Array.isArray(data.skills)
            ? data.skills.filter((skill: unknown): skill is string => typeof skill === 'string')
            : ['Helper'],
          availability: data.availability || 'Flexible',
          volLat: typeof location?.lat === 'number' ? location.lat : null,
          volLng: typeof location?.lng === 'number' ? location.lng : null,
        };
      }).filter((volunteer) => volunteer.id))
    );
  }, [ngoLocation?.lat, ngoLocation?.lng]);

  const recommendedVolunteers = fetchedVolunteers
    .map((volunteer) => ({
      ...volunteer,
      tasksCompleted: issues.filter((issue) =>
        issue.assignedVolunteerId === volunteer.id && issue.status === 'verified'
      ).length,
    }))
    .filter((volunteer) => {
      if (!ngoLocation || volunteer.volLat === null || volunteer.volLng === null) return true;
      return getDistance(ngoLocation.lat, ngoLocation.lng, volunteer.volLat, volunteer.volLng) <= 15;
    })
    .slice(0, 3);

  const totalIssues = issues.length;
  const pendingApproval = issues.filter(i => i.status === 'pending').length;
  const activeTasks = issues.filter(i => i.status === 'assigned' || i.status === 'approved').length;
  const pendingVerifications = issues.filter(i => i.status === 'completed').length;
  const completedTasks = issues.filter(i => i.status === 'verified').length;

  const stats = [
    { label: 'Total Issues Reported', value: totalIssues, icon: AlertCircle, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Pending Approval', value: pendingApproval, icon: Inbox, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Active Tasks', value: activeTasks, icon: Clock, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Pending Verification', value: pendingVerifications, icon: ClipboardCheck, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50' },
  ];

  // High priority issues
  const highPriorityIssues = issues.filter(i => i.urgency === 'High' && i.status === 'pending').slice(0, 3);

  // Recent activity
  const recentActivity = issues.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'assigned':
      case 'completed':
        return 'bg-orange-100 text-orange-700';
      case 'verified': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>NGO Command Center</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage community issues and coordinate volunteers</p>
      </div>
      {issuesError && <p role="alert" className="text-sm text-red-600">{issuesError}</p>}
      {issuesLoading && <p className="text-sm text-gray-500">Loading issues...</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{stat.value}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Map Issue Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Active Issue Map
        </h2>
        <MapView issues={issues.filter(i => i.status === "approved" || i.status === "assigned" || i.status === "completed")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Alerts */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border hover:shadow-md transition-shadow`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>High Priority Alerts</h2>
            </div>
          </div>
          <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {highPriorityIssues.length === 0 ? (
              <div className="p-6 text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No high priority issues</p>
              </div>
            ) : (
              highPriorityIssues.map((issue) => (
                <div key={issue.id} className={`p-4 ${isDark ? 'hover:bg-gray-700 border-l-4 border-l-red-600' : 'hover:bg-red-50 border-l-4 border-l-red-500'} transition-all`}>
                  <div className="flex items-start gap-4">


                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-medium truncate`}>{issue.title}</h3>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        📍 {typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}
                      </p>

                      {((issue.proofImages && issue.proofImages.length > 0) || issue.imageUrl) && (
                        <div className="mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open((issue.proofImages && issue.proofImages.length > 0) ? issue.proofImages[0] : (issue.imageUrl || ''), '_blank');
                            }}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Click here to view attached image
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">
                          ⚠️ {issue.urgency}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          {issue.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => issue.id && onViewIssue(issue.id)}
                      className="px-3 py-1.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-xs whitespace-nowrap self-center"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Recent Activity</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {recentActivity.map((issue) => (
              <div key={issue.id} onClick={() => onViewIssue(issue.id!)} className={`p-4 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                        {issue.status === 'verified' && <CheckCircle className="inline w-3 h-3 mr-1" aria-hidden="true" />}
                        {issue.status === 'completed' || issue.status === 'assigned' ? 'In Progress' : issue.status === 'verified' ? 'Verified' : issue.status}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{issue.category} • {issue.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Recommendation Panel */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border hover:shadow-md transition-shadow`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0d9488]" />
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Recommended Volunteers</h2>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Top volunteers based on skills and performance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedVolunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 hover:border-[#0d9488] hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-[#0d9488] rounded-full flex items-center justify-center text-white font-semibold">
                    {volunteer.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{volunteer.rating}</span>
                  </div>
                </div>
                <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} mb-2`}>{volunteer.name}</h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {volunteer.skills.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  <span>{volunteer.availability}</span>
                  <span>{volunteer.tasksCompleted} tasks</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedVolunteer(volunteer);
                    setShowAssignModal(true);
                  }}
                  className="w-full px-3 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-sm"
                >
                  Quick Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAssignModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-baseline pt-20 justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full`}>
            <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Assign Task to {selectedVolunteer.name}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 text-sm`}>Select an approved task to assign to this volunteer</p>
            <div className="max-h-[400px] overflow-y-auto space-y-3 mb-4">
              {issues.filter(i => i.status === 'approved').length === 0 && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No approved tasks available.</p>
              )}
              {issues.filter(i => i.status === 'approved').map(task => (
                <div key={task.id} className={`p-3 border rounded-lg flex flex-col gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${task.urgency === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{task.urgency}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (task.id) {
                        const assigned = await updateIssue(task.id, {
                          status: 'assigned',
                          assignedVolunteerId: selectedVolunteer.id
                        });
                        if (!assigned) return;
                        setShowAssignModal(false);
                        setSelectedVolunteer(null);
                      }
                    }}
                    className="self-start text-xs bg-[#0d9488] text-white px-3 py-1.5 rounded hover:bg-[#0f766e]"
                  >
                    Assign Here
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedVolunteer(null);
              }}
              className={`w-full py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
