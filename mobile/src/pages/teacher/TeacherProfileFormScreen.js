import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
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
import COLORS from '../../constants/colors';
import profileAPI from '../../services/profileAPI';

const TeacherProfileFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { updateUser, user, logout } = useAuth();
  const isEdit = route.params?.isEdit || false;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    pinCode: '',
    medium: '',
    qualifications: '',
    experienceYears: '',
    currentOccupation: '',
    subjects: '',
    boards: '',
    classes: '',
    teachingMode: [],
    availability: [],
    bio: '',
    teachingApproach: '',
    achievements: '',
    hourlyRate: '',
    photoUrl: '',
  });

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
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [isEdit, user]);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response.success && response.data) {
        const teacher = response.data.teacherProfile || {};
        const userData = response.data || {};

        const photoUrl = teacher.photoUrl || userData.avatar || userData.photoUrl;
        if (photoUrl) setProfileImage(photoUrl);

        const subjectsStr = Array.isArray(teacher.subjects) ? teacher.subjects.map(s => s.text || s).join(', ') : '';
        const boardsStr = Array.isArray(teacher.boards) ? teacher.boards.map(b => b.text || b).join(', ') : '';
        const classesStr = Array.isArray(teacher.classes) ? teacher.classes.map(c => c.text || c).join(', ') : '';
        const achievementsStr = Array.isArray(teacher.achievements) ? teacher.achievements.map(a => a.text || a).join(', ') : '';

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: teacher.phone || '',
          location: teacher.location || '',
          pinCode: teacher.pinCode || '',
          medium: teacher.medium || '',
          qualifications: teacher.qualifications || '',
          experienceYears: teacher.experienceYears?.toString() || '',
          currentOccupation: teacher.currentOccupation || '',
          subjects: subjectsStr,
          boards: boardsStr,
          classes: classesStr,
          teachingMode: teacher.teachingMode || [],
          availability: teacher.availability || [],
          bio: teacher.bio || '',
          teachingApproach: teacher.teachingApproach || '',
          achievements: achievementsStr,
          hourlyRate: teacher.hourlyRate?.toString() || '',
          photoUrl: photoUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const [subjectInput, setSubjectInput] = useState('');
  const [boardInput, setBoardInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');

  const [newSlot, setNewSlot] = useState({ day: '', startTime: '', endTime: '' });
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addTag = (field, value, setInput) => {
    if (!value.trim()) return;
    const currentTags = formData[field] ? formData[field].split(',').map(s => s.trim()).filter(s => s) : [];
    if (!currentTags.includes(value.trim())) {
      const newTags = [...currentTags, value.trim()];
      setFormData({ ...formData, [field]: newTags.join(', ') });
      setInput('');
    }
  };

  const removeTag = (field, tagToRemove) => {
    const currentTags = formData[field] ? formData[field].split(',').map(s => s.trim()).filter(s => s) : [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setFormData({ ...formData, [field]: newTags.join(', ') });
  };

  const handleModeToggle = (mode) => {
    const currentModes = formData.teachingMode;
    if (currentModes.includes(mode)) {
      setFormData({ ...formData, teachingMode: currentModes.filter(m => m !== mode) });
    } else {
      setFormData({ ...formData, teachingMode: [...currentModes, mode] });
    }
  };

  const addAvailabilitySlot = () => {
    if (!newSlot.day || !newSlot.startTime || !newSlot.endTime) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }

    // Time format validation (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlot.startTime) || !timeRegex.test(newSlot.endTime)) {
      Alert.alert('Invalid Time', 'Please use HH:MM format (e.g., 09:00, 14:30)');
      return;
    }

    const hasOverlap = formData.availability.some(slot =>
      slot.day === newSlot.day &&
      (
        (newSlot.startTime >= slot.startTime && newSlot.startTime < slot.endTime) ||
        (newSlot.endTime > slot.startTime && newSlot.endTime <= slot.endTime) ||
        (newSlot.startTime <= slot.startTime && newSlot.endTime >= slot.endTime)
      )
    );
    if (hasOverlap) {
      Alert.alert('Overlap', 'Time slot overlaps with existing slot');
      return;
    }
    setFormData({ ...formData, availability: [...formData.availability, { ...newSlot }] });
    setNewSlot({ day: '', startTime: '', endTime: '' });
  };

  const removeAvailabilitySlot = (index) => {
    setFormData({ ...formData, availability: formData.availability.filter((_, i) => i !== index) });
  };

  // Helper to check if step is valid without showing alerts
  const isStepValid = () => {
    if (currentStep === 0) {
      return (
        !!formData.phone &&
        !!formData.location &&
        !!formData.qualifications
      );
    } else if (currentStep === 1) {
      return (
        !!formData.subjects &&
        !!formData.boards &&
        !!formData.classes &&
        formData.teachingMode.length > 0 &&
        !!formData.medium &&
        formData.availability.length > 0
      );
    }
    return true; // Step 2 (Details) optional or valid by default if empty
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
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else navigation.goBack();
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const formDataToSend = new FormData();

      // Append Image
      if (profileImage && profileImage.startsWith('file://')) {
        const uriParts = profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formDataToSend.append('photo', {
          uri: profileImage,
          name: `profile-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      } else if (profileImage) {
        // If it's an existing URL, pass it as photoUrl
        formDataToSend.append('photoUrl', profileImage);
      }

      // Arrays of objects
      const subjectsArray = formData.subjects ? formData.subjects.split(',').map((s, i) => ({ id: i + 1, text: s.trim() })).filter(s => s.text) : [];
      const boardsArray = formData.boards ? formData.boards.split(',').map((b, i) => ({ id: i + 1, text: b.trim() })).filter(b => b.text) : [];
      const classesArray = formData.classes ? formData.classes.split(',').map((c, i) => ({ id: i + 1, text: c.trim() })).filter(c => c.text) : [];
      const achievementsArray = formData.achievements ? formData.achievements.split(',').map((a, i) => ({ id: i + 1, text: a.trim() })).filter(a => a.text) : [];

      // Append Fields (Mapping to backend expectations)
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('pinCode', formData.pinCode);
      formDataToSend.append('medium', formData.medium);
      formDataToSend.append('qualifications', formData.qualifications);
      formDataToSend.append('experienceYears', formData.experienceYears || '0');
      formDataToSend.append('currentOccupation', formData.currentOccupation);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('teachingApproach', formData.teachingApproach);
      formDataToSend.append('hourlyRate', formData.hourlyRate || '0');

      // Helper to append JSON arrays
      formDataToSend.append('subjectsTaught', JSON.stringify(subjectsArray)); // Mapped key
      formDataToSend.append('boardsTaught', JSON.stringify(boardsArray));     // Mapped key
      formDataToSend.append('classesTaught', JSON.stringify(classesArray));   // Mapped key
      formDataToSend.append('teachingMode', JSON.stringify(formData.teachingMode));
      formDataToSend.append('availability', JSON.stringify(formData.availability));
      formDataToSend.append('achievements', JSON.stringify(achievementsArray));

      const response = await profileAPI.teacherSetup(formDataToSend);

      if (response.success) {
        await updateUser({ profileComplete: true });
        if (isEdit) Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        else Alert.alert('Success', 'Profile completed!', [{ text: 'OK', onPress: () => navigation.replace('TeacherTabs') }]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

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

  const renderTagInput = (label, value, inputVal, setInputFunc, field, placeholder) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagInputContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder={placeholder || `Add ${label}...`}
          value={inputVal}
          onChangeText={setInputFunc}
          onSubmitEditing={() => addTag(field, inputVal, setInputFunc)}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => addTag(field, inputVal, setInputFunc)}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {(value ? value.split(',').map(s => s.trim()).filter(s => s) : []).map((tag, i) => (
          <View key={i} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(field, tag)}>
              <Ionicons name="close-circle" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep >= 0 && styles.activeStepLabel]}>Personal</Text>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.activeStepLabel]}>Teaching</Text>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.activeStepLabel]}>Details</Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;

  const isNextDisabled = !isStepValid();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your profile will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigate to Landing screen in Auth stack
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth', state: { routes: [{ name: 'Landing' }] } }],
              })
            );
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
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
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {renderHeader()}
      {renderStepIndicator()}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Content */}
          {currentStep === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Personal Details</Text>
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                  {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{formData.firstName?.[0] || 'T'}</Text></View>}
                  <View style={styles.cameraIcon}><Ionicons name="camera" size={16} color={COLORS.white} /></View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>{profileImage ? 'Tap to change photo' : 'Upload a photo'}</Text>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>{renderInput('First Name', formData.firstName, 'firstName', 'John', false, 'default', false)}</View>
                <View style={{ flex: 1, marginLeft: 8 }}>{renderInput('Last Name', formData.lastName, 'lastName', 'Doe', false, 'default', false)}</View>
              </View>
              {renderInput('Email Address', formData.email, 'email', 'john@example.com', false, 'email-address', false)}
              {renderInput('Phone Number *', formData.phone, 'phone', 'e.g., +91 98765 43210', false, 'phone-pad')}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g., Kolkata, West Bengal — please include your locality for better accuracy"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              {renderInput('Pin Code', formData.pinCode, 'pinCode', 'e.g., 700001', false, 'number-pad')}
              {renderInput('Qualifications *', formData.qualifications, 'qualifications', 'e.g., M.Sc. Physics, B.Tech CSE')}
              {renderInput('Experience (Years)', formData.experienceYears, 'experienceYears', 'e.g., 5', false, 'number-pad')}
              {renderInput('Current Occupation', formData.currentOccupation, 'currentOccupation', 'e.g., Full-time Teacher, Freelance Tutor')}
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Teaching Expertise</Text>
              {renderTagInput('Subjects *', formData.subjects, subjectInput, setSubjectInput, 'subjects', 'Add a subject, e.g., Mathematics')}
              {renderTagInput('Boards *', formData.boards, boardInput, setBoardInput, 'boards', 'Add a board, e.g., CBSE, ICSE')}
              {renderTagInput('Classes *', formData.classes, classInput, setClassInput, 'classes', 'Add a class/course, e.g., Class 10, JEE Mains')}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teaching Mode *</Text>
                <View style={styles.checkboxGroup}>
                  {["Teacher's place", "Student's place", "Online"].map(mode => (
                    <TouchableOpacity key={mode} style={[styles.checkbox, formData.teachingMode.includes(mode) && styles.checkboxActive]} onPress={() => handleModeToggle(mode)}>
                      <Ionicons name={formData.teachingMode.includes(mode) ? "checkbox" : "square-outline"} size={20} color={formData.teachingMode.includes(mode) ? COLORS.primary : COLORS.gray[400]} />
                      <Text style={[styles.checkboxText, formData.teachingMode.includes(mode) && styles.checkboxTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderInput('Medium *', formData.medium, 'medium', 'e.g., English, Hindi, Bengali')}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Availability *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {daysOfWeek.map(day => (
                    <TouchableOpacity key={day} style={[styles.dayButton, newSlot.day === day && styles.dayButtonActive]} onPress={() => setNewSlot({ ...newSlot, day })}>
                      <Text style={[styles.dayButtonText, newSlot.day === day && styles.dayButtonTextActive]}>{day.substring(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={[styles.row, { marginBottom: 10 }]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 5 }]}
                    placeholder="Starts (HH:MM)"
                    placeholderTextColor={COLORS.gray[400]}
                    value={newSlot.startTime}
                    onChangeText={t => setNewSlot({ ...newSlot, startTime: t })}
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 5 }]}
                    placeholder="Ends (HH:MM)"
                    placeholderTextColor={COLORS.gray[400]}
                    value={newSlot.endTime}
                    onChangeText={t => setNewSlot({ ...newSlot, endTime: t })}
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <TouchableOpacity style={styles.addSlotButton} onPress={addAvailabilitySlot}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Slot</Text>
                </TouchableOpacity>
                {formData.availability.map((slot, i) => (
                  <View key={i} style={styles.slotItem}>
                    <Text style={{ flex: 1 }}>{slot.day}: {slot.startTime} - {slot.endTime}</Text>
                    <TouchableOpacity onPress={() => removeAvailabilitySlot(i)}><Ionicons name="trash" size={18} color="red" /></TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Profile Details</Text>
              {renderInput('Bio', formData.bio, 'bio', 'Share your teaching philosophy, experience highlights, etc.', true)}
              {renderInput('Teaching Approach', formData.teachingApproach, 'teachingApproach', 'How do you structure your classes? What makes your teaching unique?', true)}
              {renderTagInput('Achievements', formData.achievements, achievementInput, setAchievementInput, 'achievements', 'Add an achievement, e.g., 90% students scored A+')}
              {renderInput('Hourly Rate (₹)', formData.hourlyRate, 'hourlyRate', 'e.g., 500', false, 'number-pad')}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

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
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{currentStep === 2 ? 'Complete Profile' : 'Continue'}</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  loader: { flex: 1 },
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
  tagInputContainer: { flexDirection: 'row', gap: 12 },
  tagInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray[200], borderRadius: 16, padding: 16, fontSize: 16 },
  addButton: { backgroundColor: COLORS.primary, width: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, gap: 8, borderWidth: 1, borderColor: '#E0E7FF' },
  tagText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  checkboxGroup: { gap: 12 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.gray[200] },
  checkboxActive: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  checkboxText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  checkboxTextActive: { color: COLORS.primary, fontWeight: '700' },
  dayButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.gray[100], marginRight: 10 },
  dayButtonActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  dayButtonText: { color: COLORS.textSecondary, fontWeight: '600' },
  dayButtonTextActive: { color: COLORS.white, fontWeight: '700' },
  addSlotButton: { backgroundColor: COLORS.textPrimary, padding: 16, borderRadius: 16, alignItems: 'center', marginVertical: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  slotItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: COLORS.gray[200] },
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

export default TeacherProfileFormScreen;
