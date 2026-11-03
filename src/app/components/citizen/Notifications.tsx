import { CheckCircle, UserCheck, AlertCircle, Info, Trash2, Check } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useUser } from '../../contexts/UserContext';
import { toast } from 'sonner';

export function Notifications() {
  const {
    notifications,
    notificationsLoading,
    notificationsError,
    markAllNotificationsRead,
    deleteNotification,
  } = useNotifications();
  const { userProfile } = useUser();

  const filteredNotifications = notifications.filter(
    n => n.userId === userProfile?.userId
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'issue-approved':
      case 'issue-verified':
      case 'task-completed': return CheckCircle;
      case 'task-assigned':
      case 'task-accepted':
      case 'task-reassigned': return UserCheck;
      case 'issue-reported': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'issue-approved':
      case 'issue-verified':
      case 'task-completed': return 'bg-green-100 text-green-600';
      case 'task-assigned':
      case 'task-accepted':
      case 'task-reassigned': return 'bg-blue-100 text-blue-600';
      case 'issue-reported': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('Unable to mark notifications as read:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Unable to delete notification:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to delete notification.');
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
        {notificationsError && <p role="alert" className="text-sm text-red-600">{notificationsError}</p>}
        <button
          type="button"
          onClick={() => void handleMarkAllAsRead()}
          disabled={!filteredNotifications.some((notification) => !notification.read)}
          className="text-sm text-[#0d9488] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 && (
          <p className="text-sm text-gray-500">
            {notificationsLoading ? 'Loading notifications...' : notificationsError || 'No notifications yet.'}
          </p>
        )}
        {filteredNotifications.map((notification) => {
          const Icon = getIcon(notification.type);

          return (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow ${!notification.read && 'border-l-4 border-l-[#0d9488]'
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
                      <span className="w-2 h-2 bg-[#0d9488] rounded-full flex-shrink-0 mt-1.5" />
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
                      type="button"
                      aria-label={`Delete notification: ${notification.title}`}
                      onClick={() => void handleDelete(notification.id)}
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
      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
