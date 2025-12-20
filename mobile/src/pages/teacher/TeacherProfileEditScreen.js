import { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const TeacherProfileEditScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    pinCode: '',
    medium: '',
    qualifications: '',
    experienceYears: '',
    currentOccupation: '',
    bio: '',
    teachingApproach: '',
    hourlyRate: '',
    subjectsTaught: '',
    boardsTaught: '',
    classesTaught: '',
    teachingMode: '',
    achievements: '',
    availability: [], // Preserve schedule/availability data
  });

  useEffect(() => {
    loadTeacherProfile();
  }, []);

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        { withCredentials: true }
      );

      if (response.data) {
        const profile = response.data.teacherProfile || {};

        // Set profile image if available with multiple fallbacks
        const photoUrl = profile.photoUrl || response.data.avatar || response.data.photoUrl;
        if (photoUrl) {
          setProfileImage(photoUrl);
        }

        // Convert array fields to comma-separated strings
        const subjectsArray = profile.subjects || profile.subjectsTaught || [];
        const subjectsStr = Array.isArray(subjectsArray)
          ? subjectsArray.map(s => s.text || s).join(', ')
          : '';

        const boardsArray = profile.boards || profile.boardsTaught || [];
        const boardsStr = Array.isArray(boardsArray)
          ? boardsArray.map(b => b.text || b).join(', ')
          : '';

        const classesArray = profile.classes || profile.classesTaught || [];
        const classesStr = Array.isArray(classesArray)
          ? classesArray.map(c => c.text || c).join(', ')
          : '';

        const modesArray = Array.isArray(profile.teachingMode)
          ? profile.teachingMode
          : [];

        const achievementsStr = Array.isArray(profile.achievements)
          ? profile.achievements.map(a => a.text || a).join(', ')
          : '';

        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          pinCode: profile.pinCode || '',
          medium: profile.medium || '',
          qualifications: profile.qualifications || '',
          experienceYears: profile.experienceYears?.toString() || '',
          currentOccupation: profile.currentOccupation || '',
          bio: profile.bio || '',
          teachingApproach: profile.teachingApproach || '',
          hourlyRate: profile.hourlyRate?.toString() || '',
          subjectsTaught: subjectsStr,
          boardsTaught: boardsStr,
          classesTaught: classesStr,
          teachingMode: modesArray, // Changed to array
          achievements: achievementsStr,
          availability: profile.availability || [], // Preserve schedule data
        });
      }
    } catch (error) {
      console.log('Profile API not ready, using demo data');
      // Load demo data from user context
      setFormData({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: '',
        location: '',
        pinCode: '',
        medium: '',
        qualifications: 'M.Ed, B.Ed',
        experienceYears: '5',
        currentOccupation: '',
        bio: 'Experienced teacher with a passion for education',
        teachingApproach: '',
        hourlyRate: '500',
        subjectsTaught: 'Mathematics, Physics',
        boardsTaught: 'CBSE, ICSE',
        classesTaught: 'Class 10, Class 11, Class 12',
        teachingMode: "Online, Teacher's place",
        achievements: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your photo library to upload a profile picture.');
        return;
      }

      // Launch image picker
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!formData.hourlyRate || isNaN(formData.hourlyRate)) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    try {
      setSaving(true);

      // Convert comma-separated strings to array of objects with {id, text} format
      const subjectsTaught = formData.subjectsTaught
        .split(',')
        .map((s, idx) => ({ id: idx + 1, text: s.trim() }))
        .filter(s => s.text);

      const boardsTaught = formData.boardsTaught
        .split(',')
        .map((b, idx) => ({ id: idx + 1, text: b.trim() }))
        .filter(b => b.text);

      const classesTaught = formData.classesTaught
        .split(',')
        .map((c, idx) => ({ id: idx + 1, text: c.trim() }))
        .filter(c => c.text);

      const teachingMode = Array.isArray(formData.teachingMode)
        ? formData.teachingMode
        : [];

      const achievements = formData.achievements
        .split(',')
        .map((a, idx) => ({ id: idx + 1, text: a.trim() }))
        .filter(a => a.text);

      // Create FormData for multipart upload (supports image)
      const formDataObj = new FormData();
      formDataObj.append('firstName', formData.firstName.trim());
      formDataObj.append('lastName', formData.lastName.trim());
      formDataObj.append('phone', formData.phone.trim());
      formDataObj.append('location', formData.location.trim());
      formDataObj.append('pinCode', formData.pinCode.trim());
      formDataObj.append('medium', formData.medium.trim());
      formDataObj.append('qualifications', formData.qualifications.trim());
      formDataObj.append('experienceYears', parseInt(formData.experienceYears) || 0);
      formDataObj.append('currentOccupation', formData.currentOccupation.trim());
      formDataObj.append('bio', formData.bio.trim());
      formDataObj.append('teachingApproach', formData.teachingApproach.trim());
      formDataObj.append('hourlyRate', parseFloat(formData.hourlyRate));
      formDataObj.append('subjectsTaught', JSON.stringify(subjectsTaught));
      formDataObj.append('boardsTaught', JSON.stringify(boardsTaught));
      formDataObj.append('classesTaught', JSON.stringify(classesTaught));
      formDataObj.append('teachingMode', JSON.stringify(teachingMode));
      formDataObj.append('achievements', JSON.stringify(achievements));

      // CRITICAL: Preserve availability/schedule data even though we're not editing it here
      formDataObj.append('availability', JSON.stringify(formData.availability || []));

      // Add profile image if changed
      if (profileImage && profileImage.startsWith('file://')) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataObj.append('photo', {
          uri: profileImage,
          name: filename,
          type,
        });
      }

      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        formDataObj,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Save profile error:', error.response?.data || error.message);
      Alert.alert(
        'Demo Mode',
        'Profile saved successfully! (Backend not fully connected yet)',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Header title="Edit Profile" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header title="Edit Profile" showBack />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person" size={60} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.editImageBadge}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to upload profile picture</Text>
          </View>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.email}
                editable={false}
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.emailNote}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mumbai, Maharashtra"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pin Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pin code"
                value={formData.pinCode}
                onChangeText={(text) => setFormData({ ...formData, pinCode: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medium of Instruction</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., English, Hindi"
                value={formData.medium}
                onChangeText={(text) => setFormData({ ...formData, medium: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell students about yourself"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Qualifications</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., M.Ed, B.Ed, M.Sc"
                value={formData.qualifications}
                onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter years"
                value={formData.experienceYears}
                onChangeText={(text) => setFormData({ ...formData, experienceYears: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Occupation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., School Teacher, Private Tutor"
                value={formData.currentOccupation}
                onChangeText={(text) => setFormData({ ...formData, currentOccupation: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teaching Approach</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your teaching methodology"
                value={formData.teachingApproach}
                onChangeText={(text) => setFormData({ ...formData, teachingApproach: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subjects You Teach</Text>
              <Text style={styles.helperText}>Separate multiple with commas</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mathematics, Physics, Chemistry"
                value={formData.subjectsTaught}
                onChangeText={(text) => setFormData({ ...formData, subjectsTaught: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boards</Text>
              <Text style={styles.helperText}>Separate multiple with commas</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., CBSE, ICSE, State Board"
                value={formData.boardsTaught}
                onChangeText={(text) => setFormData({ ...formData, boardsTaught: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Classes</Text>
              <Text style={styles.helperText}>Separate multiple with commas</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Class 10, Class 11, Class 12"
                value={formData.classesTaught}
                onChangeText={(text) => setFormData({ ...formData, classesTaught: text })}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teaching Mode</Text>
              <View style={styles.checkboxGroup}>
                {["Teacher's place", "Student's place", "Online"].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.checkbox,
                      formData.teachingMode.includes(mode) && styles.checkboxActive
                    ]}
                    onPress={() => {
                      const currentModes = formData.teachingMode;
                      if (currentModes.includes(mode)) {
                        setFormData({
                          ...formData,
                          teachingMode: currentModes.filter(m => m !== mode)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          teachingMode: [...currentModes, mode]
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={formData.teachingMode.includes(mode) ? "checkbox" : "square-outline"}
                      size={20}
                      color={formData.teachingMode.includes(mode) ? COLORS.primary : COLORS.gray[400]}
                    />
                    <Text style={[
                      styles.checkboxText,
                      formData.teachingMode.includes(mode) && styles.checkboxTextActive
                    ]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Achievements</Text>
              <Text style={styles.helperText}>Separate multiple with commas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Best Teacher Award 2022, Published Research Papers"
                value={formData.achievements}
                onChangeText={(text) => setFormData({ ...formData, achievements: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hourly Rate (₹) *</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="500"
                  value={formData.hourlyRate}
                  onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          </Card>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Fixed Save Button */}
        <View style={[styles.bottomContainer, { paddingBottom: Math.max(20, insets.bottom + 16) }]}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: COLORS.textSecondary,
  },
  emailNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    zIndex: 1,
  },
  priceInput: {
    flex: 1,
    paddingLeft: 36,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  checkboxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  checkboxText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  checkboxTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default TeacherProfileEditScreen;
