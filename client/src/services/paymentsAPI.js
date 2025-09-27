import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL + '/api';

export const paymentsAPI = {
  createOrder: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments/cashfree-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
      credentials: 'include', // Send HttpOnly cookie
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment order');
    }

    return data;
  },
};