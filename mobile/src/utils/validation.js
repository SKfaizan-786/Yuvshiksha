/**
 * Validation utilities
 */

export const validators = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation (minimum 8 characters)
  isValidPassword: (password) => {
    return password && password.length >= 8;
  },

  // Phone number validation (basic)
  isValidPhone: (phone) => {
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  // Required field validation
  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  // Minimum length validation
  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },

  // Maximum length validation
  maxLength: (value, max) => {
    return value && value.toString().length <= max;
  },

  // Number validation
  isNumber: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  // URL validation
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default validators;






