import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import API_CONFIG from '../config/api';
import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * @typedef {Object} Notification
 * @property {string} _id
 * @property {string} title
 * @property {string} message
 * @property {'booking_pending' | 'booking_approved' | 'booking_rejected' | 'payment_received' | 'payment_refunded' | 'class_reminder' | 'message' | 'general'} type
 * @property {'booking' | 'payment' | 'message' | 'reminder' | 'system'} category
 * @property {'low' | 'medium' | 'high' | 'urgent'} priority
 * @property {boolean} isRead
 * @property {boolean} [actionRequired]
 * @property {string} [actionUrl]
 * @property {any} [data]
 * @property {string} createdAt
 * @property {string} [age]
 */

/**
 * @typedef {Object} NotificationContextType
 * @property {Notification[]} notifications
 * @property {number} unreadCount
 * @property {boolean} loading
 * @property {string | null} error
 * @property {() => Promise<void>} fetchNotifications
 * @property {(notificationIds: string[]) => Promise<void>} markAsRead
 * @property {() => Promise<void>} markAllAsRead
 * @property {(notificationId: string) => Promise<void>} deleteNotification
 * @property {(notification: Notification) => void} addNotification
 * @property {(message: string, type?: 'success' | 'error' | 'info' | 'warning') => void} showToast
 */

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * @typedef {Object} ToastMessage
 * @property {string} id
 * @property {string} message
 * @property {'success' | 'error' | 'info' | 'warning'} type
 * @property {number} timestamp
 */

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const { socket, isConnected } = useSocket();

  // FIX: This function has been updated to remove manual token handling
  const apiRequest = async (url, options = {}) => {
    // The browser will automatically send the HttpOnly cookie with `withCredentials: true`
    return axios({
      url: `${API_CONFIG.BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      withCredentials: true, // This is the fix. It tells the browser to send the cookie.
      ...options
    });
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest('/api/notifications');

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    try {
      await apiRequest('/api/notifications/mark-read', {
        method: 'PATCH',
        data: { notificationIds }
      });

      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      const markedUnreadCount = notifications.filter(n =>
        notificationIds.includes(n._id) && !n.isRead
      ).length;
      setUnreadCount(prev => Math.max(0, prev - markedUnreadCount));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError(err.response?.data?.message || 'Failed to mark notifications as read');
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));

      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.response?.data?.message || 'Failed to delete notification');
    }
  }, [notifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = {
      id,
      message,
      type,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Remove toast manually
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      addNotification({
        _id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        isRead: false,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl,
        data: notification.data,
        createdAt: notification.createdAt
      });

      if (notification.priority === 'high' || notification.priority === 'urgent') {
        showToast(notification.title, 'info');
      }
    };

    const handleMessageNotification = (data) => {
      console.log('New message notification:', data);
      showToast(`New message from ${data.sender.firstName}`, 'info');
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('message_notification', handleMessageNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('message_notification', handleMessageNotification);
    };
  }, [socket, isConnected, addNotification, showToast]);


  // Fetch notifications on mount and when storage changes
  useEffect(() => {
    const fetchOnStorageChange = () => {
      // FIX: This logic is a bit flawed. It should check for user existence, not just a token.
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user) {
        fetchNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchOnStorageChange();
    window.addEventListener('storage', fetchOnStorageChange);
    return () => {
      window.removeEventListener('storage', fetchOnStorageChange);
    };
  }, [fetchNotifications]);

  // Periodically fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      // We don't need to check the token here, as the ProtectedRoute handles this.
      try {
        const response = await apiRequest('/api/notifications/unread-count');
        setUnreadCount(response.data.unreadCount || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear notifications (for logout)
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    showToast,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};