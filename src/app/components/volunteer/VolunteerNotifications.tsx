import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Trash2 } from "lucide-react";

export function VolunteerNotifications() {
  const { effectiveTheme } = useTheme();
  const { notifications, deleteNotification } = useNotifications();

  const isDark = effectiveTheme === 'dark';

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No new notifications
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border p-4 rounded-lg shadow-sm`}
            >
              <div className="flex justify-between items-start">

                {/* LEFT CONTENT */}
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>

                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {notif.message}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    {notif.createdAt?.toDate?.().toLocaleString?.() || ''}
                  </p>
                </div>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}