import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import COLORS from '../../constants/colors';

const AboutScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <Header title="What's New" showNotification={false} showBack={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Icon and Title */}
                <View style={styles.headerSection}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="school" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.appTitle}>Yuvshiksha</Text>
                    <Text style={styles.appSubtitle}>Connect with the best teachers</Text>

                    {/* Version Badge */}
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>Version 3.0.2</Text>
                    </View>
                </View>

                {/* What's New Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="sparkles" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>What's New in v3.0.2</Text>
                    </View>

                    <View style={styles.featuresList}>
                        <FeatureItem
                            icon="briefcase-outline"
                            title="Professional Booking Management"
                            description="Enhanced booking system with detailed tracking and status updates"
                        />
                        <FeatureItem
                            icon="person-outline"
                            title="Teacher Booking UI"
                            description="Improved interface for teachers to manage their bookings efficiently"
                        />
                        <FeatureItem
                            icon="refresh-outline"
                            title="Real-time Status Updates"
                            description="Instant notifications for booking status changes"
                        />
                        <FeatureItem
                            icon="card-outline"
                            title="Native Payment SDK"
                            description="Faster and more secure payment processing"
                        />
                        <FeatureItem
                            icon="construct-outline"
                            title="Performance Improvements"
                            description="Bug fixes and optimizations for better app experience"
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>About Yuvshiksha</Text>
                    </View>

                    <Text style={styles.aboutText}>
                        Yuvshiksha is your trusted platform to connect with experienced teachers for personalized learning.
                        Find the perfect tutor, book sessions, and achieve your academic goals with ease.
                    </Text>

                    <Text style={styles.aboutText}>
                        Our mission is to make quality education accessible to everyone by bridging the gap between
                        students and qualified educators.
                    </Text>
                </View>

                {/* App Info */}
                <View style={styles.infoSection}>
                    <InfoRow icon="code-slash" label="Version" value="3.0.2" />
                    <InfoRow icon="calendar" label="Released" value="January 2026" />
                    <InfoRow icon="people" label="Platform" value="Android" />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
            <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>
        <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

// Info Row Component
const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
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
        paddingBottom: 20,
    },
    headerSection: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    appSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    versionBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    versionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        gap: 12,
    },
    featureIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    aboutText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 16,
    },
    infoSection: {
        backgroundColor: '#fff',
        marginTop: 16,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
});

export default AboutScreen;
