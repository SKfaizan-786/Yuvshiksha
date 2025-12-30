import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

/**
 * PaymentFailedScreen
 * Shows payment failure with options to retry or go back
 */
const PaymentFailedScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, reason } = route.params || {};

  const handleRetry = () => {
    // Go back to teacher dashboard where user can initiate payment again
    navigation.navigate('TeacherTabs', { screen: 'Dashboard' });
  };

  const handleContactSupport = () => {
    // Navigate to a support/help screen or show contact information
    // For now, just go back to dashboard
    navigation.navigate('TeacherTabs', { screen: 'Dashboard' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <View style={styles.errorCircle}>
            <Ionicons name="close-circle" size={80} color={COLORS.error} />
          </View>
        </View>

        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.message}>
          {reason || 'Your payment could not be processed. This could be due to insufficient funds, card issues, or a cancelled transaction.'}
        </Text>

        {orderId && (
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Transaction ID</Text>
            <Text style={styles.orderIdText}>{orderId}</Text>
          </View>
        )}

        <View style={styles.reasonsBox}>
          <Text style={styles.reasonsTitle}>Common reasons for payment failure:</Text>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={8} color={COLORS.gray[500]} />
            <Text style={styles.reasonText}>Insufficient balance in account</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={8} color={COLORS.gray[500]} />
            <Text style={styles.reasonText}>Incorrect card details or OTP</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={8} color={COLORS.gray[500]} />
            <Text style={styles.reasonText}>Transaction cancelled by user</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={8} color={COLORS.gray[500]} />
            <Text style={styles.reasonText}>Payment gateway timeout</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dashboardButton} onPress={() => navigation.navigate('TeacherTabs', { screen: 'Dashboard' })}>
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2', // Light red background
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  errorCircle: {
    backgroundColor: COLORS.white,
    borderRadius: 60,
    padding: 16,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  orderIdBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  orderIdLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
    fontWeight: '500',
  },
  orderIdText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  reasonsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 12,
    flex: 1,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  supportButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  dashboardButton: {
    paddingVertical: 12,
  },
  dashboardButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[600],
    textDecorationLine: 'underline',
  },
});

export default PaymentFailedScreen;
