import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import COLORS from '../../constants/colors';

/**
 * PaymentProcessingScreen
 * Handles Cashfree payment using WebBrowser (fast loading like website)
 */
const PaymentProcessingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('initializing'); // initializing, processing, error

  const { orderId, paymentSessionId, paymentLink } = route.params || {};

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError('Missing payment information');
      setStatus('error');
      return;
    }

    // Set up deep link listener for payment callbacks
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log('Deep link received:', url);

      if (url.includes('payment-success')) {
        console.log('Payment successful, navigating to success screen');
        navigation.replace('PaymentSuccess', { orderId });
      } else if (url.includes('payment-cancelled') || url.includes('payment-failed')) {
        console.log('Payment cancelled/failed, returning to dashboard');
        navigation.goBack();
      }
    };

    // Add listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    initializePayment();

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [orderId, paymentSessionId]);

  const initializePayment = async () => {
    try {
      console.log('Initializing Cashfree payment with:', { orderId, paymentSessionId });

      setStatus('processing');

      // Use payment bridge page from our backend (works like website)
      // Add source=mobile so backend knows to redirect to app deep links
      const paymentUrl = `https://api.yuvsiksha.in/api/payments/mobile-checkout?session=${paymentSessionId}&orderId=${orderId}&source=mobile`;

      console.log('Opening payment bridge URL:', paymentUrl);
      console.log('Order ID:', orderId);
      console.log('Session ID:', paymentSessionId);

      // Open in browser
      const result = await WebBrowser.openBrowserAsync(paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: COLORS.primary,
      });

      console.log('WebBrowser result:', result);

      // After browser closes, check payment status
      // (User might have completed payment or cancelled)
      console.log('Browser closed, checking payment status...');
      await checkPaymentStatus();

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to open payment gateway');
      setStatus('error');
    }
  };

  const checkPaymentStatus = async (retryCount = 0) => {
    try {
      console.log(`Checking payment status for order: ${orderId} (attempt ${retryCount + 1})`);

      // Call backend to check payment status
      const response = await fetch(`https://api.yuvsiksha.in/api/payments/verify/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Payment status response:', data);

      if (data.success && data.status === 'PAID') {
        // Payment successful!
        console.log('Payment verified as successful');
        navigation.replace('PaymentSuccess', { orderId });
      } else if (data.status === 'PENDING' || data.status === 'ACTIVE') {
        // Still processing - ACTIVE means payment is being processed
        // Retry up to 10 times (20 seconds total)
        if (retryCount < 10) {
          console.log(`Payment still ${data.status}, checking again in 2 seconds... (${retryCount + 1}/10)`);
          setTimeout(() => checkPaymentStatus(retryCount + 1), 2000);
        } else {
          // After 10 retries, show error
          console.log('Payment verification timeout - taking too long');
          navigation.replace('PaymentFailed', {
            orderId,
            reason: 'Payment verification is taking longer than expected. Please check your payment status or contact support.'
          });
        }
      } else {
        // Payment failed or cancelled
        console.log('Payment failed or cancelled, status:', data.status);
        navigation.replace('PaymentFailed', { orderId, reason: data.message || 'Payment was not completed' });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // On error, retry a few times before giving up
      if (retryCount < 3) {
        console.log('Error checking status, retrying...');
        setTimeout(() => checkPaymentStatus(retryCount + 1), 2000);
      } else {
        // After 3 retries, go back to dashboard
        navigation.goBack();
      }
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
          onPress: () => navigation.goBack(),
          style: 'destructive'
        }
      ]
    );
  };

  // Processing or initializing state
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="card-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Processing Payment</Text>
          <Text style={styles.subtitle}>
            Opening secure payment gateway...
          </Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Please wait</Text>
        </View>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <Text style={styles.securityText}>256-bit SSL Encrypted</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Secure payment via Cashfree</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Your data is protected</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Payment will open in browser</Text>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 32,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default PaymentProcessingScreen;
