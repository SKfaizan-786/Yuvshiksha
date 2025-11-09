/**
 * Payment Utility for React Native
 * Cashfree Payment Gateway Integration
 * 
 * NOTE: This is a placeholder implementation.
 * You'll need to install and configure the Cashfree React Native SDK
 * 
 * Installation:
 * npm install react-native-cashfree-pg-sdk
 * or
 * npm install cashfree-react-native
 */

import { Alert, Linking } from 'react-native';
import paymentAPI from '../services/paymentAPI';

/**
 * Initialize payment
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Amount to pay
 * @param {string} paymentData.bookingId - Booking ID
 * @param {string} paymentData.teacherId - Teacher ID
 * @returns {Promise} Payment result
 */
export const initiatePayment = async (paymentData) => {
  try {
    console.log('💰 Initiating payment:', paymentData);

    // Step 1: Create order on backend
    const orderResponse = await paymentAPI.createOrder({
      amount: paymentData.amount,
      bookingId: paymentData.bookingId,
      teacherId: paymentData.teacherId,
    });

    if (!orderResponse.success) {
      throw new Error(orderResponse.message || 'Failed to create order');
    }

    const { orderId, sessionId, orderToken } = orderResponse.data;

    // Step 2: Open Cashfree payment page
    // Method 1: Using WebView (recommended for React Native)
    // You'll need to create a WebView screen for this
    const paymentUrl = `https://payments.cashfree.com/order/#${sessionId}`;
    
    // Method 2: Open in browser (fallback)
    const canOpen = await Linking.canOpenURL(paymentUrl);
    if (canOpen) {
      await Linking.openURL(paymentUrl);
    } else {
      throw new Error('Cannot open payment URL');
    }

    // Note: In production, you should:
    // 1. Use Cashfree React Native SDK
    // 2. Or create a WebView component to handle the payment flow
    // 3. Listen for payment callbacks

    return {
      success: true,
      orderId,
      message: 'Payment initiated',
    };
  } catch (error) {
    console.error('❌ Payment error:', error);
    Alert.alert('Payment Error', error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Verify payment
 * @param {string} orderId - Order ID
 * @returns {Promise} Verification result
 */
export const verifyPayment = async (orderId) => {
  try {
    console.log('🔍 Verifying payment:', orderId);

    const response = await paymentAPI.verifyPayment({ orderId });

    if (response.success && response.data.verified) {
      Alert.alert('Success', 'Payment verified successfully!');
      return {
        success: true,
        verified: true,
        data: response.data,
      };
    } else {
      Alert.alert('Error', 'Payment verification failed');
      return {
        success: false,
        verified: false,
      };
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
    Alert.alert('Verification Error', error.message);
    return {
      success: false,
      verified: false,
      message: error.message,
    };
  }
};

/**
 * Check payment status
 * @param {string} orderId - Order ID
 * @returns {Promise} Payment status
 */
export const checkPaymentStatus = async (orderId) => {
  try {
    const response = await paymentAPI.getPaymentStatus(orderId);
    return response;
  } catch (error) {
    console.error('❌ Status check error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Handle payment callback
 * This should be called from your WebView or deep link handler
 * @param {Object} callbackData - Callback data from Cashfree
 */
export const handlePaymentCallback = async (callbackData) => {
  const { orderId, orderStatus, txStatus } = callbackData;

  console.log('📞 Payment callback:', callbackData);

  if (orderStatus === 'PAID' || txStatus === 'SUCCESS') {
    // Verify payment on backend
    const verificationResult = await verifyPayment(orderId);
    return verificationResult;
  } else {
    Alert.alert('Payment Failed', 'Your payment was not successful. Please try again.');
    return {
      success: false,
      message: 'Payment failed',
    };
  }
};

/**
 * IMPLEMENTATION GUIDE FOR CASHFREE INTEGRATION:
 * 
 * 1. Install Cashfree SDK:
 *    npm install react-native-cashfree-pg-sdk
 * 
 * 2. Configure Android (android/app/build.gradle):
 *    implementation 'com.cashfree.pg:api:2.1.1'
 * 
 * 3. Create Payment Screen:
 *    import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
 * 
 * 4. Initialize SDK:
 *    CFPaymentGatewayService.setCallback({
 *      onError: (error) => {
 *        console.log('Payment error:', error);
 *      },
 *      onVerify: (orderId) => {
 *        console.log('Verify payment:', orderId);
 *        verifyPayment(orderId);
 *      }
 *    });
 * 
 * 5. Make Payment:
 *    const session = {
 *      payment_session_id: sessionId,
 *      orderAmount: amount,
 *      orderId: orderId,
 *      orderCurrency: 'INR',
 *      appId: CASHFREE_APP_ID,
 *      customerName: customerName,
 *      customerEmail: customerEmail,
 *      customerPhone: customerPhone,
 *      environment: 'PRODUCTION', // or 'TEST'
 *    };
 * 
 *    CFPaymentGatewayService.doPayment(session);
 * 
 * 6. Alternative: WebView Approach
 *    - Create a WebView screen
 *    - Load Cashfree payment URL
 *    - Listen for navigation changes
 *    - Handle success/failure redirects
 * 
 * 7. Deep Linking for Callbacks
 *    - Configure deep links in app.json
 *    - Handle payment callback URLs
 *    - Extract order status from URL parameters
 * 
 * Resources:
 * - Cashfree Docs: https://docs.cashfree.com/docs/
 * - React Native SDK: https://docs.cashfree.com/docs/react-native
 */

export default {
  initiatePayment,
  verifyPayment,
  checkPaymentStatus,
  handlePaymentCallback,
};






