# Payment Integration Guide - Cashfree for React Native

This guide explains how to integrate Cashfree payment gateway in the React Native mobile app.

## 🔧 Setup

### 1. Install Cashfree SDK

```bash
npm install react-native-cashfree-pg-sdk
```

Or if using the web SDK approach:

```bash
npm install react-native-webview
```

### 2. Configure Android

Add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... other dependencies
    implementation 'com.cashfree.pg:api:2.1.1'
}
```

### 3. Configure iOS

Add to `ios/Podfile`:

```ruby
pod 'CashfreePG', '~> 2.1.0'
```

Then run:

```bash
cd ios && pod install
```

## 📱 Implementation Options

### Option 1: Native SDK (Recommended)

#### Step 1: Create Payment Service

```javascript
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';

// Set up callback
CFPaymentGatewayService.setCallback({
  onError: (error) => {
    console.log('Payment error:', error);
    Alert.alert('Payment Failed', error.message);
  },
  onVerify: (orderId) => {
    console.log('Verify payment:', orderId);
    // Verify payment on backend
    verifyPayment(orderId);
  },
});

// Make payment
const makePayment = async (orderData) => {
  const session = {
    payment_session_id: orderData.sessionId,
    orderAmount: orderData.amount,
    orderId: orderData.orderId,
    orderCurrency: 'INR',
    appId: process.env.EXPO_PUBLIC_CASHFREE_APP_ID,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerPhone: orderData.customerPhone,
    environment: __DEV__ ? 'TEST' : 'PRODUCTION',
  };

  CFPaymentGatewayService.doPayment(session);
};
```

#### Step 2: Create Payment Screen

```javascript
import React from 'react';
import { View, Alert } from 'react-native';
import Button from '../components/Button';
import { initiatePayment, verifyPayment } from '../utils/payment';

