#!/usr/bin/env node
/**
 * Payment Setup Diagnostic Tool
 * Run this on VPS to check if everything is configured correctly
 */

require('dotenv').config();

console.log('\n🔍 === PAYMENT SETUP DIAGNOSTIC ===\n');

// Check 1: Environment Variables
console.log('1️⃣  Checking Environment Variables:');
console.log('   CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID ? '✅ SET' : '❌ MISSING');
console.log('   CASHFREE_SECRET_KEY:', process.env.CASHFREE_SECRET_KEY ? '✅ SET' : '❌ MISSING');
console.log('   CASHFREE_BASE_URL:', process.env.CASHFREE_BASE_URL || '❌ MISSING');
console.log('   BASE_URL:', process.env.BASE_URL || '❌ MISSING');

if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
  console.log('\n❌ CRITICAL: Cashfree credentials are missing!');
  console.log('   Action: Check your .env file on VPS\n');
  process.exit(1);
}

// Check 2: Test Cashfree API Connection
console.log('\n2️⃣  Testing Cashfree API Connection:');

const axios = require('axios');

const testCashfree = async () => {
  try {
    const testOrderPayload = {
      order_amount: 1,
      order_currency: 'INR',
      order_note: 'Test Order',
      customer_details: {
        customer_id: 'test_' + Date.now(),
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.BASE_URL}/payment-success?order_id={order_id}`
      }
    };

    console.log('   Sending test request to:', process.env.CASHFREE_BASE_URL + '/orders');

    const response = await axios.post(
      `${process.env.CASHFREE_BASE_URL}/orders`,
      testOrderPayload,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    console.log('   ✅ SUCCESS: Cashfree API is working!');
    console.log('   Order ID:', response.data.order_id);
    console.log('   Payment Session ID:', response.data.payment_session_id);
    return true;

  } catch (error) {
    console.log('   ❌ FAILED: Cashfree API error');
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Error:', error.response?.data || error.message);

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('\n   🔑 ISSUE: Invalid Cashfree credentials');
      console.log('   Action: Verify App ID and Secret Key in Cashfree dashboard');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('\n   🌐 ISSUE: Cannot reach Cashfree servers');
      console.log('   Action: Check firewall/network settings on VPS');
    }
    return false;
  }
};

// Check 3: Verify .env file location
console.log('\n3️⃣  Checking .env file:');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found at:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasAppId = envContent.includes('CASHFREE_APP_ID');
  const hasSecretKey = envContent.includes('CASHFREE_SECRET_KEY');
  const hasBaseUrl = envContent.includes('CASHFREE_BASE_URL');

  console.log('   CASHFREE_APP_ID in file:', hasAppId ? '✅' : '❌');
  console.log('   CASHFREE_SECRET_KEY in file:', hasSecretKey ? '✅' : '❌');
  console.log('   CASHFREE_BASE_URL in file:', hasBaseUrl ? '✅' : '❌');
} else {
  console.log('   ❌ .env file NOT found at:', envPath);
  console.log('   Action: Create .env file with Cashfree credentials');
}

// Run the test
console.log('\n4️⃣  Running API Test:\n');

testCashfree().then((success) => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('Payment integration is configured correctly.');
  } else {
    console.log('❌ CONFIGURATION ISSUES FOUND');
    console.log('Please fix the issues above and try again.');
  }
  console.log('='.repeat(50) + '\n');
});
