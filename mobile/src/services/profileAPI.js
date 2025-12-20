import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Profile API Service
 */

export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.PROFILE.GET)
    );
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest(() =>
      apiClient.put(API_CONFIG.ENDPOINTS.PROFILE.UPDATE, profileData)
    );
  },

  // Student profile setup
  studentSetup: async (setupData) => {
    const isFormData = setupData instanceof FormData;
    return apiRequest(() =>
      apiClient.put(API_CONFIG.ENDPOINTS.PROFILE.STUDENT_SETUP, setupData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        transformRequest: (data, headers) => {
          if (isFormData) {
            // React Native / Axios fix: removing Content-Type lets the browser/native client set it with boundary
            // However, sometimes we need to be careful. 
            // Usually just not setting it is enough if we weren't overriding defaults.
            // Since we have default application/json, we might need to delete it.
            return data;
          }
          return JSON.stringify(data);
        },
      })
    );
  },

  // Teacher profile setup
  teacherSetup: async (setupData) => {
    const isFormData = setupData instanceof FormData;
    return apiRequest(() =>
      apiClient.put(API_CONFIG.ENDPOINTS.PROFILE.TEACHER_SETUP, setupData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      })
    );
  },

  // Get favorite teachers
  getFavorites: async () => {
    return apiRequest(() =>
      apiClient.get('/api/profile/favourites')
    );
  },

  // Add teacher to favorites
  addFavorite: async (teacherId) => {
    return apiRequest(() =>
      apiClient.post('/api/profile/favourites', { teacherId })
    );
  },

  // Remove teacher from favorites
  removeFavorite: async (teacherId) => {
    return apiRequest(() =>
      apiClient.delete(`/api/profile/favourites/${teacherId}`)
    );
  },

  // Update teacher listing status
  updateListingStatus: async (isListed) => {
    return apiRequest(() =>
      apiClient.patch('/api/profile/teacher/listing', { isListed })
    );
  },
};

export default profileAPI;


