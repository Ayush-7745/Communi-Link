import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, AlertCircle, CheckCircle, Users, Clock, Trash2, Check, Filter, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useIssues } from '../../contexts/IssuesContext';
import { api } from '../../../services/api';

interface NGONotificationsProps {
  onViewIssue?: (issueId: string) => void;
}

export function NGONotifications({ onViewIssue }: NGONotificationsProps = {}) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { notifications, deleteNotification } = useNotifications();
  const { updateIssue } = useIssues();

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
    } catch (error) { console.error('Unable to mark notification as read:', error); }
  };

  const markAllAsRead = async () => {
    for (const notif of notifications.filter(n => !n.read)) {
      try {
        await api.markNotificationRead(notif.id);
      } catch (error) {
        console.error('Unable to mark notification as read:', error);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'high_priority':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'task-completed':
      case 'issue-verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'issue-reported':
      case 'new_issue':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'task-assigned':
      case 'task-accepted':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) {
      return isDark ? 'bg-gray-800' : 'bg-white';
    }
    switch (type) {
      case 'high_priority':
        return isDark ? 'bg-red-900/20' : 'bg-red-50';
      case 'task-completed':
      case 'issue-verified':
        return isDark ? 'bg-green-900/20' : 'bg-green-50';
      case 'issue-reported':
        return isDark ? 'bg-blue-900/20' : 'bg-blue-50';
      case 'task-assigned':
      case 'task-accepted':
        return isDark ? 'bg-purple-900/20' : 'bg-purple-50';
      default:
        return isDark ? 'bg-gray-800' : 'bg-white';
    }
  };

  const getTimeAgo = (timestampSeconds: any) => {
    if (!timestampSeconds) return 'Just now';
    const time = new Date(timestampSeconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredNotifications = notifications.filter(notif =>
    filter === 'all' ? true : !notif.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-3xl ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Notifications</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Stay updated with latest activities and alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
              ? 'bg-[#0d9488] text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread'
              ? 'bg-[#0d9488] text-white'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">{unreadCount} new</span>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-12 text-center`}>
            <Bell className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-3`} />
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`${getNotificationBgColor(notification.type, notification.read)} ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm border p-5 hover:shadow-md transition-all ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-3 rounded-lg flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} whitespace-nowrap`}>
                      {getTimeAgo(notification.createdAt?.seconds)}
                    </span>
                  </div>

                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    {notification.message}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0d9488] hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Mark as Read
                      </button>
                    )}
                    {notification.issueId && onViewIssue && (
                      <button onClick={() => onViewIssue(notification.issueId!)} className="px-3 py-1.5 text-xs font-medium bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors">
                        View Details
                      </button>
                    )}
                    {notification.type === 'task-completed' && notification.issueId && (
                      <>
                        <button
                          onClick={() => {
                            updateIssue(notification.issueId!, { status: 'verified' });
                            deleteNotification(notification.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            updateIssue(notification.issueId!, { status: 'assigned' });
                            deleteNotification(notification.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors ml-auto`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
