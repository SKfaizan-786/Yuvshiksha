import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import COLORS from '../../constants/colors';
import bookingAPI from '../../services/bookingAPI';
import teacherAPI from '../../services/teacherAPI';
import profileAPI from '../../services/profileAPI';
import apiClient from '../../services/api';
import API_CONFIG from '../../config/api';

/**
 * Student Dashboard Screen
 * Main dashboard for students with real data
 */
const StudentDashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    completedSessions: 0,
    favoriteTeachers: 0,
    totalSpent: 0,
  });

  // Safeguard: Redirect to profile setup if not complete
  useEffect(() => {
    if (user && !user.profileComplete) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSetup' }],
      });
    }
  }, [user, navigation]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadBookings(),
        loadTeachers(),
        loadFavorites(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await bookingAPI.getStudentBookings();

      if (response.success && response.data) {
        // Handle both response formats: {bookings: []} or direct array
        const bookingsData = response.data.bookings || (Array.isArray(response.data) ? response.data : []);
        setBookings(bookingsData);

        // Calculate stats locally
        const now = new Date();

        const upcoming = bookingsData.filter(
          (b) => {
            const status = (b.status || '').toLowerCase();
            return new Date(b.date) >= now && status !== 'cancelled' && status !== 'completed';
          }
        ).length;

        const completed = bookingsData.filter(
          (b) => (b.status || '').toLowerCase() === 'completed'
        ).length;

        const totalSpent = bookingsData
          .filter((b) => (b.status || '').toLowerCase() === 'completed')
          .reduce((sum, b) => {
            // Check both 'amount' and 'totalAmount' field names
            const amt = b.amount || b.totalAmount || 0;
            const finalAmount = typeof amt === 'object' && amt !== null
              ? (amt.amount || amt.value || 0)
              : amt;
            return sum + Number(finalAmount);
          }, 0);

        setStats((prev) => ({
          ...prev,
          upcomingSessions: upcoming,
          completedSessions: completed,
          totalSpent,
        }));
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await teacherAPI.getTeachersList();

      if (response.success && response.data) {
        const teachersData = Array.isArray(response.data) ? response.data : [];
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      // Fetch favorites from the dedicated endpoint like the website does
      const response = await profileAPI.getFavorites();

      if (response.success && response.data) {
        // Handle response format: { favourites: [] } or { data: { favourites: [] } }
        const favData = response.data.favourites || response.data || [];
        const favArray = Array.isArray(favData) ? favData : [];
        setFavorites(favArray);
        setStats((prev) => ({
          ...prev,
          favoriteTeachers: favArray.length,
        }));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings
      .filter((b) => {
        const status = (b.status || '').toLowerCase();
        return new Date(b.date) >= now && status !== 'cancelled' && status !== 'completed';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  const getRecommendedTeachers = () => {
    // Get random 3 teachers
    const shuffled = [...teachers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const getFavoriteTeachers = () => {
    if (!Array.isArray(favorites)) return [];
    return teachers
      .filter((teacher) => favorites.includes(teacher._id))
      .slice(0, 3);
  };

  const toggleFavorite = async (teacherId) => {
    try {
      const isFav = favorites.some((fav) => fav === teacherId);
      if (isFav) {
        await profileAPI.removeFavorite(teacherId);
        setFavorites(favorites.filter((fav) => fav !== teacherId));
        setStats((prev) => ({ ...prev, favoriteTeachers: prev.favoriteTeachers - 1 }));
      } else {
        await profileAPI.addFavorite(teacherId);
        setFavorites([...favorites, teacherId]);
        setStats((prev) => ({ ...prev, favoriteTeachers: prev.favoriteTeachers + 1 }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const isFavorite = (teacherId) => {
    if (!Array.isArray(favorites)) return false;
    return favorites.some((fav) => fav === teacherId);
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  const upcomingBookings = getUpcomingBookings();
  const recommendedTeachers = getRecommendedTeachers();
  const favoriteTeachers = getFavoriteTeachers();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Dashboard" showNotification />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            Let's continue your learning journey
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={stats.completedSessions}
            color={COLORS.success}
          />
          <StatCard
            icon="heart-outline"
            label="Favorites"
            value={stats.favoriteTeachers}
            color={COLORS.error}
          />
          <StatCard
            icon="cash-outline"
            label="Spent"
            value={`₹${stats.totalSpent}`}
            color={COLORS.warning}
            valueStyle={{ fontSize: 16 }}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <ActionCard
              icon="search"
              label="Find Teachers"
              color={COLORS.primary}
              onPress={() => navigation.navigate('Teachers')}
            />
            <ActionCard
              icon="calendar"
              label="My Sessions"
              color={COLORS.secondary}
              onPress={() => navigation.navigate('MySessions')}
            />
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          </View>

          {upcomingBookings.length === 0 ? (
            <Card>
              <View style={styles.emptyCard}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={COLORS.gray[300]}
                />
                <Text style={styles.emptyText}>No upcoming sessions</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('Teachers')}
                >
                  <Text style={styles.emptyButtonText}>Find a Teacher</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} teachers={teachers} />
            ))
          )}
        </View>

        {/* Recommended Teachers */}
        {recommendedTeachers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Teachers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Teachers')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recommendedTeachers.map((teacher) => (
              <TeacherCard
                key={teacher._id}
                teacher={teacher}
                isFavorite={isFavorite(teacher._id)}
                onToggleFavorite={() => toggleFavorite(teacher._id)}
                onBookSession={() =>
                  navigation.navigate('BookClass', { teacherId: teacher._id })
                }
              />
            ))}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ icon, label, value, color, valueStyle }) => {
  // Ensure value is a string or number, not an object
  const displayValue = typeof value === 'object' ? '0' : String(value);

  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, valueStyle]}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
};

/**
 * Action Card Component
 */
const ActionCard = ({ icon, label, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionCard}>
    <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

/**
 * Booking Card Component
 */
const BookingCard = ({ booking, teachers = [] }) => {
  const date = new Date(booking.date);

  // Improved teacher resolution with multiple fallback strategies
  let teacher = null;
  let teacherId = null;
  let teacherName = 'Teacher';

  // Strategy 1: Check if booking.teacher is an object with name (backend format)
  if (booking.teacher && typeof booking.teacher === 'object') {
    if (booking.teacher.name) {
      // Backend format: teacher.name
      teacherName = booking.teacher.name;
      teacher = booking.teacher;
    } else if (booking.teacher.firstName) {
      // Alternative format: teacher.firstName + teacher.lastName
      teacherName = `${booking.teacher.firstName} ${booking.teacher.lastName || ''}`.trim();
      teacher = booking.teacher;
    }
  }

  // Strategy 2: If teacher name not found, try to extract ID and look up
  if (teacherName === 'Teacher') {
    // Try to get the ID from different possible locations
    if (typeof booking.teacher === 'string') {
      teacherId = booking.teacher;
    } else if (booking.teacher && (booking.teacher._id || booking.teacher.id)) {
      teacherId = booking.teacher._id || booking.teacher.id;
    } else if (booking.teacherId) {
      teacherId = typeof booking.teacherId === 'string' ? booking.teacherId : booking.teacherId._id;
    }

    // Strategy 3: Look up teacher from the teachers list
    if (teacherId && teachers.length > 0) {
      const foundTeacher = teachers.find(t => t._id === teacherId);
      if (foundTeacher) {
        teacherName = `${foundTeacher.firstName} ${foundTeacher.lastName || ''}`.trim();
        teacher = foundTeacher;
      }
    }
  }

  const statusColors = {
    pending: COLORS.warning,
    confirmed: COLORS.success,
    completed: COLORS.gray[500],
    cancelled: COLORS.error,
  };

  // Calculate duration based on number of slots (each slot = 1 hour)
  const duration = booking.timeSlots?.length || booking.slots?.length || booking.duration || 1;
  const durationText = duration === 1 ? '1h' : `${duration}h`;

  // Get first time slot and extract just the start time
  const getTimeSlot = () => {
    let rawTime = 'Time Slot';
    if (booking.time) rawTime = booking.time;
    else if (booking.timeSlots && booking.timeSlots.length > 0) {
      rawTime = typeof booking.timeSlots[0] === 'object'
        ? (booking.timeSlots[0].time || booking.timeSlots[0].text || 'Time Slot')
        : booking.timeSlots[0];
    }
    else if (booking.slots && booking.slots.length > 0) {
      rawTime = typeof booking.slots[0] === 'object'
        ? (booking.slots[0].time || booking.slots[0].text || 'Time Slot')
        : booking.slots[0];
    }

    // If it's a range like "18:00 - 19:00", take the first part
    if (typeof rawTime === 'string' && rawTime.includes('-')) {
      return rawTime.split('-')[0].trim();
    }
    return rawTime;
  };

  const startTime = getTimeSlot();

  return (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTeacher}>
            {typeof teacherName === 'object' ? 'Teacher' : teacherName}
          </Text>
          <Text style={styles.bookingSubject}>
            {typeof booking.subject === 'object' ? (booking.subject.name || 'Subject') : booking.subject}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (statusColors[booking.status] || COLORS.gray[500]) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: statusColors[booking.status] || COLORS.gray[500] },
            ]}
          >
            {typeof booking.status === 'object' ? (booking.status.label || 'Unknown') : booking.status}
          </Text>
        </View>
      </View>
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetail}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.bookingDetailText}>
            {date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        {(booking.time || (booking.timeSlots && booking.timeSlots.length > 0) || (booking.slots && booking.slots.length > 0)) && (
          <View style={styles.bookingDetail}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.bookingDetailText}>
              {startTime} <Text style={styles.durationText}>({durationText})</Text>
            </Text>
          </View>
        )}
        {(booking.amount != null || booking.totalAmount != null) && (
          <View style={styles.bookingDetail}>
            <Ionicons name="cash-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.bookingDetailText}>
              ₹{(() => {
                const amt = booking.amount || booking.totalAmount || 0;
                return typeof amt === 'object' && amt !== null
                  ? (amt.amount || amt.value || '0')
                  : (amt || '0');
              })()}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

/**
 * Teacher Card Component
 */
const TeacherCard = ({
  teacher,
  isFavorite,
  onToggleFavorite,
  onBookSession,
}) => {
  const profile = teacher.teacherProfile || {};
  const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();

  // Safe extraction for experience - check multiple field names
  const experience = typeof profile.experience === 'object' && profile.experience !== null
    ? (profile.experience.years || profile.experience.value || 0)
    : (profile.experience || profile.experienceYears || profile.yearsOfExperience || 0);

  // Safe extraction for hourlyRate - check multiple field names
  const hourlyRate = typeof profile.hourlyRate === 'object' && profile.hourlyRate !== null
    ? (profile.hourlyRate.amount || profile.hourlyRate.value || 0)
    : (profile.hourlyRate || profile.rate || profile.pricePerHour || profile.price || 0);

  // Get profile photo URL with multiple fallbacks
  const photoUrl = profile.photoUrl || teacher.avatar || profile.photo || teacher.photoUrl;

  return (
    <Card style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.teacherAvatar}
          />
        ) : (
          <View style={styles.teacherAvatarPlaceholder}>
            <Text style={styles.teacherAvatarText}>
              {fullName.charAt(0)?.toUpperCase() || 'T'}
            </Text>
          </View>
        )}
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{fullName || 'Teacher'}</Text>
          {experience > 0 && (
            <Text style={styles.teacherExperience}>
              {experience} years exp.
            </Text>
          )}
          {hourlyRate > 0 && (
            <View style={styles.teacherRate}>
              <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
              <Text style={styles.rateText}>₹{hourlyRate}/hr</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onToggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? COLORS.error : COLORS.gray[400]}
          />
        </TouchableOpacity>
      </View>

      {profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 && (
        <View style={styles.subjectsRow}>
          {profile.subjects.slice(0, 3).map((subject, index) => {
            // Handle if subject is an object
            const subjectName = typeof subject === 'object'
              ? (subject.name || subject.text || subject.label || 'Subject')
              : subject;
            return (
              <View key={index} style={styles.subjectBadge}>
                <Text style={styles.subjectText}>{subjectName}</Text>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.bookButton} onPress={onBookSession}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
        <Text style={styles.bookButtonText}>Book Session</Text>
      </TouchableOpacity>
    </Card>
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
  welcomeSection: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTeacher: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bookingSubject: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  durationText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  teacherCard: {
    marginBottom: 12,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray[200],
  },
  teacherAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  teacherExperience: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  teacherRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudentDashboardScreen;
