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

  // Upload profile image
  uploadImage: async (imageUri) => {
    const formData = new FormData();
    
    // Extract file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: imageUri,
      name: `profile-${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    });

    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.PROFILE.UPLOAD_IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  },

  // Student profile setup
  studentSetup: async (setupData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.PROFILE.STUDENT_SETUP, setupData)
    );
  },

  // Teacher profile setup
  teacherSetup: async (setupData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.PROFILE.TEACHER_SETUP, setupData)
    );
  },
};

export default profileAPI;


