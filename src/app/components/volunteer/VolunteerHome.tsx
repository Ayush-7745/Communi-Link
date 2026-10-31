import { ClipboardList, CheckCircle, Trophy, TrendingUp, AlertTriangle, MapPin, Clock, Award, Target, HelpCircle } from 'lucide-react';
import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../contexts/UserContext';

interface VolunteerHomeProps {
  onViewTask: (taskId: string) => void;
}

export function VolunteerHome({ onViewTask }: VolunteerHomeProps) {
  const { issues, assignIssue } = useIssues();
  const { userProfile } = useUser();

  const points = userProfile?.points || 0;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSection, setHelpSection] = useState<'main' | 'faq' | 'report' | 'contact'>('main');
  const [problemReport, setProblemReport] = useState({ description: '', screenshot: null as File | null });

  // Get volunteer-specific tasks (assigned to volunteer)

  const myTasks = issues.filter(
    i =>
      i.assignedVolunteerId === userProfile?.userId &&
      i.status !== 'completed' && i.status !== 'verified'
  );
  const allMyTasks = issues.filter(
    i => i.assignedVolunteerId === userProfile?.userId
  );

  // Recent tasks should only show working or verified tasks, not pending verification.
  const recentTasks = allMyTasks.filter(i => i.status !== 'completed').slice(0, 4);

  const availableTasks = issues.filter(
    (i) => i.status === 'approved'
  );
  const completedTasks = allMyTasks.filter(i => i.status === 'verified').length;
  const waitingVerificationTasks = allMyTasks.filter(i => i.status === 'completed').length;

  // Gamification stats
  const badges = [
    { name: 'Top Volunteer', icon: '🏆', earned: true },
    { name: 'Consistent Helper', icon: '🎯', earned: true },
    { name: 'Quick Responder', icon: '⚡', earned: false },
  ];

  // Weekly progress data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weeklyData = days.map((day, index) => {
    const count = allMyTasks.filter(task => {
      if (!task.completedAt) return false;

      const date = new Date(task.completedAt.seconds * 1000);
      const now = new Date();

      // Only count tasks from THIS WEEK
      const isSameWeek =
        date.getFullYear() === now.getFullYear() &&
        Math.ceil(date.getDate() / 7) === Math.ceil(now.getDate() / 7);

      return date.getDay() === index && isSameWeek;
    }).length;

    return { day, tasks: count };
  });

  const stats = [
    { label: 'Available Tasks', value: availableTasks.length, icon: ClipboardList, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Tasks Accepted', value: myTasks.length, icon: CheckCircle, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Tasks Completed', value: completedTasks, icon: Trophy, color: 'bg-green-500', bgColor: 'bg-green-50' },
  ];

  // Smart recommendations based on volunteer skills and location
  const recommendedTasks = availableTasks.slice(0, 3);

  const getPriorityBadge = (priority?: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <AlertTriangle className="w-3 h-3" />
            High Priority
          </div>
        );
      case 'Medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium Priority</span>;
      case 'Low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Low Priority</span>;
      default:
        return null;
    }
  };

  const handleAcceptTask = (taskId: string) => {
    if (!userProfile?.userId) return;
    assignIssue(taskId, userProfile.userId);
  };

  const handleReportProblem = () => {
    console.log('Problem reported:', problemReport);
    setProblemReport({ description: '', screenshot: null });
    setHelpSection('main');
    setShowHelpModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Gamification */}
      <div className={`${isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} rounded-xl shadow-sm border p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Welcome Back, Volunteer!</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              🎉 You helped {completedTasks} communities this week!
            </p>
            {/* Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${badge.earned
                    ? isDark
                      ? 'bg-yellow-900/30 border border-yellow-700'
                      : 'bg-yellow-50 border border-yellow-200'
                    : isDark
                      ? 'bg-gray-800 border border-gray-700 opacity-50'
                      : 'bg-gray-100 border border-gray-300 opacity-50'
                    }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className={`text-sm ${badge.earned ? (isDark ? 'text-yellow-400' : 'text-yellow-700') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Points Display */}
          <div className={`${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 text-center`}>
            <Award className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <p className={`text-2xl ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>{points}</p>
            <p className={`text-xs ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>Points Earned</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{availableTasks.length}</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available Tasks</p>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{myTasks.length}</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Accepted</p>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{waitingVerificationTasks}</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Waiting Verification</p>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{completedTasks}</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Completed</p>
        </div>
      </div>

      {/* Smart Recommendations Panel */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#0d9488]" />
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Recommended for You</h2>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Tasks matching your skills and location</p>
        </div>
        <div className="p-6 space-y-4">
          {recommendedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No recommended tasks at the moment</p>
            </div>
          ) : (
            recommendedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{task.title}</h3>
                      {getPriorityBadge(task.urgency)}
                    </div>
                    <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{task.lat}, {task.lng}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {task.createdAt
                            ? new Date(task.createdAt.seconds * 1000).toLocaleDateString()
                            : "Just now"}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptTask(task.id!)}
                    className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors whitespace-nowrap text-sm"
                  >
                    Accept Task
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
        <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Weekly Progress</h2>
        <div className="space-y-4">
          <div className="flex justify-between text-sm mb-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tasks Completed</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>{completedTasks}/{allMyTasks.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#0d9488] h-3 rounded-full transition-all"
              style={{ width: `${allMyTasks.length > 0 ? (completedTasks / allMyTasks.length) * 100 : 0}%` }}
            ></div>
          </div>

          {/* Weekly Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="day" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDark ? '#F3F4F6' : '#111827',
                  }}
                />
                <Bar dataKey="tasks" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>My Recent Tasks</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {recentTasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No tasks assigned yet</p>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className={`p-6 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className={isDark ? 'text-gray-200' : 'text-gray-900'}>{task.title}</h3>
                      {getPriorityBadge(task.urgency)}
                      <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completed' || task.status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'assigned'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}>
                        {task.status === 'completed' || task.status === 'verified' ? 'Resolved' : task.status}
                      </span>
                    </div>
                    <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{task.category}</span>
                      <span>•</span>
                      <span>{task.lat}, {task.lng}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onViewTask(task.id!)}
                    className="text-sm text-[#0d9488] hover:underline whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Help Button */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0d9488] text-white rounded-full shadow-lg hover:bg-[#0f766e] transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            {helpSection === 'main' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>How can we help you?</h3>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setHelpSection('faq')}
                    className={`p-6 rounded-xl border-2 ${isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-700/50' : 'border-gray-200 hover:border-blue-500 bg-gray-50'} transition-all text-left`}
                  >
                    <div className="text-3xl mb-3">❓</div>
                    <h4 className={`text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>FAQ Section</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Common questions and answers</p>
                  </button>
                  <button
                    onClick={() => setHelpSection('report')}
                    className={`p-6 rounded-xl border-2 ${isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-700/50' : 'border-gray-200 hover:border-blue-500 bg-gray-50'} transition-all text-left`}
                  >
                    <div className="text-3xl mb-3">🐛</div>
                    <h4 className={`text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Report a Problem</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Describe the issue you're facing</p>
                  </button>
                  <button
                    onClick={() => setHelpSection('contact')}
                    className={`p-6 rounded-xl border-2 ${isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-700/50' : 'border-gray-200 hover:border-blue-500 bg-gray-50'} transition-all text-left`}
                  >
                    <div className="text-3xl mb-3">💬</div>
                    <h4 className={`text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Contact Support</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reach out to our support team</p>
                  </button>
                  <div className={`p-6 rounded-xl border-2 ${isDark ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
                    <div className="text-3xl mb-3">🚨</div>
                    <h4 className={`text-lg mb-2 ${isDark ? 'text-red-400' : 'text-red-900'}`}>Emergency Help</h4>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'} mb-3`}>Need urgent assistance?</p>
                    <a href="tel:911" className="text-sm text-red-600 hover:underline">Call Emergency Line</a>
                  </div>
                </div>
              </>
            )}

            {helpSection === 'faq' && (
              <>
                <button
                  onClick={() => setHelpSection('main')}
                  className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ← Back
                </button>
                <h3 className={`text-2xl mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>How do I accept tasks?</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Navigate to "Available Tasks" and click the "Accept Task" button on any task card.
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>How do I complete tasks?</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Once you finish a task, go to "My Tasks", click on the task, and upload proof of completion with photos and notes.
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>What are points and badges?</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      You earn points for completing tasks. Badges are awarded based on your performance and consistency.
                    </p>
                  </div>
                </div>
              </>
            )}

            {helpSection === 'report' && (
              <>
                <button
                  onClick={() => setHelpSection('main')}
                  className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ← Back
                </button>
                <h3 className={`text-2xl mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Report a Problem</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Describe the issue</label>
                    <textarea
                      value={problemReport.description}
                      onChange={(e) => setProblemReport({ ...problemReport, description: e.target.value })}
                      className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent`}
                      rows={5}
                      placeholder="Please describe the problem you're experiencing..."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Upload Screenshot (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProblemReport({ ...problemReport, screenshot: e.target.files?.[0] || null })}
                      className={`w-full px-4 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-900'} rounded-lg`}
                    />
                  </div>
                  <button
                    onClick={handleReportProblem}
                    className="w-full px-6 py-3 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}

            {helpSection === 'contact' && (
              <>
                <button
                  onClick={() => setHelpSection('main')}
                  className={`mb-4 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ← Back
                </button>
                <h3 className={`text-2xl mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Contact Support</h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Email Support</h4>
                    <a href="mailto:support@communilink.org" className="text-[#0d9488] hover:underline">
                      support@communilink.org
                    </a>
                  </div>
                  <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className={`mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Live Chat</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Available Mon-Fri, 9 AM - 6 PM</p>
                    <button className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors">
                      Start Chat
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
