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
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const TeacherProfileScreen = () => {
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
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        { withCredentials: true }
      );

      if (response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.log('Profile API error:', error.response?.data || error.message);
      // Use user context data as fallback
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
    return user?.name || 'Teacher';
  };

  const getDisplayEmail = () => {
    return profileData?.email || user?.email || '';
  };

  const getPhotoUrl = () => {
    return profileData?.teacherProfile?.photoUrl || profileData?.avatar || user?.photoUrl || null;
  };

  const getTeacherProfile = () => {
    return profileData?.teacherProfile || {};
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your teaching information',
      icon: 'person-outline',
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      id: 'schedule',
      title: 'Manage Availability',
      subtitle: 'Update your teaching schedule',
      icon: 'calendar-outline',
      onPress: () => navigation.navigate('Schedule', { from: 'Profile' }),
    },
    {
      id: 'earnings',
      title: 'Earnings & Payments',
      subtitle: 'View your earnings history',
      icon: 'wallet-outline',
      onPress: () => {
        Alert.alert('Coming Soon', 'Earnings feature will be available soon');
      },
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
        navigation.navigate('HelpSupport', { userRole: 'teacher' });
      },
    },
    {
      id: 'about',
      title: 'About Yuvshiksha',
      subtitle: 'Version 3.0.2',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Profile" showNotification={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const teacherProfile = getTeacherProfile();
  const photoUrl = getPhotoUrl();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Profile" showNotification={false} />

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
                  {getDisplayName().charAt(0)?.toUpperCase() || 'T'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profileEmail}>{getDisplayEmail()}</Text>

          {teacherProfile.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{teacherProfile.phone}</Text>
            </View>
          )}

          {teacherProfile.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{teacherProfile.location}</Text>
            </View>
          )}

          <View style={styles.badgeContainer}>
            {teacherProfile.isListed ? (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.badgeText}>Verified Teacher</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.teacherBadge]}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text style={[styles.badgeText, styles.teacherText]}>Teacher</Text>
              </View>
            )}
          </View>
        </View>

        {/* Professional Details */}
        {(teacherProfile.qualifications || teacherProfile.experienceYears || teacherProfile.hourlyRate || teacherProfile.medium) && (
          <Card style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Professional Details</Text>

            {teacherProfile.qualifications && (
              <View style={styles.detailRow}>
                <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Qualifications</Text>
                  <Text style={styles.detailValue}>{teacherProfile.qualifications}</Text>
                </View>
              </View>
            )}

            {teacherProfile.experienceYears !== undefined && (
              <View style={styles.detailRow}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Experience</Text>
                  <Text style={styles.detailValue}>{teacherProfile.experienceYears} years</Text>
                </View>
              </View>
            )}

            {teacherProfile.currentOccupation && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Current Occupation</Text>
                  <Text style={styles.detailValue}>{teacherProfile.currentOccupation}</Text>
                </View>
              </View>
            )}

            {teacherProfile.medium && (
              <View style={styles.detailRow}>
                <Ionicons name="language-outline" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Medium of Instruction</Text>
                  <Text style={styles.detailValue}>{teacherProfile.medium}</Text>
                </View>
              </View>
            )}

            {teacherProfile.hourlyRate && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Hourly Rate</Text>
                  <Text style={styles.detailValue}>₹{teacherProfile.hourlyRate}/hour</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Teaching Info */}
        {((teacherProfile.subjects?.length > 0 || teacherProfile.subjectsTaught?.length > 0) ||
          (teacherProfile.boards?.length > 0 || teacherProfile.boardsTaught?.length > 0) ||
          (teacherProfile.classes?.length > 0 || teacherProfile.classesTaught?.length > 0)) && (
            <Card style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Teaching Information</Text>

              {(teacherProfile.subjects?.length > 0 || teacherProfile.subjectsTaught?.length > 0) && (
                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Subjects</Text>
                  <View style={styles.chipContainer}>
                    {(teacherProfile.subjects || teacherProfile.subjectsTaught || []).map((subject, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{subject.text || subject}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(teacherProfile.boards?.length > 0 || teacherProfile.boardsTaught?.length > 0) && (
                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Boards</Text>
                  <View style={styles.chipContainer}>
                    {(teacherProfile.boards || teacherProfile.boardsTaught || []).map((board, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{board.text || board}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {(teacherProfile.classes?.length > 0 || teacherProfile.classesTaught?.length > 0) && (
                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Classes</Text>
                  <View style={styles.chipContainer}>
                    {(teacherProfile.classes || teacherProfile.classesTaught || []).map((cls, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{cls.text || cls}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {teacherProfile.teachingMode?.length > 0 && (
                <View style={styles.chipSection}>
                  <Text style={styles.chipLabel}>Teaching Mode</Text>
                  <View style={styles.chipContainer}>
                    {teacherProfile.teachingMode.map((mode, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{mode}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          )}

        {/* Bio */}
        {teacherProfile.bio && (
          <Card style={styles.detailsCard}>
            <Text style={styles.cardTitle}>About Me</Text>
            <Text style={styles.bioText}>{teacherProfile.bio}</Text>
          </Card>
        )}

        {/* Teaching Approach */}
        {teacherProfile.teachingApproach && (
          <Card style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Teaching Approach</Text>
            <Text style={styles.bioText}>{teacherProfile.teachingApproach}</Text>
          </Card>
        )}

        {/* Achievements */}
        {teacherProfile.achievements?.length > 0 && (
          <Card style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Achievements</Text>
            {teacherProfile.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Ionicons name="trophy-outline" size={18} color="#f59e0b" />
                <Text style={styles.achievementText}>{achievement.text || achievement}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
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
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>
            {logoutLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  listedBadge: {
    backgroundColor: '#6366f115',
  },
  teacherBadge: {
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  listedText: {
    color: '#6366f1',
  },
  teacherText: {
    color: '#6b7280',
  },
  detailsCard: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  chipSection: {
    marginBottom: 16,
  },
  chipLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  menuSection: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
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
  bottomPadding: {
    height: 20,
  },
});

export default TeacherProfileScreen;