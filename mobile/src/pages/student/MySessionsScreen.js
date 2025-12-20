import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';
import bookingAPI from '../../services/bookingAPI';

const MySessionsScreen = () => {
    const [activeTab, setActiveTab] = useState('all'); // all, completed, pending, cancelled
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    // Reload data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadBookings();
        }, [])
    );

    const loadBookings = async () => {
        try {
            const response = await bookingAPI.getStudentBookings();
            if (response.success && response.data) {
                // Handle both response formats: {bookings: []} or direct array
                const bookingsData = response.data.bookings || (Array.isArray(response.data) ? response.data : []);
                setBookings(bookingsData);
                console.log('Loaded bookings:', bookingsData.length);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const getFilteredBookings = () => {
        if (activeTab === 'all') return bookings;

        const targetStatus = activeTab.toLowerCase();

        return bookings.filter(booking => {
            const status = (booking.status || '').toLowerCase();

            if (activeTab === 'completed') {
                // Handle both 'completed' and 'complete' status
                return status === 'completed' || status === 'complete';
            }

            if (activeTab === 'cancelled') {
                // Handle 'cancelled', 'rejected', 'reject'
                return status === 'cancelled' || status === 'rejected' || status === 'reject';
            }

            return status === targetStatus;
        });
    };

    const formatDate = (dateString, timeString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
            return `${day}`;
        } catch (e) {
            return dateString;
        }
    };

    const renderBookingCard = (booking) => {
        // Handle teacher data - can be object or ID string
        const teacher = booking.teacher || booking.teacherId || {};

        // Extract teacher name from various possible formats
        let teacherName = 'Teacher';
        if (typeof teacher === 'object' && teacher !== null) {
            if (teacher.firstName) {
                teacherName = `${teacher.firstName} ${teacher.lastName || ''}`.trim();
            } else if (teacher.name) {
                teacherName = teacher.name;
            }
        } else if (booking.teacherName) {
            teacherName = booking.teacherName;
        }

        const teacherAvatar = typeof teacher === 'object'
            ? (teacher.avatar || teacher.photo || teacher.photoUrl)
            : null;

        const statusColors = {
            pending: COLORS.warning,
            confirmed: COLORS.success,
            accepted: COLORS.success,
            completed: COLORS.secondary,
            complete: COLORS.secondary,
            cancelled: COLORS.error,
            rejected: COLORS.error,
            reject: COLORS.error,
        };

        const status = (booking.status || 'pending').toLowerCase();
        const statusColor = statusColors[status] || COLORS.gray[500];

        // Safe amount extraction
        const amount = typeof booking.totalAmount === 'object'
            ? (booking.totalAmount.amount || booking.totalAmount.value || 0)
            : (booking.totalAmount || booking.amount || 0);

        // Safe subject extraction
        const subject = typeof booking.subject === 'object'
            ? (booking.subject.name || booking.subject.text || 'N/A')
            : (booking.subject || 'N/A');

        return (
            <Card key={booking._id || booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.teacherInfo}>
                        {teacherAvatar ? (
                            <Image source={{ uri: teacherAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>{teacherName.charAt(0)}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.teacherName}>{teacherName}</Text>
                            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                        </View>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountText}>₹{amount}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} />
                        <Text style={styles.detailText}>
                            {formatDate(booking.date)}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
                        <Text style={styles.detailText}>
                            {booking.time || (booking.timeSlots?.[0]?.time) || 'N/A'} (1h)
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="book-outline" size={16} color={COLORS.gray[500]} />
                        <Text style={styles.detailText}>Subject: {subject}</Text>
                    </View>
                </View>
            </Card>
        );
    };

    const filteredBookings = getFilteredBookings();
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Header title="My Sessions" showNotification showBack />

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                    {['all', 'completed', 'pending', 'cancelled'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : filteredBookings.length > 0 ? (
                    filteredBookings.map(renderBookingCard)
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={COLORS.gray[300]} />
                        <Text style={styles.emptyText}>No sessions found</Text>
                    </View>
                )}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    tabsWrapper: {
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[200],
    },
    tabsContainer: {
        paddingHorizontal: 16,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.gray[100],
        marginRight: 8,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
        fontSize: 14,
    },
    activeTabText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
    teacherName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    statusText: {
        fontSize: 12,
        textTransform: 'capitalize',
        marginTop: 2,
        fontWeight: '500',
    },
    amountContainer: {
        backgroundColor: COLORS.gray[50],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    amountText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray[200],
        marginVertical: 12,
    },
    detailsContainer: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});

export default MySessionsScreen;
