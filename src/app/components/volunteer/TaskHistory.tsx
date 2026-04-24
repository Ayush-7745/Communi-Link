import { useIssues } from '../../contexts/IssuesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

export function TaskHistory() {
  const { issues } = useIssues();
  const { effectiveTheme } = useTheme();
  const { userProfile } = useUser();

  const isDark = effectiveTheme === 'dark';

  const completedTasks = issues.filter(
    (i) =>
      i.assignedVolunteerId === userProfile?.userId &&
      (i.status === 'completed' || i.status === 'verified')
  );

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        Activity History
      </h1>

      <div
        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } rounded-xl shadow-sm border p-6`}
      >
        {completedTasks.length === 0 ? (
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No completed tasks yet
          </p>
        ) : (
          <ul className="space-y-3">
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'
                  } rounded-lg`}
              >
                <h3
                  className={isDark ? 'text-gray-200' : 'text-gray-900'}
                >
                  {task.title}
                </h3>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${task.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {task.status === 'verified' ? 'Verified & Closed' : 'Pending Verification'}
                </span>

                <p
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  {task.status === 'verified' ? 'Verified on ' : 'Submitted on '}
                  {task.createdAt
                    ? new Date(task.createdAt.seconds * 1000).toLocaleDateString()
                    : 'Recently'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
