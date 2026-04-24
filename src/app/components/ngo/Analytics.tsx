import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';

export function Analytics() {
  const { issues } = useIssues();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Category statistics for bar chart
  const categoryStats = Object.entries(
    issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Status distribution for pie chart (alias completed into assigned for display)
  const statusStats = Object.entries(
    issues.reduce((acc, issue) => {
      const displayStatus = issue.status === 'completed' || issue.status === 'assigned' ? 'In Progress' : issue.status === 'verified' ? 'Completed' : issue.status;
      acc[displayStatus] = (acc[displayStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Urgency breakdown for pie chart
  const urgencyStats = Object.entries(
    issues.reduce((acc, issue) => {
      acc[issue.urgency] = (acc[issue.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Issues over time (dynamic)
  const generateTimelineData = () => {
    const data: { date: string, issues: number }[] = [];
    const today = new Date();

    // Create last 7 days buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      data.push({ date: `${mm}-${dd}`, issues: 0 });
    }

    issues.forEach(issue => {
      if (issue.createdAt?.toDate) {
        const d = issue.createdAt.toDate();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${mm}-${dd}`;

        const bucket = data.find(item => item.date === dateStr);
        if (bucket) {
          bucket.issues += 1;
        }
      }
    });

    return data;
  };

  const timelineData = generateTimelineData();

  // Key metrics
  const totalIssues = issues.length;
  const completedIssues = issues.filter(i => i.status === 'verified').length;
  const activeIssues = issues.filter(i => i.status === 'assigned' || i.status === 'approved' || i.status === 'completed').length;
  const pendingIssues = issues.filter(i => i.status === 'pending').length;
  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  let totalResponseTimeMs = 0;
  let responseTimeCount = 0;

  issues.forEach(issue => {
    if (issue.assignedAt && issue.createdAt && issue.assignedAt.toDate && issue.createdAt.toDate) {
      const time = issue.assignedAt.toDate() - issue.createdAt.toDate();
      if (time > 0) {
        totalResponseTimeMs += time;
        responseTimeCount++;
      }
    }
  });

  const avgResponseHours = responseTimeCount > 0
    ? (totalResponseTimeMs / responseTimeCount / (1000 * 60 * 60)).toFixed(1)
    : "0.0";

  const COLORS = {
    primary: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
    status: ['#EAB308', '#3B82F6', '#F97316', '#10B981', '#EF4444'],
    urgency: ['#EF4444', '#F59E0B', '#10B981'],
  };

  const stats = [
    { label: 'Total Issues', value: totalIssues, icon: Target, color: 'bg-blue-500', bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50' },
    { label: 'Pending Review', value: pendingIssues, icon: Clock, color: 'bg-yellow-500', bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50' },
    { label: 'Active Tasks', value: activeIssues, icon: TrendingUp, color: 'bg-orange-500', bgColor: isDark ? 'bg-orange-900/20' : 'bg-orange-50' },
    { label: 'Completed', value: completedIssues, icon: CheckCircle, color: 'bg-green-500', bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Analytics & Insights</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Track performance metrics and data trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                {stat.label === 'Completed' && (
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    {completionRate}%
                  </span>
                )}
              </div>
              <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{stat.value}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category - Bar Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Issues by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="name" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} />
              <YAxis tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#111827'
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution - Pie Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.status[index % COLORS.status.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues Over Time - Line Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Issues Reported Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="date" tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} />
              <YAxis tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#111827'
                }}
              />
              <Line type="monotone" dataKey="issues" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Urgency Breakdown - Pie Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h2 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Priority Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={urgencyStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {urgencyStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.urgency[index % COLORS.urgency.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDark ? '#F3F4F6' : '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completion Rate</span>
              <AlertTriangle className={`w-5 h-5 ${completionRate >= 70 ? 'text-green-500' : completionRate >= 40 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{completionRate}%</p>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Response Time</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{avgResponseHours}h</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>From report to assignment</p>
          </div>

          <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Resolution Rate</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{completionRate}%</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Issues successfully resolved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
