import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility for React Native using AsyncStorage
 * Replaces localStorage from web version
 */

// Store data
export const saveToStorage = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`✅ Saved to storage: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving to storage (${key}):`, error);
    return false;
  }
};

// Retrieve data
export const getFromStorage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    const value = jsonValue != null ? JSON.parse(jsonValue) : null;
    console.log(`📖 Retrieved from storage: ${key}`, value ? 'Found' : 'Not found');
    return value;
  } catch (error) {
    console.error(`❌ Error reading from storage (${key}):`, error);
    return null;
  }
};

// Remove data
export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Removed from storage: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing from storage (${key}):`, error);
    return false;
  }
};

// Clear all data
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🗑️ Cleared all storage');
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

// Get all keys
export const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('🔑 All storage keys:', keys);
    return keys;
  } catch (error) {
    console.error('❌ Error getting all keys:', error);
    return [];
  }
};

// Multi get
export const getMultiple = async (keys) => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    const result = values.reduce((acc, [key, value]) => {
      acc[key] = value != null ? JSON.parse(value) : null;
      return acc;
    }, {});
    return result;
  } catch (error) {
    console.error('❌ Error getting multiple values:', error);
    return {};
  }
};

// Multi set
export const setMultiple = async (keyValuePairs) => {
  try {
    const pairs = keyValuePairs.map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs);
    console.log('✅ Saved multiple items to storage');
    return true;
  } catch (error) {
    console.error('❌ Error saving multiple items:', error);
    return false;
  }
};

// Storage keys constants
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  AUTH_TOKEN: 'authToken',
  USER_ID: 'userId',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  THEME: 'theme',
  LANGUAGE: 'language',
};


