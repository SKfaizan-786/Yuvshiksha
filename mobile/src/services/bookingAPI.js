import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Booking API Service
 */

export const bookingAPI = {
  // Create a new booking
  createBooking: async (bookingData) => {
    return apiRequest(() =>
      apiClient.post(API_CONFIG.ENDPOINTS.BOOKINGS.CREATE, bookingData)
    );
  },

  // Get all bookings
  getAllBookings: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.GET_ALL)
    );
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    return apiRequest(() =>
      apiClient.get(`${API_CONFIG.ENDPOINTS.BOOKINGS.GET_BY_ID}/${bookingId}`)
    );
  },

  // Get student bookings
  getStudentBookings: async () => {
    return apiRequest(() =>
      apiClient.get(`${API_CONFIG.ENDPOINTS.BOOKINGS.STUDENT}?status=all&limit=1000`)
    );
  },

  // Get teacher bookings
  getTeacherBookings: async () => {
    return apiRequest(() =>
      apiClient.get(API_CONFIG.ENDPOINTS.BOOKINGS.TEACHER)
    );
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    return apiRequest(() =>
      apiClient.put(`${API_CONFIG.ENDPOINTS.BOOKINGS.UPDATE}/${bookingId}`, updateData)
    );
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason) => {
    return apiRequest(() =>
      apiClient.post(`${API_CONFIG.ENDPOINTS.BOOKINGS.CANCEL}/${bookingId}`, { reason })
    );
  },

  // Get teacher availability
  getTeacherAvailability: async (teacherId, date) => {
    return apiRequest(() =>
      apiClient.get(`/api/teachers/${teacherId}/availability?date=${date}`)
    );
  },
};

export default bookingAPI;


