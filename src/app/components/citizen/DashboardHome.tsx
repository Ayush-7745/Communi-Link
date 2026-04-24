import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Issue } from '../../../types/issue';
import { MapView } from './MapView';
import { useUser } from '../../contexts/UserContext';


export function DashboardHome({ onViewIssue }: { onViewIssue: (issueId: string) => void }) {
  const { issues } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const { userProfile } = useUser();

  if (!userProfile?.userId) return null;

  const myIssues = issues.filter(i => i.reportedBy === userProfile?.userId);

  const visibleIssues = issues.filter(i =>
    i.reportedBy === userProfile?.userId &&
    i.status !== "verified" && i.status !== "rejected"
  );
  const totalIssues = myIssues.length;
  const inProgressIssues = myIssues.filter(i => i.status === "assigned" || i.status === "completed").length;
  const resolvedIssues = myIssues.filter(i => i.status === 'verified').length;

  const stats = [
    { label: 'Total Issues Reported', value: totalIssues, icon: AlertCircle, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Issues In Progress', value: inProgressIssues, icon: Clock, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Issues Resolved', value: resolvedIssues, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50' },
  ];

  const recentIssues = [...myIssues]
    .filter(i => i.status !== "rejected")
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, 4);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'assigned':
      case 'completed':
        return 'bg-orange-100 text-orange-700';
      case 'verified': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Welcome Back!</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Here's an overview of your reported issues</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{stat.value}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
        {/* Map Section */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-xl mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Issue Map
          </h2>

          <MapView issues={visibleIssues} />
        </div>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Recent Activity</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {recentIssues.length === 0 ? (
            <div className="p-12 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No issues reported yet</p>
            </div>
          ) : (
            recentIssues.map((issue) => (
              <div key={issue.id} className={`p-6 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={isDark ? 'text-gray-200' : 'text-gray-900'}>{issue.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                        {issue.status === 'completed' || issue.status === 'assigned' ? 'In Progress' : issue.status === 'verified' ? 'Completed' : issue.status}
                      </span>
                    </div>
                    <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{issue.category}</span>
                      <span>•</span>
                      <span className={getUrgencyColor(issue.urgency)}>{issue.urgency} Priority</span>
                      <span>•</span>
                      <span>{issue.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => issue.id && onViewIssue(issue.id)}
                    className="text-sm text-[#3B82F6] hover:underline whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
