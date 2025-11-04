import axios from 'axios';
import API_CONFIG from '../config/api';
import { getFromStorage, STORAGE_KEYS } from '../utils/storage';

/**
 * API client service for React Native
 * Handles all HTTP requests to the backend
 */

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get auth token from storage if available
      const token = await getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, 
                `Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, 
                  `Status: ${error.response?.status}`);
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // TODO: Implement token refresh logic here if your backend supports it
      // For now, just log the error
      console.log('🔐 Unauthorized - User needs to log in again');
      
      // You might want to trigger a logout or redirect to login
      // This can be done by emitting an event or using a navigation service
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - Check your internet connection');
      error.message = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Helper function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'Something went wrong';
    return {
      success: false,
      message,
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'No response from server. Please check your connection.',
      status: 0,
    };
  } else {
    // Error in request configuration
    return {
      success: false,
      message: error.message || 'Failed to make request',
      status: 0,
    };
  }
};

// API request wrapper with error handling
export const apiRequest = async (requestFn) => {
  try {
    const response = await requestFn();
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return handleApiError(error);
  }
};


