/**
 * Utility functions for handling localStorage operations with JWT tokens and user data
 */

// Set item to localStorage with expiration (for JWT tokens)
export const setToLocalStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Get item from localStorage
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Remove item from localStorage
export const removeFromLocalStorage = (key) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Save JWT token with expiration check
export const saveAuthToken = (token) => {
  setToLocalStorage('authToken', token);
};

// Get JWT token with expiration validation
export const getAuthToken = () => {
  const token = getFromLocalStorage('authToken');
  if (!token) return null;

  // In a real app, you would decode the JWT and check expiration
  return token;
};

// Clear authentication data
export const clearAuthData = () => {
  removeFromLocalStorage('authToken');
  removeFromLocalStorage('currentUser');
};

// Save current user data
export const saveCurrentUser = (userData) => {
  setToLocalStorage('currentUser', userData);
};

// Get current user data
export const getCurrentUser = () => {
  return getFromLocalStorage('currentUser');
};

// Check if user is authenticated (has valid token)
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Check user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};
