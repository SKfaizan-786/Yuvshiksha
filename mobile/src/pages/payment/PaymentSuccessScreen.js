import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import COLORS from '../../constants/colors';
import paymentAPI from '../../services/paymentAPI';
import profileAPI from '../../services/profileAPI';

/**
 * PaymentSuccessScreen
 * Verifies payment and updates teacher listing status
 */
const PaymentSuccessScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, setUser } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');
  const [scaleAnim] = useState(new Animated.Value(0));

  const { orderId } = route.params || {};

  useEffect(() => {
    if (!orderId) {
      setError('Missing order information');
      setStatus('error');
      return;
    }

    verifyAndUpdateListing();
  }, [orderId]);

  useEffect(() => {
    if (status === 'success') {
      // Animate success icon
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Auto redirect after 3 seconds
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TeacherDashboard' }],
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const verifyAndUpdateListing = async () => {
    try {
      // Step 1: Verify payment
      console.log('Verifying payment for order:', orderId);
      const verificationResponse = await paymentAPI.verifyPayment({ orderId });

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }

      console.log('Payment verified successfully');

      // Step 2: Update teacher listing status
      console.log('Updating listing status...');
      const listingResponse = await profileAPI.updateListingStatus(true);

      console.log('Listing status updated:', listingResponse);

      // Step 3: Update user context
      if (user) {
        const updatedUser = {
          ...user,
          teacherProfile: {
            ...user.teacherProfile,
            isListed: true,
            listedAt: listingResponse.listedAt || new Date().toISOString(),
          },
        };
        setUser(updatedUser);
      }

      setStatus('success');
    } catch (err) {
      console.error('Payment verification/listing update error:', err);
      setError(err.message || 'Failed to process payment. Please contact support.');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setStatus('verifying');
    setError('');
    verifyAndUpdateListing();
  };

  const handleGoToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'TeacherDashboard' }],
    });
  };

  if (status === 'verifying') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color={COLORS.success} style={styles.loader} />
          <Text style={styles.title}>Verifying Payment</Text>
          <Text style={styles.message}>
            Please wait while we verify your payment and update your listing status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={72} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Verification Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.helperText}>
            Your payment was successful, but we couldn't update your listing status automatically.
            Please contact support with Order ID: {orderId}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoToDashboard}>
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  return (
    <SafeAreaView style={styles.successContainer}>
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
        </Animated.View>

        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          Congratulations! You are now listed on Yuvsiksha. Students can now discover and book
          sessions with you.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Your profile is now visible to students</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Start receiving booking requests</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>Earn by teaching students online</Text>
          </View>
        </View>

        <Text style={styles.redirectText}>Redirecting to dashboard...</Text>

        <TouchableOpacity style={styles.dashboardButton} onPress={handleGoToDashboard}>
          <Text style={styles.dashboardButtonText}>Go to Dashboard Now</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
  successContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background
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
  successIconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    backgroundColor: COLORS.white,
    borderRadius: 60,
    padding: 16,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loader: {
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  infoBox: {
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
    fontSize: 15,
    color: COLORS.gray[700],
    marginLeft: 12,
    flex: 1,
  },
  redirectText: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 16,
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
  dashboardButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 8,
  },
});

export default PaymentSuccessScreen;
