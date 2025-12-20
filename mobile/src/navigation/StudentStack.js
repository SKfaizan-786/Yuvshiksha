import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Import student screens (we'll create these next)
import StudentDashboardScreen from '../pages/student/StudentDashboardScreen';
import StudentProfileScreen from '../pages/student/StudentProfileScreen';
import StudentProfileFormScreen from '../pages/student/StudentProfileFormScreen';
import StudentEditScreen from '../pages/student/StudentEditScreen';
import TeacherListScreen from '../pages/student/TeacherListScreen';
import BookClassScreen from '../pages/student/BookClassScreen';
import MessagesScreen from '../pages/student/MessagesScreen';
import NotificationsScreen from '../pages/common/NotificationsScreen';
import ChatScreen from '../pages/teacher/ChatScreen';
import MySessionsScreen from '../pages/student/MySessionsScreen';
import FavoriteTeachersScreen from '../pages/student/FavoriteTeachersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for main student screens
const StudentTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Teachers') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: insets.bottom,
          paddingTop: 5,
          height: 60 + insets.bottom,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboardScreen} />
      <Tab.Screen name="Teachers" component={TeacherListScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={StudentProfileScreen} />
    </Tab.Navigator>
  );
};

// Stack navigator wrapping the tabs to enable navigation to other screens
const StudentStack = () => {
  const { user } = useAuth();

  // Check if profile is complete
  const isProfileComplete = user?.profileComplete;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={isProfileComplete ? 'StudentTabs' : 'ProfileSetup'}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen
        name="ProfileSetup"
        component={StudentProfileFormScreen}
        options={{ gestureEnabled: false }} // Prevent going back if profile incomplete
      />
      <Stack.Screen name="StudentProfileEdit" component={StudentEditScreen} />
      <Stack.Screen name="BookClass" component={BookClassScreen} />
      <Stack.Screen name="MySessions" component={MySessionsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="FavoriteTeachers" component={FavoriteTeachersScreen} />
    </Stack.Navigator>
  );
};

export default StudentStack;






