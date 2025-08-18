// Create this new file at this exact path:
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    TEACHERS_LIST: '/api/teachers/list',
    TEACHERS_DEBUG: '/api/teachers/debug',
    BOOKINGS: '/api/bookings',
    PROFILE: '/api/profile'
  }
};

export default API_CONFIG;