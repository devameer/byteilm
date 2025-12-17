import { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationList() {
  const { darkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Theme-aware classes
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textMessage = darkMode ? 'text-gray-300' : 'text-gray-700';
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const paginationBtnClass = darkMode 
    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' 
    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50';

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(currentPage);
      setNotifications(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (error) {
      // Ignore canceled errors (they're not real errors, just duplicate request prevention)
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      // Ignore canceled errors
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      // Ignore canceled errors
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to mark as read:', error);
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      task_created: darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800',
      task_completed: darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800',
      lesson_completed: darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800',
      course_completed: darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      project_created: darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
      team_invitation: darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800',
      referral_success: darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800',
    };
    return colors[type] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>All Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={async () => {
              await notificationService.clearAll();
              setNotifications([]);
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className={textSecondary}>No notifications yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${cardClass} rounded-lg shadow p-4 border-l-4 ${
                  notification.read_at
                    ? darkMode ? 'border-gray-600 opacity-75' : 'border-gray-300 opacity-75'
                    : 'border-indigo-600'
                } hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleMarkAsRead(notification.id, !!notification.read_at)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {notification.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {!notification.read_at && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>
                      {notification.title}
                    </h3>
                    {notification.message && (
                      <p className={`${textMessage} mb-2`}>{notification.message}</p>
                    )}
                    <p className={`text-sm ${textSecondary}`}>
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className={`ml-4 ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${paginationBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Previous
              </button>
              <span className={`px-4 py-2 text-sm ${textSecondary}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${paginationBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
