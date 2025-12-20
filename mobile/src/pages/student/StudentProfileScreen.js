import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import profileAPI from '../../services/profileAPI';

const StudentProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when screen comes into focus (e.g., after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();

      if (response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.log('Profile API error:', error);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getDisplayName = () => {
    if (profileData) {
      return `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
    }
    return user?.name || 'Student';
  };

  const getDisplayEmail = () => {
    return profileData?.email || user?.email || '';
  };

  const getPhotoUrl = () => {
    return profileData?.studentProfile?.photoUrl || profileData?.avatar || user?.photoUrl || null;
  };

  const getStudentProfile = () => {
    return profileData?.studentProfile || {};
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline',
      onPress: () => navigation.navigate('StudentProfileEdit', { isEdit: true }),
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      subtitle: 'View all your bookings',
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('MySessions'),
    },
    {
      id: 'favorites',
      title: 'Favorite Teachers',
      subtitle: 'View your saved teachers',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('FavoriteTeachers'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      icon: 'settings-outline',
      onPress: () => {
        Alert.alert('Coming Soon', 'Settings feature will be available soon');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      onPress: () => {
        Alert.alert('Coming Soon', 'Help & Support feature will be available soon');
      },
    },
    {
      id: 'about',
      title: 'About Yuvsiksha',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle-outline',
      onPress: () => {
        Alert.alert('About Yuvsiksha', 'Yuvsiksha - Connect with the best teachers\n\nVersion 1.0.0');
      },
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Header title="My Profile" showNotification={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const studentProfile = getStudentProfile();
  const photoUrl = getPhotoUrl();
  const displayName = getDisplayName();

  const InfoItem = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const ArrayItem = ({ icon, label, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.detailRow}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <View style={styles.chipsContainer}>
            {items.map((item, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{typeof item === 'string' ? item : item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header title="My Profile" showNotification={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('StudentProfileEdit', { isEdit: true })}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>Student</Text>

          <View style={styles.headerContact}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.contactText}>{getDisplayEmail()}</Text>
            </View>
            {studentProfile.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.contactText}>{studentProfile.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>
        <Card style={styles.detailsCard}>
          <InfoItem icon="person-outline" label="Full Name" value={displayName} />
          <InfoItem icon="mail-outline" label="Email" value={getDisplayEmail()} />
          <InfoItem icon="call-outline" label="Phone Number" value={studentProfile.phone} />

          <InfoItem
            icon="location-outline"
            label="Location"
            value={studentProfile.location ? `${studentProfile.location}${studentProfile.pinCode ? `, ${studentProfile.pinCode}` : ''}` : null}
          />

          <InfoItem icon="information-circle-outline" label="Bio" value={studentProfile.bio} />
        </Card>

        {/* Academic Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
        </View>
        <Card style={styles.detailsCard}>
          <InfoItem icon="school-outline" label="Grade Level" value={studentProfile.grade} />
          <InfoItem icon="business-outline" label="School/Institution" value={studentProfile.school} />
          <ArrayItem icon="book-outline" label="Subjects of Interest" items={studentProfile.subjects || studentProfile.interests} />
          <ArrayItem icon="laptop-outline" label="Preferred Learning Mode" items={studentProfile.mode} />
          <InfoItem icon="language-outline" label="Medium of Instruction" value={studentProfile.medium} />
          <ArrayItem icon="flag-outline" label="Learning Goals" items={studentProfile.learningGoals} />
        </Card>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))}

        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.7}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text style={styles.logoutText}>
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Header
  profileHeader: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray[200], marginBottom: 20
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.gray[200] },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: COLORS.white },
  editAvatarButton: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white
  },
  profileName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  profileRole: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 12, backgroundColor: COLORS.primary + '10', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerContact: { alignItems: 'center', gap: 4 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 13, color: COLORS.textSecondary },

  // Sections
  sectionHeader: { paddingHorizontal: 20, marginBottom: 8, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  detailsCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.white, marginBottom: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailContent: { flex: 1, justifyContent: 'center' },
  detailLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },

  // Chips
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: COLORS.gray[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '500' },

  // Menu
  menuContainer: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, paddingVertical: 8, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray[50] },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.gray[50], justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});

export default StudentProfileScreen;






