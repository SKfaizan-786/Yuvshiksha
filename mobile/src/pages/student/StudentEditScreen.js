import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import profileAPI from '../../services/profileAPI';

const StudentEditScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { updateUser, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        pinCode: '',
        grade: '',
        school: '',
        medium: '',
        bio: '',
        interests: '',
        learningGoals: '',
        mode: [],
        photoUrl: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
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
                    school: student.school || '',
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
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant access to your photo library.');
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
            Alert.alert('Error', 'Failed to pick image.');
        }
    };

    // Helper inputs for tags
    const [subjectInput, setSubjectInput] = useState('');
    const [goalInput, setGoalInput] = useState('');

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

    const handleSave = async () => {
        // Basic Validation
        if (!formData.firstName.trim() || !formData.phone.trim()) {
            Alert.alert('Required', 'First Name and Phone Number are required.');
            return;
        }

        try {
            setSaving(true);

            const formDataToSend = new FormData();

            // Append Image if changed
            if (profileImage && profileImage.startsWith('file://')) {
                const uriParts = profileImage.split('.');
                const fileType = uriParts[uriParts.length - 1];
                formDataToSend.append('photo', {
                    uri: profileImage,
                    name: `profile-${Date.now()}.${fileType}`,
                    type: `image/${fileType}`,
                });
            } else if (profileImage) {
                formDataToSend.append('photoUrl', profileImage);
            }

            // Arrays
            const subjectsArray = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(i => i) : [];
            const learningGoalsArray = formData.learningGoals ? formData.learningGoals.split(',').map(i => i.trim()).filter(i => i) : [];

            // Append Fields
            formDataToSend.append('firstName', formData.firstName);
            formDataToSend.append('lastName', formData.lastName);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('pinCode', formData.pinCode);
            formDataToSend.append('grade', formData.grade);
            formDataToSend.append('school', formData.school);
            formDataToSend.append('medium', formData.medium);
            formDataToSend.append('bio', formData.bio);

            // Arrays as JSON strings
            formDataToSend.append('subjects', JSON.stringify(subjectsArray));
            formDataToSend.append('learningGoals', JSON.stringify(learningGoalsArray));
            formDataToSend.append('mode', JSON.stringify(formData.mode));

            const response = await profileAPI.studentSetup(formDataToSend);

            if (response.success) {
                await updateUser({ profileComplete: true });
                Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Header title="Edit Profile" showBack />
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Header title="Edit Profile" showBack />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Profile Image Section */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity onPress={pickImage} style={styles.imageContainer} activeOpacity={0.7}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={styles.avatarText}>{formData.firstName?.[0]?.toUpperCase() || 'S'}</Text>
                                </View>
                            )}
                            <View style={styles.editImageBadge}>
                                <Ionicons name="camera" size={18} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.imageHint}>Tap to upload profile picture</Text>
                    </View>

                    {/* Personal Information */}
                    <Card style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                placeholder="John"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                placeholder="Doe"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={formData.email}
                                editable={false}
                            />
                            <Text style={styles.emailNote}>Email cannot be changed</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="+91..."
                                placeholderTextColor={COLORS.gray[400]}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location}
                                onChangeText={(text) => setFormData({ ...formData, location: text })}
                                placeholder="City, State"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Pin Code</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.pinCode}
                                onChangeText={(text) => setFormData({ ...formData, pinCode: text })}
                                placeholder="Zip Code"
                                placeholderTextColor={COLORS.gray[400]}
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={COLORS.gray[400]}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </Card>

                    {/* Academic Information */}
                    <Card style={styles.section}>
                        <Text style={styles.sectionTitle}>Academic Information</Text>

                        {/* 1. Grade / Class */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Grade / Class</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.grade}
                                onChangeText={(text) => setFormData({ ...formData, grade: text })}
                                placeholder="e.g., Class 10"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>


                        {/* 2. Subjects of Interest (Interactive Tags) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Subjects of Interest</Text>
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
                                        <Text style={styles.tagText}>{tag}</Text>
                                        <TouchableOpacity onPress={() => removeTag('interests', tag)}>
                                            <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* 3. Preferred Learning Mode */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Preferred Learning Mode</Text>
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

                        {/* 4. Medium of Instruction */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Medium of Instruction</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.medium}
                                onChangeText={(text) => setFormData({ ...formData, medium: text })}
                                placeholder="English / Hindi"
                                placeholderTextColor={COLORS.gray[400]}
                            />
                        </View>

                        {/* 5. Learning Goals (Interactive Tags) */}
                        <View style={styles.inputGroup}>
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
                                        <Text style={styles.tagText}>{tag}</Text>
                                        <TouchableOpacity onPress={() => removeTag('learningGoals', tag)}>
                                            <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </Card>

                    <View style={{ height: 100 }} />
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
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },

    keyboardView: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    section: { padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    helperText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, fontStyle: 'italic' },
    input: {
        backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary,
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
    textArea: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },

    checkboxGroup: { gap: 12 },
    checkbox: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    checkboxActive: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
    checkboxText: { fontSize: 15, color: COLORS.textPrimary },
    checkboxTextActive: { color: COLORS.primary, fontWeight: '600' },

    imageSection: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
    imageContainer: { position: 'relative', marginBottom: 12 },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.primary },
    imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
    avatarText: { fontSize: 40, color: COLORS.textSecondary, fontWeight: 'bold' },
    editImageBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    imageHint: { fontSize: 13, color: COLORS.textSecondary },

    tagInputContainer: { flexDirection: 'row', gap: 12 },
    tagInput: { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.textPrimary },
    addButton: { backgroundColor: COLORS.primary, width: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 24, gap: 8, borderWidth: 1, borderColor: '#E0E7FF', maxWidth: '100%' },
    tagText: { color: COLORS.primary, fontWeight: '600', fontSize: 13, flexShrink: 1 },

    bottomContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.white,
        borderTopWidth: 1, borderTopColor: COLORS.gray[100], shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10
    },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, gap: 8 },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default StudentEditScreen;
