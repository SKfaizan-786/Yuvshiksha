import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import authAPI from '../../services/authAPI';
import validators from '../../utils/validation';
import COLORS from '../../constants/colors';
import USER_ROLES from '../../constants/roles';

/**
 * Signup Screen
 */
const SignupScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.STUDENT, // Default to student
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validators.isRequired(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    }

    if (!validators.isRequired(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    }

    if (!validators.isRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validators.isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validators.isRequired(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (!validators.isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);

      if (response.success) {
        // Save user data to context and storage
        await login(response.data.user);
        
        // Navigation will be handled automatically by RootNavigator
        console.log('✅ Signup successful');
      } else {
        Alert.alert('Signup Failed', response.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // TODO: Implement Google Sign-In
    Alert.alert('Coming Soon', 'Google Sign-Up will be available soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === USER_ROLES.STUDENT && styles.roleButton_active,
                ]}
                onPress={() => handleChange('role', USER_ROLES.STUDENT)}
              >
                <Ionicons
                  name="school-outline"
                  size={24}
                  color={formData.role === USER_ROLES.STUDENT ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === USER_ROLES.STUDENT && styles.roleButtonText_active,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === USER_ROLES.TEACHER && styles.roleButton_active,
                ]}
                onPress={() => handleChange('role', USER_ROLES.TEACHER)}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={formData.role === USER_ROLES.TEACHER ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === USER_ROLES.TEACHER && styles.roleButtonText_active,
                  ]}
                >
                  Teacher
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="Enter your first name"
              error={errors.firstName}
              leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.gray[500]} />}
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Enter your last name"
              error={errors.lastName}
              leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.gray[500]} />}
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.gray[500]} />}
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[500]} />}
            />

            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[500]} />}
            />

            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              style={styles.signupButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignup}
              variant="outline"
              fullWidth
              icon={<Ionicons name="logo-google" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />}
            />
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  roleButton_active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleButtonText_active: {
    color: COLORS.white,
  },
  form: {
    marginBottom: 24,
  },
  signupButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignupScreen;






