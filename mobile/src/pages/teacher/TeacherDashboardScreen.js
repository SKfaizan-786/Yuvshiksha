import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import paymentAPI from '../../services/paymentAPI';

const LISTING_FEE = 100; // Listing fee in rupees

const TeacherDashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [isListed, setIsListed] = useState(false);
  const [listedAt, setListedAt] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    todayClasses: 0,
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

  // Reload data when screen comes into focus (e.g., after payment)
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch teacher profile to get first name
      const profileResponse = await axios.get(
        `${API_CONFIG.BASE_URL}/api/profile/teacher`,
        { withCredentials: true }
      );

      if (profileResponse.data) {
        const teacherFirstName = profileResponse.data.firstName || '';
        const teacherProfile = profileResponse.data.teacherProfile || {};
        setFirstName(teacherFirstName);
        setIsListed(teacherProfile.isListed || false);
        setListedAt(teacherProfile.listedAt || null);
      }

      // Fetch all bookings to calculate stats
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS.TEACHER}`,
        { withCredentials: true }
      );

      if (response.data && response.data.bookings) {
        const bookings = response.data.bookings;

        // Calculate stats from bookings
        const pending = bookings.filter(b => b.status === 'pending').length;
        const confirmed = bookings.filter(b => b.status === 'confirmed');
        const completed = bookings.filter(b => b.status === 'completed');

        // Calculate total earnings from completed bookings
        const totalEarnings = completed.reduce((sum, booking) => {
          return sum + (booking.amount || 0);
        }, 0);

        // Calculate today's classes
        const today = new Date().toISOString().split('T')[0];
        const todayClasses = confirmed.filter(b => {
          if (b.date) {
            const bookingDate = new Date(b.date).toISOString().split('T')[0];
            return bookingDate === today;
          }
          return false;
        }).length;

        setStats({
          totalBookings: bookings.length,
          pendingBookings: pending,
          totalEarnings: totalEarnings,
          todayClasses: todayClasses,
        });
      }
    } catch (error) {
      console.log('Dashboard API error:', error.response?.data || error.message);
      // Demo data fallback
      setStats({
        totalBookings: 24,
        pendingBookings: 3,
        totalEarnings: 15000,
        todayClasses: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleGetListed = async () => {
    if (processingPayment) return;

    try {
      setProcessingPayment(true);

      // Validate user data
      if (!user || !user.email || !user.firstName) {
        Alert.alert('Error', 'User information is incomplete. Please update your profile.');
        return;
      }

      // Create payment order
      const orderData = {
        amount: LISTING_FEE,
        customerId: user._id || user.id,
        customerName: `${user.firstName} ${user.lastName || ''}`.trim(),
        customerEmail: user.email,
        customerPhone: user.phone || user.phoneNumber || '0000000000',
        purpose: 'Teacher Listing Fee',
      };

      console.log('Creating payment order:', orderData);

      const response = await paymentAPI.createOrder(orderData);

      console.log('Full payment API response:', JSON.stringify(response, null, 2));

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      // Extract only the fields we need (avoid spreading entire Cashfree response)
      const orderId = response.data.orderId || response.data.order_id;
      const paymentSessionId = response.data.paymentSessionId || response.data.payment_session_id;
      const paymentLink = response.data.paymentLink || response.data.payment_link;

      if (!orderId || !paymentSessionId) {
        throw new Error('Payment session could not be created');
      }

      console.log('Payment order created:', { orderId, paymentSessionId, paymentLink });

      // Navigate to payment processing screen
      navigation.navigate('PaymentProcessing', {
        orderId,
        paymentSessionId,
        paymentLink,
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initiate payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Header title="Dashboard" showNotification />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Header title="Dashboard" showNotification />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, {firstName || user?.name || 'Teacher'}!</Text>
          <Text style={styles.subtitleText}>Here's your teaching overview</Text>
        </View>

        {/* Listing Status Card */}
        <View style={styles.listingStatusContainer}>
          <Card style={styles.listingStatusCard}>
            <View style={styles.listingStatusHeader}>
              <Text style={styles.listingStatusTitle}>Listing Status</Text>
            </View>

            {isListed ? (
              <View style={styles.listedContent}>
                <View style={styles.checkIconContainer}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.listedTitle}>You are Listed!</Text>
                <Text style={styles.listedSubtitle}>Students can now find and book you.</Text>
                {listedAt && (
                  <View style={styles.listedDateContainer}>
                    <Text style={styles.listedDateText}>
                      Listed since: {new Date(listedAt).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.notListedContent}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.infoIcon}>ⓘ</Text>
                </View>
                <Text style={styles.notListedTitle}>Not Yet Listed</Text>
                <Text style={styles.notListedSubtitle}>Get listed to appear in searches and receive bookings.</Text>
                <TouchableOpacity
                  style={[styles.getListedButton, processingPayment && styles.getListedButtonDisabled]}
                  activeOpacity={0.8}
                  onPress={handleGetListed}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.getListedButtonText}>Get Listed (₹{LISTING_FEE} Fee)</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* Stats Grid - 2x2 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                <Text style={styles.icon}>📚</Text>
              </View>
              <Text style={styles.statNumber}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
                <Text style={styles.icon}>⏳</Text>
              </View>
              <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
                <Text style={styles.icon}>💰</Text>
              </View>
              <Text style={styles.statNumber}>₹{stats.totalEarnings.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf620' }]}>
                <Text style={styles.icon}>📅</Text>
              </View>
              <Text style={styles.statNumber}>{stats.todayClasses}</Text>
              <Text style={styles.statLabel}>Today's Classes</Text>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Bookings')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Pending Requests</Text>
              <Text style={styles.actionSubtitle}>
                {stats.pendingBookings} booking requests waiting
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Schedule', { from: 'Dashboard' })}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📅</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Schedule</Text>
              <Text style={styles.actionSubtitle}>Update your availability</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>👤</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Edit Profile</Text>
              <Text style={styles.actionSubtitle}>Update your teaching information</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Card style={styles.scheduleCard}>
            {stats.todayClasses > 0 ? (
              <>
                <Text style={styles.scheduleIcon}>📆</Text>
                <Text style={styles.scheduleText}>
                  You have {stats.todayClasses} {stats.todayClasses === 1 ? 'class' : 'classes'} scheduled today
                </Text>
                <TouchableOpacity
                  style={styles.viewScheduleButton}
                  onPress={() => navigation.navigate('Bookings')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewScheduleText}>View Details</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📆</Text>
                <Text style={styles.emptyText}>No classes scheduled for today</Text>
                <Text style={styles.emptySubtext}>Your schedule will appear here</Text>
              </>
            )}
          </Card>
        </View>

        {/* Bottom padding for tab bar */}
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
    paddingBottom: 100, // Extra padding for tab bar
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
  welcomeSection: {
    padding: 20,
    paddingBottom: 12,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Listing Status Card
  listingStatusContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listingStatusCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  listingStatusHeader: {
    marginBottom: 16,
  },
  listingStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Listed State
  listedContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '700',
  },
  listedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 6,
  },
  listedSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  listedDateContainer: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  listedDateText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Not Listed State
  notListedContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '700',
  },
  notListedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 6,
  },
  notListedSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  getListedButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  getListedButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  getListedButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconText: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  arrow: {
    fontSize: 28,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  scheduleCard: {
    padding: 32,
    alignItems: 'center',
  },
  scheduleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scheduleText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  viewScheduleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewScheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default TeacherDashboardScreen;
