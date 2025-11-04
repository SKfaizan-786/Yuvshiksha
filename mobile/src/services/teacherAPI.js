import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Teacher API Service
 */

export const teacherAPI = {
  // Get list of all teachers
  getTeachersList: async (filters = {}) => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.TEACHERS.LIST, { params: filters })
    );
  },

  // Get teacher by ID
  getTeacherById: async (teacherId) => {
    return apiRequest(() =>
      apiClient.get(`${API_CONFIG.ENDPOINTS.TEACHERS.GET_BY_ID}/${teacherId}`)
    );
  },

  // Search teachers
  searchTeachers: async (searchQuery) => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.TEACHERS.SEARCH, {
        params: { q: searchQuery },
      })
    );
  },

  // Get teacher dashboard data
  getDashboard: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.TEACHER.DASHBOARD)
    );
  },

  // Get teacher stats
  getStats: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.TEACHER.STATS)
    );
  },

  // Get teacher schedule
  getSchedule: async (dateRange = {}) => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.TEACHER.SCHEDULE, {
        params: dateRange,
      })
    );
  },
};

export default teacherAPI;


