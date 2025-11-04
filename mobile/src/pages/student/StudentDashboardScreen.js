import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import COLORS from '../../constants/colors';

/**
 * Student Dashboard Screen
 * Main dashboard for students
 */
const StudentDashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    upcomingClasses: [],
    recentBookings: [],
    stats: {
      totalClasses: 0,
      completedClasses: 0,
      upcomingClasses: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Fetch dashboard data from API
      // const response = await studentAPI.getDashboard();
      // setDashboardData(response.data);
      
      // Placeholder data
      setDashboardData({
        upcomingClasses: [],
        recentBookings: [],
        stats: {
          totalClasses: 0,
          completedClasses: 0,
          upcomingClasses: 0,
        },
      });
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Dashboard"
        showNotification
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            Let's continue your learning journey
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="book-outline"
            label="Total Classes"
            value={dashboardData.stats.totalClasses}
            color={COLORS.primary}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={dashboardData.stats.completedClasses}
            color={COLORS.success}
          />
          <StatCard
            icon="time-outline"
            label="Upcoming"
            value={dashboardData.stats.upcomingClasses}
            color={COLORS.warning}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <ActionCard
              icon="search"
              label="Find Teachers"
              onPress={() => navigation.navigate('Teachers')}
            />
            <ActionCard
              icon="calendar"
              label="Book a Class"
              onPress={() => navigation.navigate('BookClass')}
            />
          </View>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Classes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.upcomingClasses.length === 0 ? (
            <Card>
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.gray[300]} />
                <Text style={styles.emptyText}>No upcoming classes</Text>
                <Text style={styles.emptySubtext}>
                  Book a class to start learning!
                </Text>
              </View>
            </Card>
          ) : (
            dashboardData.upcomingClasses.map((classItem, index) => (
              <Card key={index}>
                {/* TODO: Add class details */}
                <Text>Class Item {index + 1}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card style={styles.statCard}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

const ActionCard = ({ icon, label, onPress }) => (
  <Card onPress={onPress} style={styles.actionCard}>
    <View style={styles.actionIconContainer}>
      <Ionicons name={icon} size={32} color={COLORS.primary} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
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
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 20,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight + '20',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StudentDashboardScreen;






