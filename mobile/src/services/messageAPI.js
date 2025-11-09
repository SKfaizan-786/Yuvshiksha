import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Message API Service
 */

export const messageAPI = {
  // Get all conversations
  getConversations: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.GET_CONVERSATIONS)
    );
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    return apiRequest(() =>
      apiClient.get(`${API_CONFIG.ENDPOINTS.MESSAGES.GET_MESSAGES}/${conversationId}`)
    );
  },

  // Send a message
  sendMessage: async (messageData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.SEND, messageData)
    );
  },

  // Mark messages as read
  markAsRead: async (conversationId) => {
    return apiRequest(() =>
      apiClient.put(`${API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ}/${conversationId}`)
    );
  },
};

export default messageAPI;


