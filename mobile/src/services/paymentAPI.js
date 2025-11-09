import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Payment API Service
 */

export const paymentAPI = {
  // Create payment order
  createOrder: async (orderData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE_ORDER, orderData)
    );
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, paymentData)
    );
  },

  // Get payment status
  getPaymentStatus: async (orderId) => {
    return apiRequest(() =>
      apiClient.get(`${API_CONFIG.ENDPOINTS.PAYMENTS.GET_STATUS}/${orderId}`)
    );
  },
};

export default paymentAPI;


