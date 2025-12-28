import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import COLORS from '../../constants/colors';

const HelpSupportScreen = ({ route }) => {
    const { userRole } = route.params || { userRole: 'student' };
    const [expandedFaq, setExpandedFaq] = useState(null);

    const faqs = userRole === 'teacher' ? [
        {
            question: 'How do I get listed on Yuvsiksha?',
            answer: 'Complete your profile and pay the one-time listing fee of ₹100. Once listed, students can find and book you for classes.',
        },
        {
            question: 'How do I receive payments?',
            answer: 'Students pay through our secure payment gateway. Payments are processed and transferred to your registered account after class completion.',
        },
        {
            question: 'Can I set my own hourly rate?',
            answer: 'Yes! You can set your preferred hourly rate in your profile. Students will see this rate when booking classes with you.',
        },
        {
            question: 'How do I manage my schedule?',
            answer: 'Use the Schedule tab to set your availability. You can add time slots for each day of the week, and students can only book during these times.',
        },
        {
            question: 'What if I need to cancel a class?',
            answer: 'Contact the student through our messaging system as soon as possible. For cancellations, please reach out to our support team.',
        },
    ] : [
        {
            question: 'How do I find a teacher?',
            answer: 'Browse teachers by subject, location, or teaching mode. Use filters to find the perfect match for your learning needs.',
        },
        {
            question: 'How do I book a class?',
            answer: 'Select a teacher, choose an available time slot, and proceed to payment. Once confirmed, you\'ll receive booking details.',
        },
        {
            question: 'Is my payment secure?',
            answer: 'Yes! We use industry-standard secure payment gateways. Your payment information is encrypted and never stored on our servers.',
        },
        {
            question: 'Can I cancel a booking?',
            answer: 'Yes, you can cancel bookings. Please check our cancellation policy for refund details. Contact support for assistance.',
        },
        {
            question: 'How do I contact my teacher?',
            answer: 'Use the Messages tab to chat with your teacher. You can discuss class details, ask questions, or reschedule if needed.',
        },
    ];

    const quickActions = [
        {
            title: 'Email Support',
            subtitle: 'yuvsiksha@gmail.com',
            icon: 'mail',
            action: () => Linking.openURL('mailto:yuvsiksha@gmail.com'),
        },
        {
            title: 'Privacy Policy',
            subtitle: 'View our privacy policy',
            icon: 'shield-checkmark',
            action: () => Linking.openURL('https://yuvsiksha.in/privacy-policy'),
        },
        {
            title: 'Delete My Data',
            subtitle: 'Request account & data deletion',
            icon: 'trash',
            action: () => Linking.openURL('https://yuvsiksha.in/delete-account'),
        },
        {
            title: 'Report a Problem',
            subtitle: 'Let us know if something\'s wrong',
            icon: 'flag',
            action: () => {
                Linking.openURL('mailto:yuvsiksha@gmail.com?subject=Problem Report');
            },
        },
    ];

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Header title="Help & Support" showBack />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome Section */}
                <Card style={styles.welcomeCard}>
                    <View style={styles.welcomeIcon}>
                        <Ionicons name="help-circle" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.welcomeTitle}>How can we help you?</Text>
                    <Text style={styles.welcomeText}>
                        Find answers to common questions or reach out to our support team
                    </Text>
                </Card>

                {/* FAQs Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {faqs.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqCard}
                            onPress={() => toggleFaq(index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </View>
                            {expandedFaq === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.actionCard}
                            onPress={action.action}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name={action.icon} size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Contact Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <Card style={styles.contactCard}>
                        <View style={styles.contactRow}>
                            <Ionicons name="mail" size={20} color={COLORS.primary} />
                            <Text style={styles.contactText}>yuvsiksha@gmail.com</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="time" size={20} color={COLORS.primary} />
                            <Text style={styles.contactText}>Response time: 24-48 hours</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="globe" size={20} color={COLORS.primary} />
                            <Text style={styles.contactText}>www.yuvsiksha.in</Text>
                        </View>
                    </Card>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>Yuvsiksha v1.0.0</Text>
                    <Text style={styles.appInfoText}>© 2025 Yuvsiksha. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Extra padding for bottom devices
    },
    welcomeCard: {
        alignItems: 'center',
        padding: 24,
        marginBottom: 24,
    },
    welcomeIcon: {
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    faqCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[100],
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 12,
        lineHeight: 20,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[100],
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    contactCard: {
        padding: 16,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        marginLeft: 12,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    appInfoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
});

export default HelpSupportScreen;
