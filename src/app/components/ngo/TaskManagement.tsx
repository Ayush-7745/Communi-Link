import { useState, useEffect } from 'react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MapPin, User, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useUser } from '../../contexts/UserContext';
import { geohashQueryBounds } from 'geofire-common';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

interface TaskManagementProps {
  onViewIssue?: (issueId: string) => void;
}

export function TaskManagement({ onViewIssue }: TaskManagementProps = {}) {
  const { issues, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [filter, setFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { userProfile, currentUserLocation } = useUser();
  
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

  // Get accepted and assigned tasks
  const tasks = issues.filter(i => i.status === 'approved' || i.status === 'assigned' || i.status === 'completed' || i.status === 'verified');

  const [fetchedVolunteers, setFetchedVolunteers] = useState<any[]>([]);

  useEffect(() => {
    if (!ngoLocation) return;

    const radiusInM = 15 * 1000;
    const bounds = geohashQueryBounds([ngoLocation.lat, ngoLocation.lng], radiusInM);

    const unsubscribes: (() => void)[] = [];
    const volunteersMap = new Map<string, any>();

    for (const b of bounds) {
      const q = query(
        collection(db, "users"),
        orderBy("geohash"),
        startAt(b[0]),
        endAt(b[1])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const vols = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          let volLat: number | null = null;
          let volLng: number | null = null;
          if (data.location && typeof data.location === 'object') {
            if (typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
              volLat = data.location.lat;
              volLng = data.location.lng;
            }
          } else if (typeof data.location === 'string' && data.location.includes(',')) {
            const parts = data.location.split(',').map((s: string) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              volLat = parts[0];
              volLng = parts[1];
            }
          }

          return {
            id: docSnap.id,
            ...data,
            name: data.fullName || data.name || 'Volunteer',
            skills: data.skills || ['Community Help'],
            availability: data.availability || 'Flexible',
            distance: data.location ? 'Nearby' : 'Unknown',
            volLat,
            volLng,
          };
        });

        const filteredVols = vols.filter(v => v !== null);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            volunteersMap.delete(change.doc.id);
          } else {
            const docData = change.doc.data();
            if (docData.role === 'volunteer') {
              const volObj = filteredVols.find(v => v.id === change.doc.id);
              if (volObj) volunteersMap.set(change.doc.id, volObj);
            }
          }
        });

        // Strict 15km filter
        const nearbyVols = Array.from(volunteersMap.values()).filter(v => {
          if (v.volLat !== null && v.volLng !== null) {
            const dist = getDistance(ngoLocation.lat, ngoLocation.lng, v.volLat, v.volLng);
            return dist <= 15;
          }
          return false;
        });

        setFetchedVolunteers(nearbyVols);
      });
      unsubscribes.push(unsubscribe);
    }
    return () => unsubscribes.forEach(u => u());
  }, [ngoLocation?.lat, ngoLocation?.lng]);

  const volunteers = fetchedVolunteers;

  const handleAssignVolunteer = (taskId: string, volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (volunteer) {
      updateIssue(taskId, {
        status: 'assigned',
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: volunteer.name,
      });
      setShowAssignModal(false);
      setSelectedTask(null);
    }
  };

  const handleMarkCompleted = (taskId: string) => {
    if (confirm('Mark this task as completed?')) {
      updateIssue(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0]
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'assigned':
      case 'completed':
        return 'bg-orange-100 text-orange-700';
      case 'verified': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      case 'Medium': return <Clock className="w-4 h-4" />;
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCardBorderClass = (urgency: string) => {
    switch (urgency) {
      case 'High': return isDark ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-red-500';
      case 'Medium': return isDark ? 'border-l-4 border-l-yellow-600' : 'border-l-4 border-l-yellow-500';
      case 'Low': return isDark ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    const daysRemaining = getDaysUntilDeadline(deadline);
    return daysRemaining !== null && daysRemaining < 0;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'unassigned') return task.status === 'approved' || (task.status === 'assigned' && !task.assignedVolunteerId);
    if (filter === 'assigned') return (task.status === 'assigned' && task.assignedVolunteerId) || task.status === 'completed';
    if (filter === 'completed') return task.status === 'verified';
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Task Management</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage accepted issues and assign volunteers</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-[#3B82F6] text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('unassigned')}
          className={`px-4 py-2 rounded-lg ${filter === 'unassigned' ? 'bg-[#3B82F6] text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          Not Assigned
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 rounded-lg ${filter === 'assigned' ? 'bg-[#3B82F6] text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          Assigned
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-[#3B82F6] text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          Completed
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-12 text-center`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const daysRemaining = getDaysUntilDeadline(task.deadline);
            const taskOverdue = isOverdue(task.deadline);

            return (
              <div
                key={task.id}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${getCardBorderClass(task.urgency)} rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-4">


                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-medium ${getUrgencyColor(task.urgency)}`}>
                          {getUrgencyIcon(task.urgency)}
                          {task.urgency}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(task.status === 'assigned' && !task.assignedVolunteerId ? 'approved' : task.status)}`}>
                          {task.status === 'completed' || (task.status === 'assigned' && task.assignedVolunteerId) ? 'In Progress' : task.status === 'verified' ? 'Completed' : task.status === 'assigned' ? 'approved' : task.status}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>
                      {task.description}
                    </p>

                    {((task.proofImages && task.proofImages.length > 0) || task.imageUrl) && (
                      <div className="mb-3">
                        <button 
                          onClick={() => window.open((task.proofImages && task.proofImages.length > 0) ? task.proofImages[0] : (task.imageUrl || ''), '_blank')}
                          className="text-sm text-blue-600 hover:underline font-medium text-left"
                        >
                          Click here to view attached image
                        </button>
                      </div>
                    )}

                    <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Lat: {typeof task.lat === 'number' ? task.lat.toFixed(4) : task.lat}, Lng: {typeof task.lng === 'number' ? task.lng.toFixed(4) : task.lng}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                        {task.category}
                      </span>
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {task.deadline}</span>
                        </div>
                      )}
                    </div>

                    {/* Deadline Status & Assigned Volunteer */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {task.deadline && taskOverdue && task.status !== 'completed' && (
                        <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue by {Math.abs(daysRemaining!)} days
                        </span>
                      )}
                      {task.deadline && !taskOverdue && daysRemaining !== null && task.status !== 'completed' && (
                        <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-medium ${daysRemaining <= 2 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                          <Clock className="w-3 h-3" />
                          {daysRemaining === 0 ? 'Due today' : `${daysRemaining} days remaining`}
                        </span>
                      )}
                      {task.assignedVolunteerId && (
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <User className="w-4 h-4" />
                          <span>Assigned to: <strong>{task.assignedVolunteerName || volunteers.find(v => v.id === task.assignedVolunteerId)?.name || task.assignedVolunteerId}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {(task.status === 'approved' || (task.status === 'assigned' && !task.assignedVolunteerId)) && (
                      <button
                        onClick={() => {
                          setSelectedTask(task.id!);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] hover:shadow-md transition-all whitespace-nowrap font-medium"
                      >
                        <User className="w-4 h-4" />
                        Assign Volunteer
                      </button>
                    )}
                    {onViewIssue && (
                      <button
                        onClick={() => onViewIssue(task.id!)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors whitespace-nowrap font-medium`}
                      >
                        View Details
                      </button>
                    )}
                    {task.status === 'assigned' && task.assignedVolunteerId && (
                      <>
                        <button
                          onClick={() => handleMarkCompleted(task.id!)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-md transition-all whitespace-nowrap font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Completed
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task.id!);
                            setShowAssignModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#3B82F6] text-[#3B82F6] rounded-lg hover:bg-blue-50 hover:shadow-md transition-all whitespace-nowrap font-medium"
                        >
                          <User className="w-4 h-4" />
                          Reassign
                        </button>
                      </>
                    )}
                    {task.status === 'verified' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-5 h-5" />
                          <span>Completed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Volunteer Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Assign Volunteer</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Select a volunteer to assign to this task</p>

            <div className="space-y-3">
              {volunteers.map((volunteer) => {
                const isCurrentlyAssigned = issues.find(i => i.id === selectedTask)?.assignedVolunteerId === volunteer.id;
                if (isCurrentlyAssigned) return null;

                return (
                  <div
                    key={volunteer.id}
                    className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 hover:border-[#3B82F6] transition-colors cursor-pointer`}
                    onClick={() => handleAssignVolunteer(selectedTask, volunteer.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} mb-2`}>{volunteer.name}</h4>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {volunteer.skills.map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className={`flex gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span>{volunteer.availability}</span>
                          <span>•</span>
                          <span>{(() => {
                            if (ngoLocation && volunteer.volLat !== null && volunteer.volLng !== null) {
                              return `${getDistance(ngoLocation.lat, ngoLocation.lng, volunteer.volLat, volunteer.volLng).toFixed(1)} km`;
                            }
                            return 'Nearby';
                          })()} away</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors">
                        Assign
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTask(null);
                }}
                className={`flex-1 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
