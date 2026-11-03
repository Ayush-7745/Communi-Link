import { ArrowLeft, MapPin, Calendar, CheckCircle, X } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { IssueImageGallery } from '../IssueImageGallery';
import { ISSUE_STATUS } from '../../../utils/issueStatus';

interface IssueDetailsNGOProps {
  issueId: string;
  onBack: () => void;
}

export function IssueDetailsNGO({ issueId, onBack }: IssueDetailsNGOProps) {
  const { getIssue, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const issue = getIssue(issueId);
  const { userProfile } = useUser();
  const [citizenName, setCitizenName] = useState<string>('Loading...');

  useEffect(() => {
    const fetchName = async () => {
      if (issue?.reportedBy) {
        try {
          const profile = await api.getUser(issue.reportedBy);
          if (profile.fullName) {
            setCitizenName(String(profile.fullName));
          } else {
            setCitizenName('Citizen (Name not found)');
          }
        } catch (error) {
          setCitizenName('Citizen');
        }
      }
    };
    fetchName();
  }, [issue?.reportedBy]);

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Issue not found</p>
        <button onClick={onBack} className="mt-4 text-[#0d9488] hover:underline">Go Back</button>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!userProfile?.userId) return;
    const approved = await updateIssue(issueId, {
      status: ISSUE_STATUS.APPROVED,
    });
    if (approved) onBack();
  };

  const handleReject = async () => {
    if (confirm('Are you sure you want to reject this issue?')) {
      const rejected = await updateIssue(issueId, { status: ISSUE_STATUS.REJECTED });
      if (rejected) onBack();
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Issues
      </button>

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-3`}>{issue.title}</h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{issue.category}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${issue.urgency === 'High' ? 'bg-red-100 text-red-700' :
                issue.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                {issue.urgency} Priority
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Description</h3>
            <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Location</h3>
              <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                <MapPin className="w-4 h-4" />
                <span>📍 {typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}</span>
              </div>
            </div>
            <div>
              <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reported Date</h3>
              <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                <Calendar className="w-4 h-4" />
                <span>{issue.createdAt?.toDate().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reported By</h3>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{citizenName}</span>
              <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
        </div>

        {issue.status === ISSUE_STATUS.PENDING && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Accept Issue
            </button>
            <button
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
              Reject Issue
            </button>
          </div>
        )}
      </div>
      <IssueImageGallery issue={issue} />
    </div>
  );
}
