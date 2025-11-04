import React, { createContext, useState, useContext, useEffect } from 'react';
import { saveToStorage, getFromStorage, removeFromStorage, STORAGE_KEYS } from '../utils/storage';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('🔍 AuthContext - Loading user from storage...');
      const storedUser = await getFromStorage(STORAGE_KEYS.CURRENT_USER);
      
      if (storedUser) {
        setUser(storedUser);
        console.log('✅ AuthContext - User loaded:', {
          id: storedUser._id || storedUser.id,
          name: storedUser.firstName,
          role: storedUser.role,
          profileComplete: storedUser.profileComplete,
        });
      } else {
        console.log('ℹ️ AuthContext - No user found in storage');
      }
    } catch (error) {
      console.error('❌ AuthContext - Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      console.log('🔐 AuthContext - Logging in user:', userData.email || userData.firstName);
      
      // Save user to storage
      await saveToStorage(STORAGE_KEYS.CURRENT_USER, userData);
      
      // Save user ID separately for easy access
      const userId = userData._id || userData.id;
      if (userId) {
        await saveToStorage(STORAGE_KEYS.USER_ID, userId);
      }
      
      // Update state
      setUser(userData);
      
      console.log('✅ AuthContext - Login successful');
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext - Logging out user');
      
      // Clear user from storage
      await removeFromStorage(STORAGE_KEYS.CURRENT_USER);
      await removeFromStorage(STORAGE_KEYS.USER_ID);
      await removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      
      // Clear state
      setUser(null);
      
      console.log('✅ AuthContext - Logout successful');
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Logout error:', error);
      return false;
    }
  };

  const updateUser = async (updates) => {
    try {
      console.log('🔄 AuthContext - Updating user:', updates);
      
      // Merge updates with existing user data
      const updatedUser = { ...user, ...updates };
      
      // Save to storage
      await saveToStorage(STORAGE_KEYS.CURRENT_USER, updatedUser);
      
      // Update state
      setUser(updatedUser);
      
      console.log('✅ AuthContext - User updated successfully');
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Update error:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext - Refreshing user data');
      await loadUser();
      return true;
    } catch (error) {
      console.error('❌ AuthContext - Refresh error:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;


