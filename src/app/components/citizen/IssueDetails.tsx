import { ArrowLeft, MapPin, Calendar, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Issue } from '../../../types/issue';
import { useUser } from '../../contexts/UserContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface IssueDetailsProps {
  issueId: string;
  onBack: () => void;
}

export function IssueDetails({ issueId, onBack }: IssueDetailsProps) {
  const { getIssue } = useIssues();
  const { userProfile } = useUser();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const issue = getIssue(issueId) as Issue;
  const [ngoName, setNgoName] = useState<string>('Loading...');
  const [volunteerName, setVolunteerName] = useState<string>('Loading...');

  useEffect(() => {
    const fetchNames = async () => {
      if (issue?.assignedNgoId) {
        try {
          const docRef = doc(db, 'users', issue.assignedNgoId);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().fullName) {
            setNgoName(snap.data().fullName);
          } else {
            setNgoName('NGO (Name not found)');
          }
        } catch (error) {
          setNgoName('NGO');
        }
      }
      if (issue?.assignedVolunteerId) {
        try {
          const docRef = doc(db, 'users', issue.assignedVolunteerId);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().fullName) {
            setVolunteerName(snap.data().fullName);
          } else {
            setVolunteerName('Volunteer (Name not found)');
          }
        } catch (error) {
          setVolunteerName('Volunteer');
        }
      }
    };
    fetchNames();
  }, [issue?.assignedNgoId, issue?.assignedVolunteerId]);

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Issue not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-[#3B82F6] hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }
  if (issue.reportedBy !== userProfile?.userId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Unauthorized access</p>
        <button
          onClick={onBack}
          className="mt-4 text-[#3B82F6] hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getTimelineSteps = () => {
    const steps = [
      {
        status: 'Reported',
        date: issue.createdAt?.toDate().toLocaleDateString(),
        description: 'Issue reported by Citizen',
        icon: AlertCircle,
        color: 'bg-blue-500',
        completed: true,
      },
    ];

    if (issue.status === 'rejected') {
      steps.push({
        status: 'Rejected',
        date: 'Recently',
        description: 'Issue was reviewed and rejected by NGO',
        icon: AlertCircle,
        color: 'bg-red-500',
        completed: true,
      });
      return steps;
    }

    if (issue.status === 'assigned' || issue.status === 'completed') {
      steps.push({
        status: 'Assigned',
        date: issue.createdAt?.toDate().toLocaleDateString(),
        description: 'Assigned to volunteer',
        icon: User,
        color: 'bg-orange-500',
        completed: true,
      });

      steps.push({
        status: 'In Progress',
        date: issue.createdAt?.toDate().toLocaleDateString(),
        description: 'Work in progress',
        icon: Clock,
        color: 'bg-yellow-500',
        completed: true,
      });
    }

    if (issue.status === 'completed' || issue.status === 'verified') {
      steps.push({
        status: 'Pending Verification',
        date: issue.completedAt?.toDate().toLocaleDateString() || issue.createdAt?.toDate().toLocaleDateString(),
        description: 'Waiting for NGO to verify',
        icon: CheckCircle,
        color: 'bg-yellow-500',
        completed: true,
      });
    } else {
      steps.push({
        status: 'Pending Verification',
        date: 'Pending',
        description: 'Waiting for volunteer to complete',
        icon: CheckCircle,
        color: 'bg-gray-400',
        completed: false,
      });
    }

    if (issue.status === 'verified') {
      steps.push({
        status: 'Verified',
        date: issue.updatedAt?.toDate().toLocaleDateString() || 'Recently',
        description: 'Issue officially verified and closed',
        icon: CheckCircle,
        color: 'bg-green-500',
        completed: true,
      });
    } else {
      steps.push({
        status: 'Verified & Closed',
        date: 'Pending',
        description: 'Issue resolution verified',
        icon: CheckCircle,
        color: 'bg-gray-400',
        completed: false,
      });
    }

    return steps;
  };

  const timeline = getTimelineSteps();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Issues
      </button>

      {/* Issue Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-3`}>{issue.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm ${issue.status === 'completed' ? 'bg-yellow-100 text-yellow-700' :
                issue.status === 'verified' ? 'bg-green-100 text-green-700' :
                  issue.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                {
                  issue.status === 'pending' ? 'Pending' :
                    issue.status === 'assigned' ? 'In Progress' :
                      issue.status === 'completed' ? 'Pending Verification' :
                        issue.status === 'verified' ? 'Completed' :
                          issue.status
                }
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                {issue.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${issue.urgency === 'High' ? 'bg-red-100 text-red-700' :
                issue.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                {issue.urgency} Priority
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <MapPin className="w-4 h-4" />
            <span>{typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}</span>
          </div>
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Calendar className="w-4 h-4" />
            <span>Reported on {issue.createdAt?.toDate().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-3`}>Description</h2>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>{issue.description}</p>
      </div>

      {/* Images */}
      {(issue.proofImages || (issue.imageUrl ? [issue.imageUrl] : [])).length > 0 && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Attached Images</h2>
          <div className="flex flex-col gap-2">
            {(issue.proofImages || (issue.imageUrl ? [issue.imageUrl] : [])).map((image, index) => (
              <button
                key={index}
                onClick={() => window.open(image, '_blank')}
                className="text-left text-blue-600 hover:underline"
              >
                Click here to view attached image {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assigned To */}
      {(issue.assignedNgoId || issue.assignedVolunteerId) && (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Assignment Details</h2>
          <div className="space-y-3">
            {issue.assignedNgoId && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Assigned NGO</span>
                <span className="text-sm text-gray-900">{ngoName}</span>
              </div>
            )}
            {issue.assignedVolunteerId && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Assigned Volunteer</span>
                <span className="text-sm text-gray-900">{volunteerName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-6`}>Progress Timeline</h2>
        <div className="space-y-6">
          {timeline.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`${step.color} p-2 rounded-full ${!step.completed && 'opacity-50'}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={`w-0.5 h-12 ${step.completed ? 'bg-gray-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} ${!step.completed && 'opacity-50'}`}>
                      {step.status}
                    </h3>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ${!step.completed && 'opacity-50'}`}>
                      {step.date}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} ${!step.completed && 'opacity-50'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
