import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';

/**
 * Formatting utilities
 */

export const formatters = {
  // Format date
  formatDate: (date, formatString = 'MMM dd, yyyy') => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return 'Invalid date';
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  },

  // Format date and time
  formatDateTime: (date, formatString = 'MMM dd, yyyy hh:mm a') => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return 'Invalid date';
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Error formatting date time:', error);
      return 'Invalid date';
    }
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelativeTime: (date) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return 'Invalid date';
      return formatDistance(dateObj, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Invalid date';
    }
  },

  // Format currency
  formatCurrency: (amount, currency = 'INR') => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${amount}`;
    }
  },

  // Format phone number
  formatPhoneNumber: (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  },

  // Truncate text
  truncate: (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Format name
  formatName: (firstName, lastName) => {
    return [firstName, lastName].filter(Boolean).join(' ');
  },

  // Capitalize first letter
  capitalize: (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Format percentage
  formatPercentage: (value, decimals = 0) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
};

export default formatters;






