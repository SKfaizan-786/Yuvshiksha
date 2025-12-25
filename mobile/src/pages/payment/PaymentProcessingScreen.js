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
        navigation.navigate('TeacherDashboard');
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

      // If browser was dismissed without deep link callback, return to dashboard
      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('User dismissed browser, returning to dashboard');
        navigation.navigate('TeacherDashboard');
      }

    } catch (err) {
      console.error('Payment initialization error:', err);
      // On error, go back to dashboard
      console.log('Payment error, returning to dashboard');
      navigation.navigate('TeacherDashboard');
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
          onPress: () => {
            // Go back to the previous screen (Teacher Dashboard)
            navigation.goBack();
          },
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
            onPress={() => navigation.goBack()}
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
          {status === 'initializing' ? 'Initializing Payment' : 'Opening Payment Gateway'}
        </Text>
        <Text style={styles.message}>
          {status === 'initializing'
            ? 'Please wait while we prepare your payment...'
            : 'The payment page will open in your browser. Complete your payment and return to the app.'}
        </Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        <Text style={styles.helperText}>
          After completing payment, you'll be redirected back to the app.
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
