import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationAPI from '../services/notificationAPI';
import messageAPI from '../services/messageAPI';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  unreadMessageCount: 0,
  totalUnreadCount: 0,
  loading: false,
  refreshNotifications: async () => { },
  markAsRead: async () => { },
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Default to recent 5
  const [filterParams, setFilterParams] = useState({ limit: 5 });

  const { user, isAuthenticated } = useAuth();

  // Initial fetch and polling setup
  useEffect(() => {
    let intervalId;

    if (isAuthenticated && user) {
      // Fetch immediately
      refreshNotifications();

      // Poll every 30 seconds
      intervalId = setInterval(() => {
        refreshNotifications(true); // silent refresh
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, user, filterParams]); // Re-fetch when filterParams change

  const refreshNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch Notifications with current filters
      const notifResponse = await notificationAPI.getNotifications(filterParams);
      if (notifResponse.success) {
        // Backend returns: { notifications: [], pagination: {}, unreadCount: number }
        const data = notifResponse.data || {};
        const notifs = data.notifications || [];

        setNotifications(notifs);

        // Calculate unread notifications
        const unread = typeof data.unreadCount === 'number'
          ? data.unreadCount
          : notifs.filter(n => !n.isRead).length;

        setUnreadCount(unread);
      }

      // 2. Fetch Messages (Conversations) to count unread
      const msgResponse = await messageAPI.getConversations();
      if (msgResponse.success) {
        const conversations = msgResponse.data || [];
        // Sum up unread counts from all conversations
        const unreadMsg = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        setUnreadMessageCount(unreadMsg);
      }
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateFilter = (newParams) => {
    setFilterParams(newParams);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // API call
      await notificationAPI.markAsRead(notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Revert if needed, but usually fine to ignore
    }
  };

  const value = {
    notifications,
    unreadCount,
    unreadMessageCount,
    totalUnreadCount: unreadCount + unreadMessageCount,
    loading,
    refreshNotifications,
    markAsRead,
    updateFilter,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
