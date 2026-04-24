import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CheckCircle, Star, Award, TrendingUp, MapPin, Calendar, Clock, Users, Filter, X, Navigation } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
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

export function VolunteerManagement() {
  const { effectiveTheme } = useTheme();
  const { issues, updateIssue } = useIssues();
  const { userProfile } = useUser();
  const isDark = effectiveTheme === 'dark';
  const [filter, setFilter] = useState<string>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewingVolunteer, setViewingVolunteer] = useState<any>(null);

  const { currentUserLocation } = useUser();
  const ngoLocation = currentUserLocation || (userProfile?.location as any) || null;

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

          // Parse volunteer location – can be stored as {lat,lng} object OR "lat,lng" string
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
            name: data.fullName || data.name || 'Volunteer',
            skills: data.skills && data.skills.length > 0 ? data.skills : ['Community Helper'],
            availability: data.availability || 'Flexible',
            verified: data.verified !== false,
            online: data.online || false,
            rating: data.rating || 4.5,
            tasksCompleted: data.tasksCompleted || 0,
            reliability: data.reliability || 90,
            joinDate: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            location: typeof data.location === 'string'
              ? data.location
              : (data.location && typeof data.location.lat === 'number'
                ? `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`
                : (data.city || 'Nearby Region')),
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

        setFetchedVolunteers(Array.from(volunteersMap.values()));
      });
      unsubscribes.push(unsubscribe);
    }
    return () => unsubscribes.forEach(u => u());
  }, [ngoLocation?.lat, ngoLocation?.lng]);

  const volunteers = fetchedVolunteers.map(v => {
    const activeTasks = issues.filter(i => i.assignedVolunteerId === v.id && (i.status === 'assigned' || i.status === 'completed'));
    const pastTasks = issues.filter(i => i.assignedVolunteerId === v.id && (i.status === 'verified'));

    // Compute distance from NGO if both locations are available
    let distanceKm: number | null = null;
    if (ngoLocation && v.volLat !== null && v.volLng !== null) {
      distanceKm = getDistance(ngoLocation.lat, ngoLocation.lng, v.volLat, v.volLng);
    }

    return {
      ...v,
      currentTasks: activeTasks.length > 0 ? activeTasks.map(t => t.title) : null,
      tasksCompleted: activeTasks.length + pastTasks.length,
      distanceKm,
    };
  });

  // Only show volunteers within 15km of the NGO (or all while location is still resolving)
  const RADIUS_KM = 15;
  const nearbyVolunteers = ngoLocation
    ? volunteers.filter(v => v.distanceKm !== null && v.distanceKm <= RADIUS_KM)
    : volunteers;

  const filteredVolunteers = nearbyVolunteers.filter(v => {
    if (filter === 'online') return v.online;
    if (filter === 'offline') return !v.online;
    if (filter === 'active') return (v.currentTasks && v.currentTasks.length > 0);
    return true;
  });

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 95) return 'text-green-600';
    if (reliability >= 85) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getReliabilityBgColor = (reliability: number) => {
    if (reliability >= 95) return 'bg-green-100';
    if (reliability >= 85) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  const handleAssignTask = () => {
    if (!selectedTask) {
      toast.error('Please select a task');
      return;
    }

    updateIssue(selectedTask, {
      status: 'assigned',
      assignedVolunteerId: selectedVolunteer.id,
    });

    toast.success(`Task successfully assigned to ${selectedVolunteer.name}! 🎉`);
    setShowAssignModal(false);
    setSelectedTask('');
    setAssignmentNotes('');
    setSelectedVolunteer(null);
  };

  // Get available tasks (accepted but not assigned)
  const availableTasks = issues.filter(i => i.status === 'approved' && !i.assignedVolunteerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Volunteer Management</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage and track your volunteer network</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 shadow-sm border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Nearby Volunteers</p>
              <p className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{nearbyVolunteers.length}</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>within 15 km</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 shadow-sm border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Online Now</p>
              <p className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{nearbyVolunteers.filter(v => v.online).length}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 shadow-sm border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Assigned Tasks</p>
              <p className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{issues.filter(i => i.status === 'assigned' || i.status === 'completed').length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 shadow-sm border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Avg. Rating</p>
              <p className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {nearbyVolunteers.length > 0
                  ? (nearbyVolunteers.reduce((sum, v) => sum + v.rating, 0) / nearbyVolunteers.length).toFixed(1)
                  : '—'
                }
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          All ({nearbyVolunteers.length})
        </button>
        <button
          onClick={() => setFilter('online')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'online'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Online ({nearbyVolunteers.filter(v => v.online).length})
        </button>
        <button
          onClick={() => setFilter('offline')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'offline'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Offline ({nearbyVolunteers.filter(v => !v.online).length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'active'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          On Assigned Task ({nearbyVolunteers.filter(v => v.currentTasks && v.currentTasks.length > 0).length})
        </button>
      </div>

      {/* Volunteer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVolunteers.map((volunteer) => (
          <div
            key={volunteer.id}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all`}
          >
            {/* Header with Avatar and Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {volunteer.name.charAt(0)}
                  </div>
                  {/* Online/Offline Indicator */}
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'} ${volunteer.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{volunteer.name}</h3>
                    {volunteer.verified && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {volunteer.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              {/* Distance Badge */}
              {volunteer.distanceKm !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${volunteer.distanceKm <= 5
                  ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : volunteer.distanceKm <= 10
                    ? isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  <Navigation className="w-3 h-3" />
                  {volunteer.distanceKm.toFixed(1)} km
                </div>
              )}
            </div>

            {/* Rating and Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{volunteer.rating}</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rating</p>
              </div>
              <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                <div className="mb-1">
                  <span className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{volunteer.tasksCompleted}</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks</p>
              </div>
              <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                <div className="mb-1">
                  <span className={`${getReliabilityColor(volunteer.reliability)} font-semibold`}>{volunteer.reliability}%</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reliable</p>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Skills:</p>
              <div className="flex flex-wrap gap-1">
                {volunteer.skills.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className={`space-y-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{volunteer.availability}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{volunteer.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {volunteer.joinDate}</span>
              </div>
            </div>

            {/* Current Task Status */}
            {volunteer.currentTasks && volunteer.currentTasks.length > 0 ? (
              <div className={`${isDark ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'} border rounded-lg p-3 mb-3`}>
                <p className={`text-xs ${isDark ? 'text-orange-400' : 'text-orange-700'} font-medium mb-1`}>Currently Working On:</p>
                <div className="flex flex-col gap-1">
                  {volunteer.currentTasks.map((taskTitle: string, index: number) => (
                    <p key={index} className={`text-xs ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>• {taskTitle}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3 mb-3`}>
                <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-700'} font-medium text-center`}>Available for Tasks</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewingVolunteer(volunteer);
                  setShowProfileModal(true);
                }}
                className="flex-1 px-3 py-2 border-2 border-[#3B82F6] text-[#3B82F6] rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                View Profile
              </button>
              <button
                className="flex-1 px-3 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors text-sm font-medium"
                onClick={() => {
                  setSelectedVolunteer(volunteer);
                  setShowAssignModal(true);
                }}
              >
                Assign Task
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Assign Task to Volunteer</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Volunteer Info */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Assigning to:</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {selectedVolunteer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-medium`}>{selectedVolunteer.name}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{selectedVolunteer.availability}</span>
                      <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{selectedVolunteer.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{selectedVolunteer.rating}</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedVolunteer.tasksCompleted} tasks</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedVolunteer.skills.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Task Selection */}
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Task <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                >
                  <option value="">-- Select a task --</option>
                  {availableTasks.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.title} - 📍 {typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng} ({issue.urgency || 'Normal'} Priority)
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Preview */}
              {selectedTask && availableTasks.find(i => i.id === selectedTask) && (
                <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Task Preview:</p>
                  {(() => {
                    const task = availableTasks.find(i => i.id === selectedTask);
                    return task ? (
                      <div>
                        <h4 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-medium mb-1`}>{task.title}</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {task.description.substring(0, 120)}...
                        </p>
                        <div className={`flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-700">
                            {task.category}
                          </span>
                          {task.urgency && (
                            <span className={`px-2 py-1 rounded ${task.urgency === 'High' ? 'bg-red-100 text-red-700' :
                              task.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {task.urgency} Priority
                            </span>
                          )}
                          {selectedVolunteer?.volLat && selectedVolunteer?.volLng && task.lat && task.lng && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{getDistance(selectedVolunteer.volLat, selectedVolunteer.volLng, task.lat, task.lng).toFixed(1)} km from volunteer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                  rows={3}
                  placeholder="Add any special instructions for the volunteer..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className={`flex-1 px-6 py-3 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  disabled={!selectedTask}
                  className={`flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-lg transition-colors ${selectedTask ? 'hover:bg-[#2563EB]' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {showProfileModal && viewingVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} font-semibold`}>Volunteer Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                  {viewingVolunteer.name.charAt(0)}
                </div>
                <div>
                  <h3 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} font-bold`}>{viewingVolunteer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{viewingVolunteer.online ? '🟢 Online' : '⚪ Offline'}</span>
                    <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'} font-medium`}>{viewingVolunteer.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Tasks</p>
                  <p className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{viewingVolunteer.tasksCompleted}</p>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reliability</p>
                  <p className={`text-lg font-semibold ${getReliabilityColor(viewingVolunteer.reliability)}`}>{viewingVolunteer.reliability}%</p>
                </div>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Skills</p>
                <div className="flex flex-wrap gap-2">
                  {viewingVolunteer.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Availability</p>
                    <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{viewingVolunteer.availability}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                    <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{viewingVolunteer.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Member Since</p>
                    <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{viewingVolunteer.joinDate}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}