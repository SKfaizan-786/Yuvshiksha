// src/utils/cashfree.js

export async function launchCashfreePayment({ amount, customerId, customerName, customerEmail, customerPhone, purpose, onSuccess, onFailure }) {
  try {
    // 1. First create the Cashfree order
    const token = localStorage.getItem('token');
    const res = await fetch('/api/payments/cashfree-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ 
        amount, 
        customerId, 
        customerName, 
        customerEmail, 
        customerPhone, 
        purpose 
      }),
    });

    const data = await res.json();
    
    if (!data.paymentSessionId) {
      console.error('No paymentSessionId in response:', data);
      onFailure && onFailure({ 
        reason: 'Payment session not created', 
        details: data 
      });
      return;
    }

    // 2. Wait for Cashfree SDK to be fully loaded
    await waitForCashfreeSDK();

    // 3. Initialize the payment drop-in using the correct method for Cashfree v3
    window.Cashfree.init({
      paymentSessionId: data.paymentSessionId,
      returnUrl: "http://localhost:5173/listing-payment-success",
      onSuccess: (successData) => {
        console.log('Payment success:', successData);
        onSuccess && onSuccess(successData);
      },
      onFailure: (failureData) => {
        console.error('Payment failed:', failureData);
        onFailure && onFailure(failureData);
      },
      onDismiss: () => {
        console.log('Payment dialog dismissed');
        onFailure && onFailure({ reason: 'Payment dialog dismissed by user' });
      },
    });
    window.Cashfree.open();

  } catch (err) {
    console.error('Payment initialization error:', err);
    onFailure && onFailure({ 
      reason: 'Payment initialization failed', 
      error: err.message 
    });
  }
}

// Helper function to wait for Cashfree SDK to load
function waitForCashfreeSDK() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree && typeof window.Cashfree === 'function') {
      return resolve(true);
    }

    const checkInterval = 100;
    const timeout = 10000; // 10 seconds timeout
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += checkInterval;
      
      if (window.Cashfree && typeof window.Cashfree === 'function') {
        clearInterval(interval);
        resolve(true);
      }
      
      if (elapsed >= timeout) {
        clearInterval(interval);
        reject(new Error('Cashfree SDK failed to load within 10 seconds'));
      }
    }, checkInterval);
  });
}