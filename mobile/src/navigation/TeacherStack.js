import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Import teacher screens
import TeacherDashboardScreen from '../pages/teacher/TeacherDashboardScreen';
import TeacherProfileScreen from '../pages/teacher/TeacherProfileScreen';
import TeacherProfileFormScreen from '../pages/teacher/TeacherProfileFormScreen';
import TeacherProfileEditScreen from '../pages/teacher/TeacherProfileEditScreen';
import TeacherScheduleScreen from '../pages/teacher/TeacherScheduleScreen';
import BookingsScreen from '../pages/teacher/BookingsScreen';
import MessagesScreen from '../pages/teacher/MessagesScreen';
import ChatScreen from '../pages/teacher/ChatScreen';
import NotificationsScreen from '../pages/common/NotificationsScreen';

// Import payment screens
import PaymentProcessingScreen from '../pages/payment/PaymentProcessingScreen';
import PaymentSuccessScreen from '../pages/payment/PaymentSuccessScreen';
import PaymentFailedScreen from '../pages/payment/PaymentFailedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for main teacher screens
const TeacherTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherDashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Schedule"
        component={TeacherScheduleScreen}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={TeacherProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Stack navigator wrapping the tabs to enable navigation to other screens
const TeacherStack = () => {
  const { user } = useAuth();

  // Check if profile is complete
  const isProfileComplete = user?.profileComplete;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={isProfileComplete ? 'TeacherTabs' : 'ProfileSetup'}
    >
      <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
      <Stack.Screen
        name="ProfileSetup"
        component={TeacherProfileFormScreen}
        options={{ gestureEnabled: false }} // Prevent going back if profile incomplete
      />
      <Stack.Screen name="ProfileEdit" component={TeacherProfileEditScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Payment Screens */}
      <Stack.Screen
        name="PaymentProcessing"
        component={PaymentProcessingScreen}
        options={{ gestureEnabled: false }} // Prevent going back during payment
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ gestureEnabled: false }} // Prevent going back after success
      />
      <Stack.Screen
        name="PaymentFailed"
        component={PaymentFailedScreen}
        options={{ gestureEnabled: false }} // Prevent going back after failure
      />
    </Stack.Navigator>
  );
};

export default TeacherStack;
