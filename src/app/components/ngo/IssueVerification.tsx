import { useState } from 'react';
import { MapPin, Calendar, CheckCircle, X, AlertTriangle, User } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';

interface IssueVerificationProps {
  onViewIssue?: (issueId: string) => void;
}

export function IssueVerification({ onViewIssue }: IssueVerificationProps) {
  const { issues, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [filter, setFilter] = useState<string>('all');

  // Issues specifically awaiting verification (status: "completed")
  const verificationIssues = issues.filter(i => i.status === 'completed');

  const handleVerify = (issueId: string) => {
    updateIssue(issueId, { status: 'verified' });
  };

  const handleReject = (issueId: string) => {
    if (confirm('Are you sure you want to reject this completion and send it back to the volunteer?')) {
      updateIssue(issueId, { status: 'assigned' });
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

  const getCardBorderClass = (urgency: string) => {
    switch (urgency) {
      case 'High': return isDark ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-red-500';
      case 'Medium': return isDark ? 'border-l-4 border-l-yellow-600' : 'border-l-4 border-l-yellow-500';
      case 'Low': return isDark ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Issue Verification</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Review and verify tasks marked as complete by volunteers</p>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 gap-4">
        {verificationIssues.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-12 text-center`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No issues pending verification</p>
          </div>
        ) : (
          verificationIssues
            .filter(issue => filter === 'all' || (filter === 'high' && issue.urgency === 'High'))
            .map((issue) => (
              <div
                key={issue.id}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${getCardBorderClass(issue.urgency)} rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-4 flex-col md:flex-row">
                  {/* Issue Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.title}</h3>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-medium ${getUrgencyColor(issue.urgency)}`}>
                        {issue.urgency}
                      </span>
                    </div>

                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>
                      {issue.description}
                    </p>

                    {issue.volunteerNotes && (
                      <div className={`mt-2 p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <p className={`text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Volunteer Completion Notes</p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{issue.volunteerNotes}</p>
                      </div>
                    )}

                    <div className={`mt-4 flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                        {issue.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{issue.completedAt ? new Date(issue.completedAt).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <User className="w-4 h-4" />
                      <span>Completed by: <strong>{issue.assignedVolunteerName || issue.assignedVolunteerId}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px] w-full md:w-auto">
                    {onViewIssue && (
                      <button
                        onClick={() => onViewIssue(issue.id!)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors whitespace-nowrap font-medium w-full`}
                      >
                        View Details
                      </button>
                    )}
                    <button
                      onClick={() => handleVerify(issue.id!)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-md transition-all whitespace-nowrap font-medium w-full"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Task
                    </button>
                    <button
                      onClick={() => handleReject(issue.id!)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-md transition-all whitespace-nowrap font-medium w-full"
                    >
                      <X className="w-4 h-4" />
                      Reject Submittal
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
