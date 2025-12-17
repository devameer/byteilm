import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pusher, setPusher] = useState(null);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
    } catch (error) {
      // Ignore canceled errors (they're not real errors, just duplicate request prevention)
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        // Request was cancelled due to duplicate - this is expected behavior
        return;
      }
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch notifications on mount
    fetchUnreadNotifications();

    const pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY || 'your_pusher_app_key', {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    });

    const channel = pusherInstance.subscribe(`user.${user.id}`);
    
    channel.bind('notification.created', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
        });
      }
    });

    setPusher(pusherInstance);

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherInstance.disconnect();
    };
  }, [user?.id, fetchUnreadNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Ignore canceled errors
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      // Ignore canceled errors
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Ignore canceled errors
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to delete notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchUnreadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
