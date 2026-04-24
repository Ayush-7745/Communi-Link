import { ArrowLeft, MapPin, Calendar, AlertTriangle, Clock, Building2, Mail, Phone, CheckCircle, Upload, X } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Timestamp } from "firebase/firestore";
import { useUser } from "../../contexts/UserContext";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useNotifications } from "../../contexts/NotificationContext";
interface TaskDetailsProps {
  taskId: string;
  onBack: () => void;
}

export function TaskDetails({ taskId, onBack }: TaskDetailsProps) {
  const { getIssue, updateIssue } = useIssues();
  const { userProfile } = useUser();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const task = getIssue(taskId);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();
  const [ngoName, setNgoName] = useState<string>('Loading...');
  const [ngoEmail, setNgoEmail] = useState<string>('Loading...');

  useEffect(() => {
    const fetchName = async () => {
      if (task?.assignedNgoName) {
        setNgoName(task.assignedNgoName);
      }
      
      if (task?.assignedNgoId) {
        try {
          const docRef = doc(db, 'users', task.assignedNgoId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const name = snap.data().fullName || 'NGO';
            setNgoName(name);
            setNgoEmail(snap.data().email || 'Email not found');
          } else if (!task.assignedNgoName) {
            setNgoName('NGO (Name not found)');
            setNgoEmail('Email not found');
          }
        } catch (error) {
          setNgoName('NGO');
          setNgoEmail('Email not found');
        }
      }
    };
    fetchName();
  }, [task?.assignedNgoId]);

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Task not found</p>
      </div>
    );
  }

  const getPriorityBadge = (priority?: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-full font-medium">
            <AlertTriangle className="w-4 h-4" />
            High Priority
          </div>
        );
      case 'Medium':
        return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">Medium Priority</span>;
      case 'Low':
        return <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full font-medium">Low Priority</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">Pending</span>;
      case 'assigned':
        return <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">In Progress</span>;
      case 'completed':
        return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">Waiting for verification</span>;
      case 'verified':
        return <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full font-medium">Completed</span>;
      default:
        return <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">{status}</span>;
    }
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-sm text-red-600 font-medium">⚠️ Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-sm text-orange-600 font-medium">⏰ Due today</span>;
    } else if (diffDays <= 2) {
      return <span className="text-sm text-orange-600 font-medium">Due in {diffDays} day{diffDays > 1 ? 's' : ''}</span>;
    } else {
      return <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Due in {diffDays} days</span>;
    }
  };

  const handleMarkComplete = () => {
    setShowProofModal(true);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmitProof = async () => {
    if (proofImages.length === 0) {
      toast.error('Please upload at least one proof image');
      return;
    }

    // Convert files to base64 for persistent storage in Firestore
    const imageUrls = await Promise.all(proofImages.map(file => convertToBase64(file)));

    updateIssue(taskId, {
      status: 'completed',
      completedAt: Timestamp.now(),
      proofImages: imageUrls,
      volunteerNotes: completionNotes,
    });
    if (!userProfile?.userId) return;

    await addNotification({
      userId: userProfile.userId,
      title: "Task Completed",
      message: "You completed a task! Points will be awarded upon NGO verification.",
      type: "task-completed",
    });

    toast.success('Task marked as completed! Great job! 🎉');
    setShowProofModal(false);
    setProofImages([]);
    setCompletionNotes('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProofImages([...proofImages, ...files]);
  };

  const removeImage = (index: number) => {
    setProofImages(proofImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{task.title}</h1>
        </div>
        <div className="flex gap-2">
          {getPriorityBadge(task.urgency)}
          {getStatusBadge(task.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Description</h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{task.description}</p>
          </div>

          {/* Uploaded Images (from citizen) */}
          {(task.proofImages || (task.imageUrl ? [task.imageUrl] : [])).length > 0 && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Reported Images</h2>
              <div className="flex flex-col gap-2">
                {(task.proofImages || (task.imageUrl ? [task.imageUrl] : [])).map((img, index) => (
                  <button 
                    key={index}
                    onClick={() => window.open(img, '_blank')}
                    className="text-left text-blue-600 hover:underline font-medium"
                  >
                    Click here to view attached image {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proof Images (if completed) */}
          {task.status === 'completed' && task.proofImages && task.proofImages.length > 0 && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Completion Proof</h2>
              <div className="flex flex-col gap-2 mb-4">
                {task.proofImages.map((img, index) => (
                  <button 
                    key={index}
                    onClick={() => window.open(img, '_blank')}
                    className="text-left text-blue-600 hover:underline font-medium"
                  >
                    Click here to view completion proof image {index + 1}
                  </button>
                ))}
              </div>
              {task.volunteerNotes && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Completion Notes:</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{task.volunteerNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Task Timeline */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Task Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 ${(task.status === 'completed' || task.status === 'verified') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>Task Reported</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.createdAt?.toDate().toLocaleTimeString() || task.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>
              {task.status !== 'pending' && (
                <div className="flex gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${(task.status === 'completed' || task.status === 'verified') ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <div className="flex-1">
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>Task Assigned</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Assigned to you</p>
                  </div>
                </div>
              )}
              {(task.status === 'completed' || task.status === 'verified') && task.completedAt?.toDate().toLocaleDateString() && (
                <div className="flex gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${task.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>Task Completed</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.completedAt?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {task.status === 'verified' && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="flex-1">
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>Task Verified</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>NGO has verified completion</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Task Information</h2>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Category</p>
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg inline-block">
                  {task.category}
                </span>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className={`w-4 h-4 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{typeof task.lat === 'number' ? task.lat.toFixed(4) : task.lat}, {typeof task.lng === 'number' ? task.lng.toFixed(4) : task.lng}</p>
                </div>
              </div>
              {((task as any).distance) && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Distance</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3B82F6]" />
                    <p className="text-[#3B82F6] font-medium">{(task as any).distance} away</p>
                  </div>
                </div>
              )}
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reported</p>
                <div className="flex items-start gap-2">
                  <Clock className={`w-4 h-4 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{task.createdAt?.toDate().toLocaleTimeString() || task.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>
              {((task as any).deadline) && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Deadline</p>
                  <div className="flex items-start gap-2">
                    <Calendar className={`w-4 h-4 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{(task as any).deadline}</p>
                      {getDeadlineStatus((task as any).deadline)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NGO Contact Info */}
          {task.assignedNgoId && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
              <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>NGO Contact</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Organization</p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{ngoName}</p>
                  </div>
                </div>
                {task.assignedNgoId && (
                  <div className="flex items-start gap-3">
                    <Mail className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</p>
                      <a href={`mailto:${ngoEmail}`} className="text-[#3B82F6] hover:underline">
                        {ngoEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(task.status === 'approved' || (task.status === 'assigned' && !task.assignedVolunteerId)) && (
            <button
              onClick={() => {
                if (userProfile?.userId) {
                  assignIssue(taskId, userProfile.userId);
                  toast.success('Task accepted! You can now start working on it.');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-bold text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Accept & Start Task
            </button>
          )}

          {task.status === 'assigned' && task.assignedVolunteerId === userProfile?.userId && (
            <button
              onClick={handleMarkComplete}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg font-bold text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
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
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload Proof Images <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
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

                {proofImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {proofImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
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

              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent`}
                  rows={4}
                  placeholder="Add any notes about the task completion..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowProofModal(false)}
                  className={`flex-1 px-6 py-3 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProof}
                  className="flex-1 px-6 py-3 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
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
