import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import CustomAlert from '../../components/CustomAlert';
import COLORS from '../../constants/colors';
import profileAPI from '../../services/profileAPI';

const { width } = Dimensions.get('window');

const StudentProfileFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { updateUser, user, logout } = useAuth();
  const isEdit = route.params?.isEdit || false;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    pinCode: '',
    grade: '', // Class/Course
    board: '', // Board/University
    medium: '',
    bio: '',
    interests: '',
    learningGoals: '',
    mode: [],
    photoUrl: '',
  });

  // Alert state
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (type, title, message, buttons = []) => {
    setAlert({ visible: true, type, title, message, buttons });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  // Validation errors for phone and PIN
  const [validationErrors, setValidationErrors] = useState({
    phone: '',
    pinCode: '',
  });

  const validatePhone = (phone) => {
    // Remove all spaces and special characters except +
    const cleaned = phone.replace(/[^0-9+]/g, '');

    // Check if it's with country code (+91 followed by 10 digits) or just 10 digits
    const withCountryCode = /^\+\d{1,3}\d{10}$/; // +91 or other country codes
    const withoutCountryCode = /^\d{10}$/; // Just 10 digits

    if (withCountryCode.test(cleaned) || withoutCountryCode.test(cleaned)) {
      setValidationErrors(prev => ({ ...prev, phone: '' }));
      return true;
    } else {
      setValidationErrors(prev => ({ ...prev, phone: 'Enter 10 digits or with country code (e.g., +91)' }));
      return false;
    }
  };

  const validatePinCode = (pin) => {
    const cleaned = pin.replace(/[^0-9]/g, '');

    if (cleaned.length === 6) {
      setValidationErrors(prev => ({ ...prev, pinCode: '' }));
      return true;
    } else {
      setValidationErrors(prev => ({ ...prev, pinCode: 'Enter 6 digits' }));
      return false;
    }
  };

  // Animated value for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  useEffect(() => {
    if (isEdit) {
      loadProfile();
    } else if (user) {
      // Pre-fill user data if available
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [isEdit, user]);

  // Validate phone and PIN when they change
  useEffect(() => {
    if (formData.phone) {
      validatePhone(formData.phone);
    }
    if (formData.pinCode) {
      validatePinCode(formData.pinCode);
    }
  }, [formData.phone, formData.pinCode]);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response.success && response.data) {
        const student = response.data.studentProfile || {};
        const userData = response.data || {};

        const photoUrl = student.photoUrl || userData.avatar || userData.photoUrl;
        if (photoUrl) setProfileImage(photoUrl);

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: student.phone || '',
          location: student.location || '',
          pinCode: student.pinCode || '',
          grade: student.grade || '',
          board: student.model === 'School' ? student.board : (student.school || ''),
          medium: student.medium || '',
          bio: student.bio || '',
          interests: (student.subjects || student.interests || []).join(', '),
          learningGoals: (student.learningGoals || []).join(', '),
          mode: student.mode || [],
          photoUrl: photoUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper inputs for tags
  const [subjectInput, setSubjectInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Required', 'Please grant access to your photo library.', [
          { text: 'OK', style: 'default' }
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('error', 'Error', 'Failed to pick image.', [
        { text: 'OK', style: 'default' }
      ]);
    }
  };

  const addTag = (field, value, setInput) => {
    if (!value.trim()) return;
    const currentTags = formData[field]
      ? formData[field].split(',').map(s => s.trim()).filter(s => s)
      : [];
    if (!currentTags.includes(value.trim())) {
      const newTags = [...currentTags, value.trim()];
      setFormData({ ...formData, [field]: newTags.join(', ') });
      setInput('');
    }
  };

  const removeTag = (field, tagToRemove) => {
    const currentTags = formData[field]
      ? formData[field].split(',').map(s => s.trim()).filter(s => s)
      : [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setFormData({ ...formData, [field]: newTags.join(', ') });
  };

  const handleModeToggle = (modeOption) => {
    const currentModes = formData.mode;
    if (currentModes.includes(modeOption)) {
      setFormData({ ...formData, mode: currentModes.filter(m => m !== modeOption) });
    } else {
      setFormData({ ...formData, mode: [...currentModes, modeOption] });
    }
  };

  const isStepValid = () => {
    if (currentStep === 0) {
      return (
        !!formData.phone.trim() &&
        !!formData.location.trim() &&
        !!formData.pinCode.trim() &&
        !validationErrors.phone &&
        !validationErrors.pinCode
      );
    } else if (currentStep === 1) {
      return (
        !!formData.interests &&
        formData.mode.length > 0 &&
        !!formData.medium.trim() &&
        !!formData.board.trim() &&
        !!formData.grade.trim()
      );
    } else if (currentStep === 2) {
      return true;
    }
    return true;
  };
  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const formDataToSend = new FormData();

      // Append image if new file
      if (profileImage && profileImage.startsWith('file://')) {
        const uriParts = profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formDataToSend.append('photo', {
          uri: profileImage,
          name: `profile-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      // Append all form fields
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('pinCode', formData.pinCode);
      formDataToSend.append('grade', formData.grade);
      formDataToSend.append('school', formData.board);
      formDataToSend.append('medium', formData.medium);
      formDataToSend.append('bio', formData.bio);

      // Append arrays as JSON strings
      const subjects = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(i => i) : [];
      const learningGoals = formData.learningGoals ? formData.learningGoals.split(',').map(i => i.trim()).filter(i => i) : [];
      formDataToSend.append('subjects', JSON.stringify(subjects));
      formDataToSend.append('learningGoals', JSON.stringify(learningGoals));
      formDataToSend.append('mode', JSON.stringify(formData.mode));

      // Debug logging
      console.log('🔍 Student Profile Setup - Debug Info:');
      console.log('👤 Current User:', user);
      console.log('📝 User Role:', user?.role);
      console.log('📤 Submitting to API...');

      const response = await profileAPI.studentSetup(formDataToSend);

      console.log('📥 API Response:', response);

      // ... (success handling)
      if (response.success) {
        await updateUser({ profileComplete: true });
        if (isEdit) {
          showAlert('success', 'Success!', 'Your profile has been updated successfully.', [
            { text: 'OK', onPress: () => navigation.goBack(), style: 'default' }
          ]);
        } else {
          showAlert('success', 'Profile Completed!', 'Welcome to Yuvshiksha! Your profile is now complete.', [
            { text: 'Get Started', onPress: () => navigation.replace('StudentTabs'), style: 'default' }
          ]);
        }
      } else {
        showAlert('error', 'Error', response.message || 'Failed to save profile. Please try again.', [
          { text: 'OK', style: 'default' }
        ]);
      }

    } catch (error) {
      showAlert('error', 'Error', 'Failed to save profile. Please try again.', [
        { text: 'OK', style: 'default' }
      ]);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // ... (renderInput helper)
  const renderInput = (label, value, key, placeholder, multiline = false, keyboardType = 'default', editable = true) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, !editable && styles.disabledInput]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        value={value}
        onChangeText={(text) => setFormData({ ...formData, [key]: text })}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep >= 0 && styles.activeStepLabel]}>Contact</Text>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.activeStepLabel]}>Preferences</Text>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.activeStepLabel]}>About</Text>
      </View>
    </View>
  );

  // ... (loading check)

  const isNextDisabled = !isStepValid();

  const handleLogout = async () => {
    showAlert('confirm', 'Logout', 'Are you sure you want to logout? Your profile will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Navigation handled automatically by RootNavigator when user state changes
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Profile' : 'Complete Profile'}
          </Text>
          {!isEdit && (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {renderHeader()}

      {renderStepIndicator()}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

          {currentStep === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Contact & Location</Text>

              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{formData.firstName?.[0]?.toUpperCase() || 'S'}</Text>
                    </View>
                  )}
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={16} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>{profileImage ? 'Tap to change photo' : 'Upload a photo'}</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {renderInput('First Name', formData.firstName, 'firstName', 'John', false, 'default', false)}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {renderInput('Last Name', formData.lastName, 'lastName', 'Doe', false, 'default', false)}
                </View>
              </View>

              {renderInput('Email Address', formData.email, 'email', 'john@example.com', false, 'email-address', false)}

              {renderInput('Phone Number *', formData.phone, 'phone', 'e.g. +91 9876543210', false, 'phone-pad')}
              {validationErrors.phone ? (
                <Text style={styles.validationError}>{validationErrors.phone}</Text>
              ) : null}

              {renderInput('Location *', formData.location, 'location', 'e.g. Kolkata')}

              {renderInput('Pin Code *', formData.pinCode, 'pinCode', 'e.g. 700001', false, 'number-pad')}
              {validationErrors.pinCode ? (
                <Text style={styles.validationError}>{validationErrors.pinCode}</Text>
              ) : null}
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your Learning Preferences</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Learning Interests *</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="e.g. Mathematics"
                    placeholderTextColor={COLORS.gray[400]}
                    value={subjectInput}
                    onChangeText={setSubjectInput}
                    onSubmitEditing={() => addTag('interests', subjectInput, setSubjectInput)}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={() => addTag('interests', subjectInput, setSubjectInput)}>
                    <Ionicons name="add" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {(formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(s => s) : []).map((tag, i) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagText} numberOfLines={1} ellipsizeMode="tail">{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag('interests', tag)}>
                        <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Preferred Learning Mode *</Text>
                <View style={styles.checkboxGroup}>
                  {["Teacher's place", "Student's place", "Online"].map(mode => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.checkbox, formData.mode.includes(mode) && styles.checkboxActive]}
                      onPress={() => handleModeToggle(mode)}
                    >
                      <Ionicons
                        name={formData.mode.includes(mode) ? "checkbox" : "square-outline"}
                        size={20}
                        color={formData.mode.includes(mode) ? COLORS.primary : COLORS.gray[400]}
                      />
                      <Text style={[styles.checkboxText, formData.mode.includes(mode) && styles.checkboxTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderInput('Medium of Instruction *', formData.medium, 'medium', 'e.g. English')}
              {renderInput('Board/University *', formData.board, 'board', 'e.g. CBSE')}
              {renderInput('Class/Course *', formData.grade, 'grade', 'e.g. Class 12')}
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>More About You</Text>

              {renderInput('Tell us about yourself', formData.bio, 'bio', 'Share your interests, hobbies, or anything you\'d like your tutor to know...', true)}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Learning Goals</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="e.g. Learn Python"
                    placeholderTextColor={COLORS.gray[400]}
                    value={goalInput}
                    onChangeText={setGoalInput}
                    onSubmitEditing={() => addTag('learningGoals', goalInput, setGoalInput)}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={() => addTag('learningGoals', goalInput, setGoalInput)}>
                    <Ionicons name="add" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {(formData.learningGoals ? formData.learningGoals.split(',').map(s => s.trim()).filter(s => s) : []).map((tag, i) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagText} numberOfLines={1} ellipsizeMode="tail">{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag('learningGoals', tag)}>
                        <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 300 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton, currentStep === 0 && styles.hiddenButton]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, (isNextDisabled || submitting) && styles.disabledButton]}
          onPress={handleNext}
          disabled={isNextDisabled || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>{currentStep === 2 ? 'Complete Profile' : 'Continue'}</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSafeArea: {
    backgroundColor: COLORS.primary,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  progressContainer: { padding: 20, paddingBottom: 10, backgroundColor: COLORS.white },
  progressBarBg: { height: 6, backgroundColor: COLORS.gray[200], borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabel: { fontSize: 12, color: COLORS.textSecondary },
  activeStepLabel: { color: COLORS.primary, fontWeight: '600' },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 24, letterSpacing: -0.5 },

  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { position: 'relative', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.gray[200], borderWidth: 4, borderColor: COLORS.white },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.white },
  avatarText: { fontSize: 44, color: COLORS.white, fontWeight: 'bold' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.textPrimary, padding: 10, borderRadius: 25, borderWidth: 3, borderColor: COLORS.white },
  changePhotoText: { marginTop: 12, color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  row: { flexDirection: 'row' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray[200], borderRadius: 16, padding: 16, fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  disabledInput: { backgroundColor: COLORS.gray[50], color: COLORS.textSecondary, borderColor: COLORS.gray[100] },
  textArea: { minHeight: 120, paddingTop: 16 },

  checkboxGroup: { gap: 12 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.gray[200] },
  checkboxActive: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  checkboxText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  checkboxTextActive: { color: COLORS.primary, fontWeight: '700' },

  tagInputContainer: { flexDirection: 'row', gap: 12 },
  tagInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray[200], borderRadius: 16, padding: 16, fontSize: 16 },
  addButton: { backgroundColor: COLORS.primary, width: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  validationError: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 12,
    fontWeight: '500',
  },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 24, gap: 8, borderWidth: 1, borderColor: '#E0E7FF', maxWidth: '100%' },
  tagText: { color: COLORS.primary, fontWeight: '600', fontSize: 13, flexShrink: 1 },

  // Bottom Bar Redesigned
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    alignItems: 'center',
    gap: 16
  },
  navButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 64, // Bigger tap area
  },
  backButton: {
    width: 64,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200]
  },
  backButtonText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  hiddenButton: { opacity: 0 },
  disabledButton: { backgroundColor: COLORS.gray[300], shadowOpacity: 0, elevation: 0 },
  nextButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 18, marginRight: 4 },
});

export default StudentProfileFormScreen;
