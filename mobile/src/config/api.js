import Constants from 'expo-constants';

/**
 * API Configuration for React Native
 * Configure your backend URL here
 */

// Get backend URL from environment or use default
// IMPORTANT: Replace 'https://your-vps-domain.com' with your actual VPS URL
const getBackendUrl = () => {
  // Try to get from Expo config first
  const expoConfig = Constants.expoConfig;
  if (expoConfig?.extra?.backendUrl) {
    return expoConfig.extra.backendUrl;
  }

  // Default URLs based on environment
  if (__DEV__) {
    // Development mode
    // Option 1: Use VPS URL directly (recommended)
    return 'https://api.yuvsiksha.in'; // ✅ Your VPS backend URL

    // Option 2: Use local backend for development (uncomment if needed)
    // For Android emulator: use 10.0.2.2
    // For iOS simulator: use localhost
    // For physical device: use your computer's local IP (e.g., 192.168.1.x)
    // return 'http://192.168.1.x:5000'; // Replace x with your IP
  }

  // Production mode - use VPS backend URL
  return 'https://api.yuvsiksha.in'; // ✅ Your VPS backend URL
};

const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_EMAIL: '/api/auth/verify-email',
      GOOGLE_AUTH: '/api/auth/google',
    },
    // Profile endpoints
    PROFILE: {
      GET: '/api/profile',
      UPDATE: '/api/profile',
      STUDENT_SETUP: '/api/profile/student',
      TEACHER_SETUP: '/api/profile/teacher',
    },
    // Teachers endpoints
    TEACHERS: {
      LIST: '/api/teachers/list',
      GET_BY_ID: '/api/teachers',
      SEARCH: '/api/teachers/search',
      DEBUG: '/api/teachers/debug',
    },
    // Bookings endpoints
    BOOKINGS: {
      CREATE: '/api/bookings',
      GET_ALL: '/api/bookings',
      GET_BY_ID: '/api/bookings',
      UPDATE: '/api/bookings',
      CANCEL: '/api/bookings',
      STUDENT: '/api/bookings/student',
      TEACHER: '/api/bookings/teacher',
    },
    // Payments endpoints
    PAYMENTS: {
      CREATE_ORDER: '/api/payments/cashfree-order',
      VERIFY: '/api/payments/verify',
      GET_STATUS: '/api/payments/status',
    },
    // Notifications endpoints
    NOTIFICATIONS: {
      GET_ALL: '/api/notifications',
      MARK_READ: '/api/notifications/mark-read',
      DELETE: '/api/notifications',
      SETTINGS: '/api/notifications/settings',
    },
    // Messages endpoints
    MESSAGES: {
      GET_CONVERSATIONS: '/api/messages/conversations',
      GET_MESSAGES: '/api/messages',
      SEND: '/api/messages/send',
      MARK_READ: '/api/messages/read',
    },
    // Student dashboard
    STUDENT: {
      DASHBOARD: '/api/student/dashboard',
      STATS: '/api/student/stats',
    },
    // Teacher dashboard
    TEACHER: {
      DASHBOARD: '/api/teacher/dashboard',
      STATS: '/api/teacher/stats',
      SCHEDULE: '/api/teacher/schedule',
    },
  },
};

export default API_CONFIG;

