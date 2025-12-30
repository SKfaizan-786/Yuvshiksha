import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import authAPI from '../../services/authAPI';
import emailOtpAPI from '../../services/emailOtpAPI';
import validators from '../../utils/validation';
import { saveToStorage, STORAGE_KEYS } from '../../utils/storage';
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
    gender: '', // For teachers
    maritalStatus: '', // For teachers
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // Track if user is on OTP verification step
  const [otp, setOtp] = useState(''); // Store OTP input
  const [otpError, setOtpError] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Countdown timer for OTP
  useEffect(() => {
    let interval;
    if (otpStep && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, timer]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

    // Validate teacher-specific fields
    if (formData.role === USER_ROLES.TEACHER) {
      if (!validators.isRequired(formData.gender)) {
        newErrors.gender = 'Gender is required for teachers';
      }
      if (!validators.isRequired(formData.maritalStatus)) {
        newErrors.maritalStatus = 'Marital status is required for teachers';
      }
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
      // Step 1: Send OTP to email (don't create account yet)
      const response = await emailOtpAPI.sendOtp(formData.email);

      if (response.success) {
        // Show OTP verification screen and reset timer
        setOtpStep(true);
        setTimer(300); // Reset to 5 minutes
        setCanResend(false);
        showToast('success', 'OTP sent to your email');
      } else {
        showToast('error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ OTP send error:', error);
      showToast('error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      // Step 2: Verify OTP
      const verifyResponse = await emailOtpAPI.verifyOtp(formData.email, otp);

      if (!verifyResponse.success) {
        showToast('error', verifyResponse.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // Step 3: Create account after OTP verification
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);

      if (response.success) {
        // Check if we have both token and user
        if (!response.data?.user) {
          showToast('error', 'Signup failed - no user data received');
          return;
        }

        if (!response.data?.user?._id) {
          showToast('error', 'Signup failed - invalid user data');
          return;
        }

        // Save token if present in response
        if (response.data.token) {
          await saveToStorage(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        }

        // Show success message
        showToast('success', 'Account created successfully!');

        // Save user data to context and storage (this will trigger navigation)
        setTimeout(async () => {
          await login(response.data.user);
        }, 1500); // Small delay to show success message
      } else {
        showToast('error', response.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      showToast('error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />
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
              onPress={() => otpStep ? setOtpStep(false) : navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>{otpStep ? 'Verify Email' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {otpStep ? 'Enter the OTP sent to your email' : 'Sign up to get started'}
            </Text>
          </View>

          {/* OTP Verification Screen */}
          {otpStep ? (
            <View style={styles.otpContainer}>
              <View style={styles.otpIconContainer}>
                <Ionicons name="mail-outline" size={64} color={COLORS.primary} />
              </View>

              <Text style={styles.otpInfoText}>
                We've sent a 6-digit verification code to
              </Text>
              <Text style={styles.otpEmailText}>{formData.email}</Text>

              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, ''));
                    setOtpError('');
                  }}
                  placeholder="000000"
                  placeholderTextColor={COLORS.gray?.[400] || '#9ca3af'}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              {/* Timer Display */}
              <View style={styles.timerContainer}>
                <Ionicons
                  name={timer > 60 ? "time-outline" : "warning-outline"}
                  size={20}
                  color={timer > 60 ? COLORS.primary : '#f59e0b'}
                />
                <Text style={[styles.timerText, timer <= 60 && styles.timerTextWarning]}>
                  {timer > 0 ? `Code expires in ${formatTime(timer)}` : 'Code expired'}
                </Text>
              </View>

              {otpError ? (
                <Text style={styles.errorText}>{otpError}</Text>
              ) : null}

              <Button
                title="Verify & Create Account"
                onPress={handleOtpVerify}
                loading={loading}
                fullWidth
                style={styles.verifyButton}
              />

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading || !canResend}
                style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
              >
                <Text style={[styles.resendButtonText, !canResend && styles.resendButtonTextDisabled]}>
                  Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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

                {/* Teacher-specific fields */}
                {formData.role === USER_ROLES.TEACHER && (
                  <>
                    <View style={styles.teacherFieldsContainer}>
                      <Text style={styles.teacherFieldsLabel}>Teacher Information</Text>

                      {/* Gender Selection */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender *</Text>
                        <View style={styles.optionButtons}>
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              formData.gender === 'male' && styles.optionButton_active,
                            ]}
                            onPress={() => handleChange('gender', 'male')}
                          >
                            <Ionicons
                              name="male"
                              size={20}
                              color={formData.gender === 'male' ? COLORS.white : COLORS.primary}
                            />
                            <Text
                              style={[
                                styles.optionButtonText,
                                formData.gender === 'male' && styles.optionButtonText_active,
                              ]}
                            >
                              Male
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              formData.gender === 'female' && styles.optionButton_active,
                            ]}
                            onPress={() => handleChange('gender', 'female')}
                          >
                            <Ionicons
                              name="female"
                              size={20}
                              color={formData.gender === 'female' ? COLORS.white : COLORS.primary}
                            />
                            <Text
                              style={[
                                styles.optionButtonText,
                                formData.gender === 'female' && styles.optionButtonText_active,
                              ]}
                            >
                              Female
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                      </View>

                      {/* Marital Status Selection */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Marital Status *</Text>
                        <View style={styles.optionButtons}>
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              formData.maritalStatus === 'married' && styles.optionButton_active,
                            ]}
                            onPress={() => handleChange('maritalStatus', 'married')}
                          >
                            <Ionicons
                              name="people"
                              size={20}
                              color={formData.maritalStatus === 'married' ? COLORS.white : COLORS.primary}
                            />
                            <Text
                              style={[
                                styles.optionButtonText,
                                formData.maritalStatus === 'married' && styles.optionButtonText_active,
                              ]}
                            >
                              Married
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              formData.maritalStatus === 'unmarried' && styles.optionButton_active,
                            ]}
                            onPress={() => handleChange('maritalStatus', 'unmarried')}
                          >
                            <Ionicons
                              name="person"
                              size={20}
                              color={formData.maritalStatus === 'unmarried' ? COLORS.white : COLORS.primary}
                            />
                            <Text
                              style={[
                                styles.optionButtonText,
                                formData.maritalStatus === 'unmarried' && styles.optionButtonText_active,
                              ]}
                            >
                              Unmarried
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {errors.maritalStatus && <Text style={styles.errorText}>{errors.maritalStatus}</Text>}
                      </View>
                    </View>
                  </>
                )}

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
              </View>

              {/* Sign In Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  teacherFieldsContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  teacherFieldsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionButton_active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionButtonText_active: {
    color: COLORS.white,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error || '#ef4444',
    marginTop: 4,
  },
  // OTP Verification Styles
  otpContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  otpIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpInfoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpEmailText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  otpInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    color: COLORS.textPrimary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  timerTextWarning: {
    color: '#f59e0b',
  },
  verifyButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resendButtonTextDisabled: {
    color: COLORS.gray?.[400] || '#9ca3af',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default SignupScreen;