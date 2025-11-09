import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import RootNavigator from './src/navigation/RootNavigator';
import { getFromStorage, STORAGE_KEYS } from './src/utils/storage';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any resources or data here
        // For example, fonts, images, etc.
        console.log('📱 App preparing...');
        
        // Small delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ App ready');
      } catch (e) {
        console.warn('❌ Error preparing app:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen when app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Update userId when user changes
  useEffect(() => {
    if (user) {
      const id = user._id || user.id;
      setUserId(id);
      console.log('📱 App - User ID updated:', id);
    } else {
      setUserId(null);
      console.log('📱 App - No user');
    }
  }, [user]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SocketProvider userId={userId}>
      <NotificationProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </NotificationProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
