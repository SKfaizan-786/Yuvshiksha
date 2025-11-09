import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import auth screens (we'll create these next)
import LoginScreen from '../pages/auth/LoginScreen';
import SignupScreen from '../pages/auth/SignupScreen';
import ForgotPasswordScreen from '../pages/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../pages/auth/ResetPasswordScreen';
import LandingScreen from '../pages/common/LandingScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;


