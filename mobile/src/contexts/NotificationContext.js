import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  clearNotification: () => {},
  clearAll: () => {},
  expoPushToken: null,
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Listen to socket notifications
  useEffect(() => {
    if (socket && isConnected && user) {
      console.log('🔔 NotificationContext - Setting up socket listeners');

      // Listen for new notifications
      socket.on('notification', (notification) => {
        console.log('🔔 Received notification:', notification);
        addNotification(notification);
        
        // Show local notification
        showLocalNotification(notification);
      });

      // Listen for notification read status updates
      socket.on('notification_read', ({ notificationId }) => {
        console.log('👁️ Notification marked as read:', notificationId);
        markAsRead(notificationId);
      });

      return () => {
        socket.off('notification');
        socket.off('notification_read');
      };
    }
  }, [socket, isConnected, user]);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Expo Push Token:', token);
      setExpoPushToken(token);
      
      // TODO: Send this token to your backend to store it with the user
      // You can send it via socket or API call
      if (socket && isConnected) {
        socket.emit('register_push_token', { token });
      }
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  };

  const showLocalNotification = async (notification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || 'New Notification',
          body: notification.message || notification.body,
          data: notification.data || {},
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications((prev) => [
      {
        id: notification.id || Date.now().toString(),
        ...notification,
        read: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    clearNotification,
    clearAll,
    expoPushToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;


