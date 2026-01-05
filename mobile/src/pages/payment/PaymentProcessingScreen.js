import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Cashfree SDK - Service from main package
import {
  CFPaymentGatewayService,
  CFErrorResponse
} from 'react-native-cashfree-pg-sdk';
// Cashfree SDK - Models and Enums from contract package
import {
  CFEnvironment,
  CFSession,
  CFPaymentComponentBuilder,
  CFPaymentModes,
  CFDropCheckoutPayment,
  CFThemeBuilder
} from 'cashfree-pg-api-contract';
import COLORS from '../../constants/colors';


const PaymentProcessingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const [error, setError] = useState('');
  const [status, setStatus] = useState('processing'); // processing, error
  const [isChecking, setIsChecking] = useState(false);

  const { orderId, paymentSessionId, amount } = route.params || {};

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError('Missing payment information');
      setStatus('error');
      return;
    }

    // Set payment callback
    CFPaymentGatewayService.setCallback({
      onVerify: (orderID) => {
        console.log('✅ Payment verification triggered for:', orderID);
        // Navigate to success
        navigation.replace('PaymentSuccess', { orderId: orderID });
      },
      onError: (error, orderID) => {
        console.error('❌ Payment error:', error, 'for order:', orderID);
        setStatus('error');
        setError(error.message || 'Payment failed');
      },
    });

    // Initialize payment
    initializePayment();

    // Cleanup
    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, [orderId, paymentSessionId]);

  const initializePayment = async () => {
    try {
      setStatus('processing');
      setError('');

      console.log('🚀 Starting native Cashfree payment');
      console.log('Order ID:', orderId);
      console.log('Session ID:', paymentSessionId);

      // 1. Create Session
      const session = new CFSession(
        paymentSessionId,
        orderId,
        CFEnvironment.PRODUCTION
      );

      // 2. Create Payment Component (Modes)
      const paymentComponent = new CFPaymentComponentBuilder()
        .add(CFPaymentModes.UPI)
        .add(CFPaymentModes.CARD)
        .add(CFPaymentModes.NB)
        .add(CFPaymentModes.WALLET)
        .build();

      // 3. Create Theme
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor(COLORS.primary)
        .setNavigationBarTextColor('#ffffff')
        .setButtonBackgroundColor(COLORS.primary)
        .setButtonTextColor('#ffffff')
        .setPrimaryTextColor('#212121')
        .setSecondaryTextColor('#757575')
        .build();

      // 4. Create Drop Payment Object (THE CRITICAL WRAPPER)
      const dropPayment = new CFDropCheckoutPayment(
        session,
        paymentComponent,
        theme
      );

      // 5. Start Payment - Pass the class instance, not a raw object
      await CFPaymentGatewayService.doPayment(dropPayment);

    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment');
      setStatus('error');
    }
  };

  /**
   * Check Payment Status (Manual)
   */
  const checkPaymentStatus = async (isAutoCheck = false) => {
    if (isChecking) return;

    setIsChecking(true);

    try {
      console.log(`Checking payment status for order: ${orderId}`);
      const response = await fetch(`https://api.yuvsiksha.in/api/payments/verify/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.status === 'PAID') {
        console.log('✅ Payment verified as PAID');

        // Update listing status
        try {
          await fetch('https://api.yuvsiksha.in/api/profile/update-listing-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isListed: true }),
          });
        } catch (e) {
          console.error('Failed to update listing status:', e);
        }

        navigation.replace('PaymentSuccess', { orderId });
      } else {
        if (!isAutoCheck) {
          Alert.alert(
            'Payment Pending',
            'We haven\'t received confirmation yet. If you just paid, please wait a few seconds and try again.'
          );
        }
      }
    } catch (error) {
      console.error('Check error:', error);
      if (!isAutoCheck) {
        Alert.alert('Connection Error', 'Please check your internet connection.');
      }
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

  // State: Error
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.contentContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error || '#ef4444'} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>
            {error || 'Something went wrong. Please try again.'}
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            style={[styles.resumeButton]}
            onPress={initializePayment}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.resumeButtonText}>Try Again</Text>
          </TouchableOpacity>

          {/* Manual Check Button */}
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

  // State: Processing (Initial Load)
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
            <Ionicons name="phone-portrait" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Native secure payment</Text>
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