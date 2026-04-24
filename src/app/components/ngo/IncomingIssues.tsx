import { useState } from 'react';
import { MapPin, Calendar, Eye, CheckCircle, X, AlertTriangle, Clock } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';

import { useUser } from '../../contexts/UserContext';

interface IncomingIssuesProps {
  onViewIssue: (issueId: string) => void;
}

export function IncomingIssues({ onViewIssue }: IncomingIssuesProps) {
  const { issues, updateIssue } = useIssues();
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();
  const isDark = effectiveTheme === 'dark';
  const [filter, setFilter] = useState<string>('all');

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Get pending issues (geo-filtering is now handled globally in IssuesContext)
  const pendingIssues = issues.filter(i => i.status === 'pending');

  console.log("NGO Fetch Array [PENDING/LOCAL]:", pendingIssues);

  const handleAccept = (issueId: string) => {
    updateIssue(issueId, {
      status: 'approved'
    });
  };

  const handleReject = (issueId: string) => {
    if (confirm('Are you sure you want to reject this issue?')) {
      updateIssue(issueId, { status: 'rejected' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Incoming Issues</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Review and accept citizen-reported issues</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          All Issues ({pendingIssues.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'high'
            ? 'bg-[#3B82F6] text-white'
            : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          High Priority
        </button>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 gap-4">
        {pendingIssues.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-12 text-center`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No pending issues</p>
          </div>
        ) : (
          pendingIssues
            .filter(issue => filter === 'all' || (filter === 'high' && issue.urgency === 'High'))
            .map((issue) => (
              <div
                key={issue.id}
                className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${getCardBorderClass(issue.urgency)} rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-4">


                  {/* Issue Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{issue.title}</h3>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-medium ${getUrgencyColor(issue.urgency)}`}>
                        {getUrgencyIcon(issue.urgency)}
                        {issue.urgency}
                      </span>
                    </div>

                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>
                      {issue.description}
                    </p>

                    {((issue.proofImages && issue.proofImages.length > 0) || issue.imageUrl) && (
                      <div className="mb-3">
                        <button 
                          onClick={() => window.open((issue.proofImages && issue.proofImages.length > 0) ? issue.proofImages[0] : (issue.imageUrl || ''), '_blank')}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Click here to view attached image
                        </button>
                      </div>
                    )}

                    <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                        {issue.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{issue.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>Reported by: {issue.reportedByName || 'Citizen'}</span>
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <button
                      onClick={() => onViewIssue(issue.id!)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#3B82F6] text-[#3B82F6] rounded-lg hover:bg-blue-50 hover:shadow-md transition-all whitespace-nowrap font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleAccept(issue.id!)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-md transition-all whitespace-nowrap font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(issue.id!)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-md transition-all whitespace-nowrap font-medium"
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
