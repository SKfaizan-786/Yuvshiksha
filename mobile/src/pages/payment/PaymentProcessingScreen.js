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

const PaymentProcessingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('initializing'); // initializing, processing, interrupted, error

  const { orderId, paymentSessionId } = route.params || {};

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError('Missing payment information');
      setStatus('error');
      return;
    }

    const handleDeepLink = (event) => {
      const url = event.url;
      console.log('Deep link received:', url);

      if (url.includes('payment-success')) {
        navigation.replace('PaymentSuccess', { orderId });
      } else if (url.includes('payment-cancelled') || url.includes('payment-failed')) {
        navigation.goBack();
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Start payment immediately
    initializePayment();

    return () => {
      subscription.remove();
    };
  }, [orderId, paymentSessionId]);

  const initializePayment = async () => {
    try {
      console.log('Initializing Cashfree payment with:', { orderId, paymentSessionId });
      setStatus('processing');

      const paymentUrl = `https://api.yuvsiksha.in/api/payments/mobile-checkout?session=${paymentSessionId}&orderId=${orderId}&source=mobile`;
      console.log('Opening payment bridge URL:', paymentUrl);

      const result = await WebBrowser.openBrowserAsync(paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: COLORS.primary,
      });

      console.log('WebBrowser result:', result);

      // KEY FIX: Check if user cancelled/closed the browser
      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('Browser closed by user. Checking status once...');
        // Check status ONCE. If pending, show resume button instead of failing.
        await checkPaymentStatus(0, true);
      } else {
        // If it wasn't a cancel (e.g. some other close event), check normally
        console.log('Browser closed, checking payment status...');
        await checkPaymentStatus();
      }

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to open payment gateway');
      setStatus('error');
    }
  };

  // Added isManualCheck flag to prevent loop if user closed browser
  const checkPaymentStatus = async (retryCount = 0, isManualCheck = false) => {
    try {
      console.log(`Checking payment status for order: ${orderId} (attempt ${retryCount + 1})`);

      const response = await fetch(`https://api.yuvsiksha.in/api/payments/verify/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('Payment status response:', data);

      if (data.success && data.status === 'PAID') {
        // Payment successful!
        console.log('Payment verified as successful');

        // Update listing status on backend immediately
        try {
          await fetch('https://api.yuvsiksha.in/api/profile/update-listing-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isListed: true }),
          });
          console.log('Listing status updated on backend');
        } catch (e) {
          console.error('Failed to update listing:', e);
        }

        navigation.navigate('PaymentSuccess', { orderId });
      } else if (data.status === 'PENDING' || data.status === 'ACTIVE') {
        // KEY FIX: If user manually closed browser, DO NOT loop. Show "Interrupted" state.
        if (isManualCheck) {
          console.log('Payment still pending after browser close - showing interrupted state');
          setStatus('interrupted'); // New state showing "Resume" button
        } else {
          // Normal loop logic
          if (retryCount < 10) {
            console.log(`Payment still ${data.status}, checking again in 2 seconds... (${retryCount + 1}/10)`);
            setTimeout(() => checkPaymentStatus(retryCount + 1, false), 2000);
          } else {
            console.log('Payment verification timeout');
            navigation.navigate('PaymentFailed', {
              orderId,
              reason: 'Payment verification timed out. Please contact support if money was deducted.'
            });
          }
        }
      } else {
        // Payment failed
        console.log('Payment failed or cancelled, status:', data.status);
        navigation.navigate('PaymentFailed', { orderId, reason: data.message || 'Payment was not completed' });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);

      if (retryCount < 3 && !isManualCheck) {
        console.log('Error checking status, retrying...');
        setTimeout(() => checkPaymentStatus(retryCount + 1, false), 2000);
      } else {
        // If error during manual check, just show resume button
        console.log('Error during manual check - showing interrupted state');
        setStatus('interrupted');
      }
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
      { text: 'Continue Payment', style: 'cancel' },
      { text: 'Yes, Cancel', onPress: () => navigation.goBack(), style: 'destructive' }
    ]);
  };

  // RENDER: Interrupted state (browser closed without payment)
  if (status === 'interrupted') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.contentContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.warning || '#f59e0b'} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Payment Interrupted</Text>
          <Text style={styles.subtitle}>
            You closed the payment window. If you haven't paid yet, you can resume.
          </Text>

          <TouchableOpacity
            style={[styles.resumeButton]}
            onPress={initializePayment}
          >
            <Text style={styles.resumeButtonText}>Resume Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkButton]}
            onPress={() => checkPaymentStatus(0, false)}
          >
            <Text style={styles.checkButtonText}>I Already Paid - Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: COLORS.gray[500], fontSize: 15 }}>Cancel and go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // RENDER: Processing/Initializing state
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="card-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Processing Payment</Text>
          <Text style={styles.subtitle}>Opening secure payment gateway...</Text>
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Please wait</Text>
        </View>

        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <Text style={styles.securityText}>256-bit SSL Encrypted</Text>
        </View>

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
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
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
  resumeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  checkButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default PaymentProcessingScreen;
