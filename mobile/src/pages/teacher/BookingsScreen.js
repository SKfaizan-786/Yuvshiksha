import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const BookingsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('pending'); // pending, confirmed, completed, cancelled
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  // Format date: "Mon, 1 Sept, 2025"
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-GB', options).replace(',', '');
    } catch (error) {
      return dateString;
    }
  };

  // Format duration: "2" -> "Duration: 2 hours"
  const formatDuration = (duration) => {
    if (typeof duration === 'string' && duration.includes('hour')) {
      const hours = duration.match(/[\d.]+/)?.[0];
      return `Duration: ${hours} ${hours === '1' ? 'hour' : 'hours'}`;
    }
    // If duration is just a number, add hours
    const num = parseFloat(duration);
    if (!isNaN(num)) {
      return `Duration: ${num} ${num === 1 ? 'hour' : 'hours'}`;
    }
    return `Duration: ${duration} hours`;
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS.TEACHER}?status=${activeTab}`,
        { withCredentials: true }
      );

      if (response.data) {
        setBookings(response.data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Show empty state instead of demo data
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleAccept = async (bookingId) => {
    try {
      await axios.patch(
        `${API_CONFIG.BASE_URL}/api/bookings/${bookingId}/status`,
        { status: 'confirmed' },
        { withCredentials: true }
      );
      Alert.alert('Success', 'Booking accepted successfully');
      loadBookings();
    } catch (error) {
      console.error('Error accepting booking:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept booking');
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await axios.patch(
        `${API_CONFIG.BASE_URL}/api/bookings/${bookingId}/status`,
        { status: 'cancelled', cancelReason: 'Rejected by teacher' },
        { withCredentials: true }
      );
      Alert.alert('Success', 'Booking rejected');
      loadBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject booking');
    }
  };

  const renderBookingCard = (booking) => {
    const bookingId = booking.id || booking._id; // Handle both id formats

    return (
      <Card key={bookingId} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.studentName}>{booking.student.name}</Text>
            <Text style={styles.studentEmail}>{booking.student.email}</Text>
          </View>
          <View style={[styles.statusBadge, styles[`${activeTab}Badge`]]}>
            <Text style={styles.badgeText}>₹{booking.amount}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="book-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{booking.subject}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{booking.time} ({booking.duration}h)</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => navigation.navigate('BookingDetails', { booking, onRefresh: loadBookings })}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>

          {activeTab === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(bookingId)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#FFF" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(bookingId)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Header title="Bookings" showNotification />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header title="Bookings" showNotification />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && styles.activeTab]}
          onPress={() => setActiveTab('confirmed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'confirmed' && styles.activeTabText]}>
            Confirmed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'pending' && 'New booking requests will appear here'}
              {activeTab === 'confirmed' && 'Confirmed bookings will appear here'}
              {activeTab === 'completed' && 'Completed sessions will appear here'}
              {activeTab === 'cancelled' && 'Cancelled bookings will appear here'}
            </Text>
          </View>
        ) : (
          bookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  confirmedBadge: {
    backgroundColor: '#d1fae5',
  },
  completedBadge: {
    backgroundColor: '#dbeafe',
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cancelReasonContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  cancelReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelReasonText: {
    fontSize: 13,
    color: '#7f1d1d',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  detailsButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default BookingsScreen;
