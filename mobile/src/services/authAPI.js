import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Authentication API Service
 */

export const authAPI = {
  // Login with email and password
  login: async (email, password) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password })
    );
  },

  // Register new user
  signup: async (userData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, userData)
    );
  },

  // Logout
  logout: async () => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
    );
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    );
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword,
      })
    );
  },

  // Verify email
  verifyEmail: async (token) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
    );
  },

  // Google OAuth login
  googleLogin: async (googleToken) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.AUTH.GOOGLE_AUTH, { token: googleToken })
    );
  },
};

export default authAPI;