const PaymentScreen = ({ route, navigation }) => {
  const { bookingData } = route.params;

  const handlePayment = async () => {
    try {
      // Step 1: Create order on backend
      const orderResponse = await paymentAPI.createOrder({
        amount: bookingData.amount,
        bookingId: bookingData.id,
        teacherId: bookingData.teacherId,
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create order');
      }

      // Step 2: Initiate payment
      const paymentData = {
        sessionId: orderResponse.data.sessionId,
        orderId: orderResponse.data.orderId,
        amount: bookingData.amount,
        customerName: bookingData.studentName,
        customerEmail: bookingData.studentEmail,
        customerPhone: bookingData.studentPhone,
      };

      makePayment(paymentData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Button title="Pay Now" onPress={handlePayment} />
    </View>
  );
};
```

### Option 2: WebView Approach

#### Step 1: Create WebView Payment Screen

```javascript
import React, { useState } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

const PaymentWebViewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { paymentUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;

    // Check for success URL
    if (url.includes('/payment-success')) {
      navigation.replace('PaymentSuccess', { orderId });
    }
    // Check for failure URL
    else if (url.includes('/payment-failure')) {
      navigation.replace('PaymentFailed', { orderId });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading && <ActivityIndicator size="large" />}
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={() => setLoading(false)}
      />
    </SafeAreaView>
  );
};
```

#### Step 2: Navigate to Payment WebView

```javascript
const handlePayment = async () => {
  // Create order
  const orderResponse = await paymentAPI.createOrder(orderData);
  
  if (orderResponse.success) {
    const paymentUrl = `https://payments.cashfree.com/order/#${orderResponse.data.sessionId}`;
    
    navigation.navigate('PaymentWebView', {
      paymentUrl,
      orderId: orderResponse.data.orderId,
    });
  }
};
```

### Option 3: Deep Linking

#### Step 1: Configure Deep Links in app.json

```json
{
  "expo": {
    "scheme": "yuvshiksha",
    "ios": {
      "associatedDomains": ["applinks:yuvshiksha.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "yuvshiksha",
              "host": "payment"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

#### Step 2: Handle Deep Link in App

```javascript
import * as Linking from 'expo-linking';

useEffect(() => {
  const subscription = Linking.addEventListener('url', handleDeepLink);
  
  // Check if app was opened with a URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });

  return () => subscription.remove();
}, []);

const handleDeepLink = ({ url }) => {
  const { path, queryParams } = Linking.parse(url);
  
  if (path === 'payment/success') {
    const { orderId, orderStatus } = queryParams;
    // Verify payment and navigate to success screen
    verifyPayment(orderId);
  } else if (path === 'payment/failure') {
    // Navigate to failure screen
    navigation.navigate('PaymentFailed');
  }
};
```

## 🔐 Backend Integration

Your backend should have these endpoints:

### 1. Create Order

```javascript
POST /api/payments/create-order

Body:
{
  "amount": 500,
  "bookingId": "booking123",
  "teacherId": "teacher456"
}

Response:
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "sessionId": "session_456",
    "orderToken": "token_789"
  }
}
```

### 2. Verify Payment

```javascript
POST /api/payments/verify

Body:
{
  "orderId": "order_123"
}

Response:
{
  "success": true,
  "data": {
    "verified": true,
    "orderStatus": "PAID",
    "transactionId": "txn_123"
  }
}
```

### 3. Get Payment Status

```javascript
GET /api/payments/status/:orderId

Response:
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "status": "PAID",
    "amount": 500
  }
}
```

## 📝 Payment Flow

1. **User initiates booking**
   - Select teacher and time slot
   - View booking summary with price

2. **Create order on backend**
   - Call `/api/payments/create-order`
   - Receive order ID and session ID

3. **Initiate payment**
   - Option A: Use Cashfree SDK
   - Option B: Open WebView with payment URL
   - Option C: Use deep linking

4. **User completes payment**
   - Payment processed by Cashfree
   - Callback/webhook to your backend

5. **Verify payment**
   - Backend verifies payment with Cashfree
   - Update booking status
   - Send confirmation to user

6. **Show result**
   - Navigate to success/failure screen
   - Display transaction details

## 🧪 Testing

### Test Cards (Cashfree Sandbox)

**Success:**
- Card: 4111 1111 1111 1111
- CVV: 123
- Expiry: Any future date

**Failure:**
- Card: 4012 0010 3714 1112
- CVV: 123
- Expiry: Any future date

### Testing Steps

1. Set environment to 'TEST' in payment config
2. Use sandbox credentials
3. Test different payment scenarios:
   - Successful payment
   - Failed payment
   - Payment timeout
   - Network error

## 🔒 Security Considerations

1. **Never store sensitive data**
   - Don't save card details on device
   - Don't log payment information

2. **Use HTTPS only**
   - All API calls must use HTTPS
   - Validate SSL certificates

3. **Verify on backend**
   - Always verify payment status on backend
   - Don't trust client-side verification alone

4. **Handle errors gracefully**
   - Provide clear error messages
   - Allow retry on failure
   - Save payment state for recovery

## 📚 Resources

- [Cashfree Documentation](https://docs.cashfree.com/)
- [React Native SDK](https://docs.cashfree.com/docs/react-native)
- [Payment Gateway](https://docs.cashfree.com/docs/payment-gateway)
- [Webhook Integration](https://docs.cashfree.com/docs/webhooks)

## ⚠️ Important Notes

1. The current implementation in `src/utils/payment.js` is a placeholder
2. You need to install the actual Cashfree SDK
3. Test thoroughly in sandbox before going live
4. Implement proper error handling and retry logic
5. Add transaction history feature
6. Consider implementing saved payment methods (if applicable)

## 🚀 Next Steps

1. Install Cashfree SDK
2. Choose implementation approach (SDK, WebView, or Deep Linking)
3. Create payment screens
4. Integrate with booking flow
5. Test with sandbox credentials
6. Implement verification flow
7. Add transaction history
8. Test on real devices
9. Move to production credentials
10. Monitor transactions

---

**Status**: Prepared for implementation
**Priority**: High (required for booking completion)
**Estimated Time**: 2-3 days






