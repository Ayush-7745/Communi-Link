import { MapPin, Calendar, Eye, AlertTriangle, Clock, X, Navigation } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../../services/api';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Helper component to resolve NGO name from ID
function NGOName({ id, initialName, isDark }: { id: string; initialName?: string | null; isDark: boolean }) {
  const [name, setName] = useState(initialName || 'NGO');

  useEffect(() => {
    if (initialName) {
      setName(initialName);
      return;
    }

    const fetchName = async () => {
      try {
        const profile = await api.getUser(id);
        setName(String(profile.fullName || 'NGO'));
      } catch (error) {
        console.error("Error fetching NGO name:", error);
      }
    };
    fetchName();
  }, [id, initialName]);

  return <p>Verified by: <span className="font-medium text-[#0d9488]">{name}</span></p>;
}

interface AvailableTasksProps {
  onViewTask: (taskId: string) => void;
}

export function AvailableTasks({ onViewTask }: AvailableTasksProps) {
  const { userProfile, currentUserLocation, isDetectingLocation, detectCurrentLocation } = useUser();
  const { issues, assignIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [rejectedTasks, setRejectedTasks] = useState<string[]>([]);

  const availableTasks = issues.filter(i =>
    (i.status === 'approved' || (i.status === 'assigned' && !i.assignedVolunteerId)) &&
    i.id && !rejectedTasks.includes(i.id)
  );

  const getTaskDistance = (taskLat?: number, taskLng?: number): number | null => {
    if (!currentUserLocation || taskLat == null || taskLng == null) return null;
    return getDistance(currentUserLocation.lat, currentUserLocation.lng, taskLat, taskLng);
  };
  const handleAcceptTask = (taskId: string) => {
    if (!userProfile?.userId) return;
    assignIssue(taskId, userProfile.userId);
  };

  const handleRejectTask = (taskId: string) => {
    setRejectedTasks([...rejectedTasks, taskId]);
  };

  const getPriorityBadge = (priority?: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            <AlertTriangle className="w-3 h-3" />
            High Priority
          </div>
        );
      case 'Medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Medium Priority</span>;
      case 'Low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Low Priority</span>;
      default:
        return null;
    }
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-xs text-red-600 font-medium">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-xs text-orange-600 font-medium">Due today</span>;
    } else if (diffDays <= 2) {
      return <span className="text-xs text-orange-600 font-medium">Due in {diffDays} day{diffDays > 1 ? 's' : ''}</span>;
    } else {
      return <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Due in {diffDays} days</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Available Tasks</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Discover and accept tasks to help your community</p>
        <button
          type="button"
          onClick={() => void detectCurrentLocation()}
          disabled={isDetectingLocation}
          className="mt-3 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-60"
        >
          {isDetectingLocation ? 'Detecting location…' : 'Update my location'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {availableTasks.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-12 text-center`}>
            <Navigation className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No tasks within 15 km</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>There are no available tasks in your area right now. Check back later!</p>
          </div>
        ) : (
          availableTasks.map((task) => (
            <div
              key={task.id}
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                    {getPriorityBadge(task.urgency)}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{task.description.substring(0, 150)}...</p>
                  {((task.proofImages && task.proofImages.length > 0) || task.imageUrl) && (
                    <div className="mb-4">
                      <button 
                        onClick={() => window.open((task.proofImages && task.proofImages.length > 0) ? task.proofImages[0] : (task.imageUrl || ''), '_blank')}
                        className="text-sm text-blue-600 hover:underline font-medium text-left"
                      >
                        Click here to view attached image
                      </button>
                    </div>
                  )}

                  {/* Location, Distance, Time Info */}
                  <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{typeof task.lat === 'number' ? task.lat.toFixed(4) : task.lat}, {typeof task.lng === 'number' ? task.lng.toFixed(4) : task.lng}</span>
                    </div>
                    {/* Distance from volunteer */}
                    {(() => {
                      const dist = getTaskDistance(task.lat, task.lng);
                      if (dist === null) return null;
                      return (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dist <= 5
                          ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                          : dist <= 10
                            ? isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                            : isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          <Navigation className="w-3 h-3" />
                          {dist.toFixed(1)} km away
                        </div>
                      );
                    })()}
                    <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                      {task.category}
                    </span>
                  </div>

                  {/* Time and Deadline Info */}
                  <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Reported {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                      </span>
                    </div>
                    {((task as any).deadline) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {getDeadlineStatus(((task as any).deadline))}
                      </div>
                    )}
                  </div>

                  {/* Reporter & NGO Info */}
                  <div className={`mt-2 space-y-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <p>Reported by: <span className="font-medium text-[#0d9488]">{task.reportedByName || 'Anonymous Citizen'}</span></p>
                    {task.assignedNgoId && (
                      <NGOName id={task.assignedNgoId} initialName={task.assignedNgoName} isDark={isDark} />
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onViewTask(task.id!)}
                    className={`flex items-center gap-2 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors whitespace-nowrap`}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleAcceptTask(task.id!)}
                    className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors whitespace-nowrap"
                  >
                    Accept Task
                  </button>
                  <button
                    onClick={() => handleRejectTask(task.id!)}
                    className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors whitespace-nowrap`}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
