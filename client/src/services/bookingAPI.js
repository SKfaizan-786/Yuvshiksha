// API service for booking operations
import API_CONFIG from '../config/api';
const API_BASE_URL = API_CONFIG.BASE_URL + '/api';

// Get auth token from localStorage and remove extra quotes if present
const getAuthToken = () => {
  let token = localStorage.getItem('token');
  if (token && token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  console.log('[bookingAPI] Using token:', token);
  return token;
};

// Create API headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

export const bookingAPI = {
  // Get teacher bookings
  getTeacherBookings: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/bookings/teacher${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching bookings: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get student bookings
  getStudentBookings: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/bookings/student${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching bookings: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error creating booking');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, statusData) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(statusData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error updating booking status');
    }
    
    return response.json();
  },

  // Reschedule booking
  rescheduleBooking: async (bookingId, rescheduleData) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(rescheduleData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error rescheduling booking');
    }
    
    return response.json();
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching booking details: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get teacher availability
  getTeacherAvailability: async (teacherId, date) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/availability?date=${date}`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Error fetching availability: ${response.statusText}`);
    }
    return await response.json();
  }
};
