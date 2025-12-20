import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CFErrorResponse, CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import COLORS from '../../constants/colors';

/**
 * PaymentProcessingScreen
 * Handles Cashfree payment using native SDK
 */
const PaymentProcessingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('initializing'); // initializing, processing, error

  const { orderId, paymentSessionId } = route.params || {};

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError('Missing payment information');
      setStatus('error');
      return;
    }

    initializePayment();
  }, [orderId, paymentSessionId]);

  const initializePayment = async () => {
    try {
      console.log('Initializing Cashfree payment with:', { orderId, paymentSessionId });

      setStatus('processing');

      // Set Cashfree environment (Production)
      CFPaymentGatewayService.setCallback({
        onVerify: (orderInfo) => {
          console.log('✅ Payment verification:', orderInfo);
          // Payment successful - navigate to success screen
          navigation.replace('PaymentSuccess', { orderId });
        },
        onError: (error, orderInfo) => {
          console.error('❌ Payment error:', error, orderInfo);
          // Payment failed - navigate to failure screen
          navigation.replace('PaymentFailed', {
            orderId,
            reason: error.message || 'Payment failed'
          });
        },
      });

      // Create payment session object
      const session = {
        orderID: orderId,
        paymentSessionID: paymentSessionId,
        environment: 'PRODUCTION', // Use 'SANDBOX' for testing
      };

      console.log('Starting Cashfree payment session:', session);

      // Start the payment
      CFPaymentGatewayService.doPayment(session);

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment');
      setStatus('error');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          onPress: () => navigation.replace('TeacherDashboard'),
          style: 'destructive'
        }
      ]
    );
  };

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('TeacherDashboard')}
          >
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Processing or initializing state
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>
          {status === 'initializing' ? 'Initializing Payment' : 'Processing Payment'}
        </Text>
        <Text style={styles.message}>
          {status === 'initializing'
            ? 'Please wait while we prepare your payment...'
            : 'Complete your payment in the payment screen that will open shortly.'}
        </Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        <Text style={styles.helperText}>
          The payment gateway will open in a moment. Please do not close this screen.
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
          <Text style={styles.secondaryButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loader: {
    marginVertical: 24,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default PaymentProcessingScreen;
