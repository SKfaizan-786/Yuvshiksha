import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import StudentStack from './StudentStack';
import TeacherStack from './TeacherStack';

/**
 * Root Navigator
 * Handles authentication routing based on user state
 */
const RootNavigator = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('📱 RootNavigator - Auth state:', {
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      profileComplete: user?.profileComplete,
    });
  }, [isAuthenticated, isLoading, user]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // If not authenticated, show auth stack
  if (!isAuthenticated || !user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // If authenticated, determine which stack to show based on role and profile completion
  const getNavigatorByRole = () => {
    // Check if profile is complete - if not, navigate to respective stack which will handle profile setup
    switch (user.role) {
      case 'student':
        return <StudentStack />;
      case 'teacher':
        return <TeacherStack />;
      default:
        console.error('❌ Unknown user role:', user.role);
        return <AuthStack />;
    }
  };

  return (
    <NavigationContainer>
      {getNavigatorByRole()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
});

export default RootNavigator;
