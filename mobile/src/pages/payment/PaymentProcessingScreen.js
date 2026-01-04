import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  AppState, // ✅ Logic: Added for auto-detection
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import COLORS from '../../constants/colors';

const PaymentProcessingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const appState = useRef(AppState.currentState);

  const [error, setError] = useState('');
  const [status, setStatus] = useState('processing'); // processing, interrupted, error
  const [hasOpenedBrowser, setHasOpenedBrowser] = useState(false);
  const [isChecking, setIsChecking] = useState(false); // ✅ Logic: Track manual check for spinner

  const { orderId, paymentSessionId } = route.params || {};

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError('Missing payment information');
      setStatus('error');
      return;
    }

    // 1. Deep Link Handler
    const handleDeepLink = (event) => {
      const url = event.url;
      if (url.includes('payment-success')) {
        navigation.replace('PaymentSuccess', { orderId });
      } else if (url.includes('payment-cancelled') || url.includes('payment-failed')) {
        navigation.goBack();
      }
    };
    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // 2. AppState Handler (Auto-check logic)
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 User returned to app. Silent check started...');
        // Only auto-check if they have actually opened the browser at least once
        if (hasOpenedBrowser) {
          checkPaymentStatus(true); // true = Silent Mode
        }
      }
      appState.current = nextAppState;
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial Start
    initializePayment();

    return () => {
      linkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [orderId, paymentSessionId, hasOpenedBrowser]);

  const initializePayment = async () => {
    // Prevent accidental multi-opens
    if (hasOpenedBrowser) return;

    try {
      setStatus('processing');
      const paymentUrl = `https://api.yuvsiksha.in/api/payments/mobile-checkout?session=${paymentSessionId}&orderId=${orderId}&source=mobile`;

      const result = await WebBrowser.openBrowserAsync(paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
        controlsColor: COLORS.primary,
      });

      setHasOpenedBrowser(true);

      // Immediately show "Interrupted" state so user can Resume or Check Status manually
      // We rely on AppState or Manual Button for the actual check
      setStatus('interrupted');

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to open payment gateway');
      setStatus('error');
    }
  };

  /**
   * Check Payment Status
   * @param {boolean} isAutoCheck - If true, run silently (no alerts, no spinner)
   */
  const checkPaymentStatus = async (isAutoCheck = false) => {
    if (isChecking) return; // Prevent double taps

    // Only show spinner if user clicked the button manually
    if (!isAutoCheck) setIsChecking(true);

    try {
      console.log(`Checking status (Auto: ${isAutoCheck})...`);
      const response = await fetch(`https://api.yuvsiksha.in/api/payments/verify/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.status === 'PAID') {
        // --- SUCCESS ---
        console.log('✅ Payment Paid! Redirecting...');

        try {
          await fetch('https://api.yuvsiksha.in/api/profile/update-listing-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isListed: true }),
          });
        } catch (e) { }

        navigation.replace('PaymentSuccess', { orderId });
      }
      else {
        // --- PENDING / FAILED ---
        if (isAutoCheck) {
          // Silent mode: Do nothing. User might be copying UPI ID.
          console.log('Silent check: Payment still pending. Waiting...');
        } else {
          // Manual mode: Show alert
          if (data.status === 'PENDING' || data.status === 'ACTIVE') {
            Alert.alert(
              'Payment Pending',
              'We haven\'t received the confirmation yet. If you just paid, please wait a few seconds and try again.'
            );
          } else {
            Alert.alert('Payment Failed', data.message || 'Transaction failed.');
          }
        }
      }
    } catch (error) {
      console.error('Check error:', error);
      if (!isAutoCheck) Alert.alert('Connection Error', 'Please check your internet.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
      { text: 'No, Wait', style: 'cancel' },
      { text: 'Yes, Cancel', onPress: () => navigation.goBack(), style: 'destructive' }
    ]);
  };

  // --- RENDER ---

  // State 1: Interrupted (Browser Closed / User Returned)
  if (status === 'interrupted') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.contentContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.warning || '#f59e0b'} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>
            {hasOpenedBrowser ? 'Payment In Progress' : 'Payment Interrupted'}
          </Text>
          <Text style={styles.subtitle}>
            {hasOpenedBrowser
              ? 'The payment page was closed. You can resume to complete your payment.'
              : 'You closed the payment window. If you haven\'t paid yet, you can resume.'}
          </Text>

          {/* Resume Button */}
          <TouchableOpacity
            style={[styles.resumeButton]}
            onPress={initializePayment}
            disabled={isChecking}
          >
            <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.resumeButtonText}>
              {hasOpenedBrowser ? 'Continue Payment' : 'Resume Payment'}
            </Text>
          </TouchableOpacity>

          {/* Manual Check Button (Updated with Loading Spinner logic) */}
          <TouchableOpacity
            style={[styles.checkButton, isChecking && { opacity: 0.7 }]}
            onPress={() => checkPaymentStatus(false)}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.checkButtonText}>
              {isChecking ? 'Checking Status...' : 'I Already Paid - Check Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
            <Text style={{ color: COLORS.gray[500], fontSize: 15 }}>Cancel and go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // State 2: Processing (Initial Load)
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
    flexDirection: 'row',
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
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