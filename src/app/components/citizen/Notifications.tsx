import { CheckCircle, UserCheck, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useUser } from '../../contexts/UserContext';

export function Notifications() {
  const { notifications, deleteNotification } = useNotifications();
  const { userProfile } = useUser();

  const filteredNotifications = notifications.filter(
    n => n.userId === userProfile?.userId
  );

  // ✅ Map type → icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'info': return Info;
      case 'warning': return AlertCircle;
      default: return Info;
    }
  };

  // ✅ Color styling
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'warning': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your issue progress</p>
        </div>
        <button className="text-sm text-[#3B82F6] hover:underline">
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const Icon = getIcon(notification.type);

          return (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow ${!notification.read && 'border-l-4 border-l-[#3B82F6]'
                }`}
            >
              <div className="flex items-start gap-4">

                {/* Icon */}
                <div className={`${getNotificationColor(notification.type)} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-gray-900">{notification.title}</h3>

                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#3B82F6] rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {notification.createdAt?.toDate
                        ? notification.createdAt.toDate().toLocaleString()
                        : 'Just now'}
                    </span>

                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
