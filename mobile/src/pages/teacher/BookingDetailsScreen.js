import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';
import axios from 'axios';
import API_CONFIG from '../../config/api';

const BookingDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { booking, onRefresh } = route.params; // Add onRefresh callback

    const [loading, setLoading] = useState(false);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '#F59E0B';
            case 'confirmed': return '#10B981';
            case 'completed': return '#3B82F6';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    // Handle Accept
    const handleAccept = async () => {
        try {
            setLoading(true);
            await axios.patch(
                `${API_CONFIG.BASE_URL}/api/bookings/${booking._id || booking.id}/status`,
                { status: 'confirmed' },
                { withCredentials: true }
            );
            Alert.alert('Success', 'Booking accepted successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (onRefresh) onRefresh(); // Refresh parent list
                        navigation.goBack();
                    }
                }
            ]);
        } catch (error) {
            console.error('Error accepting booking:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to accept booking');
        } finally {
            setLoading(false);
        }
    };

    // Handle Reject
    const handleReject = async () => {
        Alert.alert(
            'Reject Booking',
            'Are you sure you want to reject this booking?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await axios.patch(
                                `${API_CONFIG.BASE_URL}/api/bookings/${booking._id || booking.id}/status`,
                                { status: 'cancelled', cancelReason: 'Rejected by teacher' },
                                { withCredentials: true }
                            );
                            Alert.alert('Success', 'Booking rejected', [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        if (onRefresh) onRefresh(); // Refresh parent list
                                        navigation.goBack();
                                    }
                                }
                            ]);
                        } catch (error) {
                            console.error('Error rejecting booking:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to reject booking');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Handle Mark Complete
    const handleMarkComplete = async () => {
        Alert.alert(
            'Mark as Complete',
            'Mark this booking as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await axios.patch(
                                `${API_CONFIG.BASE_URL}/api/bookings/${booking._id || booking.id}/status`,
                                { status: 'completed' },
                                { withCredentials: true }
                            );
                            Alert.alert('Success', 'Booking marked as completed', [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        if (onRefresh) onRefresh(); // Refresh parent list
                                        navigation.goBack();
                                    }
                                }
                            ]);
                        } catch (error) {
                            console.error('Error completing booking:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to complete booking');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const bookingId = booking._id || booking.id;
    const status = booking.status?.toLowerCase() || 'pending';
    const statusColor = getStatusColor(status);

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Header title="Booking Details" showBack />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Student Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Student Information</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.studentInfoRow}>
                            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.studentName}>{booking.student?.name || 'N/A'}</Text>
                        </View>
                        <View style={styles.studentInfoRow}>
                            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.studentEmail}>{booking.student?.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.studentInfoRow}>
                            <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.studentPhone}>{booking.student?.phone || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Session Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="book" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Session Details</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <InfoRow icon="book-outline" label="Subject" value={booking.subject || 'N/A'} />
                        <InfoRow icon="calendar-outline" label="Date" value={formatDate(booking.date)} />
                        <InfoRow icon="time-outline" label="Time" value={booking.time || 'N/A'} />
                        <InfoRow icon="hourglass-outline" label="Duration" value={`${booking.duration || 0} hour${booking.duration > 1 ? 's' : ''}`} />
                        <InfoRow icon="cash-outline" label="Amount" value={`₹${booking.amount || 0}`} isPrimary />
                        {booking.createdAt && (
                            <InfoRow icon="calendar-outline" label="Booked On" value={formatDate(booking.createdAt)} />
                        )}
                    </View>
                </View>

                {/* Notes */}
                {booking.notes && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Notes</Text>
                        </View>
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText}>{booking.notes}</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            {status !== 'completed' && status !== 'cancelled' && (
                <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    {status === 'pending' && (
                        <View style={styles.buttonRow}>
                            <View style={styles.buttonRowItem}>
                                <TouchableOpacity
                                    style={[styles.button, styles.rejectButton]}
                                    onPress={handleReject}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="close-circle" size={20} color="#FFF" />
                                            <Text style={styles.buttonText}>Reject</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <View style={styles.buttonRowItem}>
                                <TouchableOpacity
                                    style={[styles.button, styles.acceptButton]}
                                    onPress={handleAccept}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                            <Text style={styles.buttonText}>Accept</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {status === 'confirmed' && (
                        <TouchableOpacity
                            style={[styles.button, styles.completeButton]}
                            onPress={handleMarkComplete}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                                    <Text style={styles.buttonText}>Mark as Complete</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

// Info Row Component
const InfoRow = ({ icon, label, value, isPrimary }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLabel}>
            <Ionicons name={icon} size={16} color={COLORS.textSecondary} style={styles.infoIcon} />
            <Text style={styles.labelText}>{label}</Text>
        </View>
        <Text style={[styles.valueText, isPrimary && styles.primaryValue]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    sectionContent: {
        gap: 12,
    },
    // Student Info Styles
    studentInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#4B5563',
        flex: 1,
    },
    studentEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    studentPhone: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    infoIcon: {
        width: 20,
    },
    labelText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    valueText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    primaryValue: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    notesContainer: {
        backgroundColor: COLORS.gray[50],
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    notesText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    actionContainer: {
        padding: 16,
        // paddingBottom set dynamically with safe area insets
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[100],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonRowItem: {
        flex: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    completeButton: {
        backgroundColor: '#3B82F6',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookingDetailsScreen;
