import { useState } from 'react';
import { MapPin, Calendar, Eye, CheckCircle } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface MyIssuesProps {
  onViewDetails: (issueId: string) => void;
}

export function MyIssues({ onViewDetails }: MyIssuesProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { issues } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const filterOptions = [
    { value: 'all', label: 'All Issues' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-blue-100 text-blue-700'; // In Progress
      case 'completed': return 'bg-orange-100 text-orange-700';
      case 'verified': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food': return 'bg-purple-100 text-purple-700';
      case 'Health': return 'bg-red-100 text-red-700';
      case 'Infrastructure': return 'bg-blue-100 text-blue-700';
      case 'Disaster': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const { userProfile } = useUser();
  if (!userProfile?.userId) return null;
  const filteredIssues = issues.filter(issue => {
    // ✅ Only citizen's own issues
    if (issue.reportedBy !== userProfile?.userId) return false;

    // ✅ SHOW ALL (including completed)
    if (filterStatus === 'all') return true;

    if (filterStatus === 'Pending') return issue.status === 'pending';

    if (filterStatus === 'Accepted' || filterStatus === 'Assigned')
      return issue.status === 'assigned' || issue.status === 'completed';

    if (filterStatus === 'Completed')
      return issue.status === 'verified';

    if (filterStatus === 'Rejected')
      return issue.status === 'rejected';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">My Issues</h1>
        <p className="text-gray-600">Track and manage all your reported issues</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterStatus(option.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === option.value
              ? 'bg-[#0d9488] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-[#0d9488]'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No issues found</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg text-gray-900">{issue.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                      {issue.status === 'verified' && <CheckCircle className="inline w-3 h-3 mr-1" aria-hidden="true" />}
                      {
                        issue.status === 'pending' ? 'Pending' :
                          issue.status === 'assigned' ? 'In Progress' :
                            issue.status === 'completed' ? 'Pending Verification' :
                              issue.status === 'verified' ? 'Verified' :
                                issue.status === 'rejected' ? 'Rejected' :
                                  issue.status
                      }
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{typeof issue.lat === 'number' ? issue.lat.toFixed(4) : issue.lat}, {typeof issue.lng === 'number' ? issue.lng.toFixed(4) : issue.lng}</span>
                    </div>
                    <span className={`px-2 py-1 rounded ${getCategoryColor(issue.category)}`}>
                      {issue.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{issue.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <span className={`text-sm ${issue.urgency === 'High' ? 'text-red-600' :
                      issue.urgency === 'Medium' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                      {issue.urgency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onViewDetails(issue.id!)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
