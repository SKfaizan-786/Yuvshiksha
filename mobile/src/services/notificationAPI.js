import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Notification API Service
 */

export const notificationAPI = {
  // Get all notifications
  getNotifications: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_ALL)
    );
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return apiRequest(() =>
      apiClient.put(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}`)
    );
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return apiRequest(() =>
      apiClient.delete(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE}/${notificationId}`)
    );
  },

  // Get notification settings
  getSettings: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.SETTINGS)
    );
  },

  // Update notification settings
  updateSettings: async (settings) => {
    return apiRequest(() =>
      apiClient.put(API_CONFIG.ENDPOINTS.NOTIFICATIONS.SETTINGS, settings)
    );
  },
};

export default notificationAPI;


