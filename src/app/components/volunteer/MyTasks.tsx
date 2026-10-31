import { MapPin, Calendar, Eye, AlertTriangle, Clock, CheckCircle, Upload, X } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { MapView } from '../citizen/MapView';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../../services/api';
interface MyTasksProps {
  onViewTask: (taskId: string) => void;
}

export function MyTasks({ onViewTask }: MyTasksProps) {
  const { userProfile } = useUser();
  const { issues, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!proofImages[0]) {
      setProofPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(proofImages[0]);
    setProofPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [proofImages]);

  const volunteerId = userProfile?.userId; // later from auth

  const myTasks = issues.filter(
    i => i.assignedVolunteerId === volunteerId
  );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Approved</span>;
      case 'assigned':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">Waiting for verification</span>;
      case 'verified':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium"><CheckCircle className="inline w-3 h-3 mr-1" aria-hidden="true" />Verified</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-xs text-red-600 font-medium">⚠️ Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-xs text-orange-600 font-medium">⏰ Due today</span>;
    } else if (diffDays <= 2) {
      return <span className="text-xs text-orange-600 font-medium">Due in {diffDays} day{diffDays > 1 ? 's' : ''}</span>;
    } else {
      return <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Due in {diffDays} days</span>;
    }
  };

  const handleMarkComplete = (taskId: string) => {
    setSelectedTask(taskId);
    setShowProofModal(true);
  };

  const handleSubmitProof = async () => {
    if (!selectedTask) return;

    if (proofImages.length === 0) {
      toast.error('Please upload at least one proof image');
      return;
    }

    try {
      const { blobName } = await api.uploadImage(proofImages[0]);
      const saved = await updateIssue(selectedTask, {
        status: 'completed',
        completionProofBlob: blobName,
        volunteerNotes: completionNotes,
      });
      if (!saved) return;

      toast.success('Task marked as completed! Great job! 🎉');
      setShowProofModal(false);
      setProofImages([]);
      setCompletionNotes('');
      setSelectedTask(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload completion proof.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error('Choose a JPG, PNG, or WebP image up to 5 MB.');
      e.target.value = '';
      setProofImages([]);
      return;
    }
    setProofImages([file]);
  };

  const removeImage = (index: number) => {
    setProofImages(proofImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>My Tasks</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Track and manage your assigned tasks</p>
      </div>
      {!showProofModal && (
        <div className="grid grid-cols-1 gap-4">
          {myTasks.length === 0 ? (
            <div
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } rounded-xl shadow-sm border p-12 text-center`}
            >
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                No tasks assigned yet
              </p>
            </div>
          ) : (
            <>
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Task Image Thumbnail & Direct Link */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                        {getPriorityBadge(task.urgency)}
                        {getStatusBadge(task.status)}
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

                      {/* Location and Distance */}
                      <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{task.lat}, {task.lng}</span>
                        </div>

                        {/* REMOVE THIS if not in Issue type */}
                        {/* {task.distance && (
    <div className="flex items-center gap-1 text-[#0d9488]">
      <MapPin className="w-4 h-4" />
      <span>{task.distance} away</span>
    </div>
  )} */}

                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                          {task.category}
                        </span>
                      </div>

                      {/* Time and Deadline Info */}
                      <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {task.createdAt?.toDate().toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 🗺️ MAP USING LEAFLET */}
                      {!showProofModal && (
                        <div className="mt-4 rounded-lg overflow-hidden relative z-0">
                          <MapView issues={[task]} />
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => task.id && onViewTask(task.id!)}
                          className={`flex items-center gap-2 px-4 py-2 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors whitespace-nowrap`}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        {task.status === 'assigned' && (
                          <button
                            onClick={() => handleMarkComplete(task.id!)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Complete
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Pending Verification</span>
                          </div>
                        )}
                        {task.status === 'verified' && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Submit Proof of Completion</h3>
              <button
                onClick={() => setShowProofModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Images */}
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload Proof Images <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-8 border-2 border-dashed ${isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'} rounded-lg transition-colors flex flex-col items-center gap-2`}
                >
                  <Upload className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click to upload images
                  </span>
                </button>

                {/* Image Previews */}
                {proofImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {proofImages.map((_file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={proofPreview || ''}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion Notes */}
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent`}
                  rows={4}
                  placeholder="Add any notes about the task completion..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowProofModal(false)}
                  className={`flex-1 px-6 py-3 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProof}
                  className="flex-1 px-6 py-3 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors"
                >
                  Submit Proof & Complete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
