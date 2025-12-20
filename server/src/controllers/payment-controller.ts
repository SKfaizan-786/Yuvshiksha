import { Request, Response } from 'express';
import axios from 'axios';

export const createCashfreeOrder = async (req: Request, res: Response) => {
  try {
    const { amount, customerId, customerName, customerEmail, customerPhone, purpose } = req.body;

    // Log environment variables (without exposing secrets)
    console.log('🔧 Cashfree Config Check:');
    console.log('  - CASHFREE_BASE_URL:', process.env.CASHFREE_BASE_URL || 'MISSING');
    console.log('  - CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID ? 'SET' : 'MISSING');
    console.log('  - CASHFREE_SECRET_KEY:', process.env.CASHFREE_SECRET_KEY ? 'SET' : 'MISSING');
    console.log('  - BASE_URL:', process.env.BASE_URL || 'MISSING');

    // Validate required fields
    if (!amount || !customerId || !customerName || !customerEmail || !customerPhone) {
      console.error('❌ Missing required fields:', { amount, customerId, customerName, customerEmail, customerPhone });
      return res.status(400).json({
        message: 'Missing required payment information',
        required: ['amount', 'customerId', 'customerName', 'customerEmail', 'customerPhone']
      });
    }

    // Validate environment variables
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      console.error('❌ Cashfree credentials not configured in environment');
      return res.status(500).json({
        message: 'Payment gateway not configured. Please contact support.',
        error: 'Missing Cashfree credentials'
      });
    }

    console.log('📦 Creating order for:', { amount, customerId, customerName });

    const orderPayload = {
      order_amount: amount,
      order_currency: 'INR',
      order_note: purpose || 'Teacher Listing Fee',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.BASE_URL}/payment-success?order_id={order_id}`
      }
    };

    console.log('📤 Sending request to Cashfree:', process.env.CASHFREE_BASE_URL + '/orders');

    const response = await axios.post(
      `${process.env.CASHFREE_BASE_URL}/orders`,
      orderPayload,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json',
        }
      }
    );

    const data: any = response.data;
    console.log('✅ Cashfree order created:', data.order_id);

    // Return payment link for mobile/web compatibility
    res.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      paymentLink: data.payment_link || `https://payments.cashfree.com/links/${data.payment_session_id}`,
      ...data
    });
  } catch (error: any) {
    console.error('❌ Cashfree Order Creation Error:');
    console.error('  - Status:', error.response?.status);
    console.error('  - Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('  - Message:', error.message);

    res.status(500).json({
      message: 'Failed to create order',
      error: error.response?.data || error.message,
      details: error.response?.data?.message || 'Cashfree API error'
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  console.log('Verify Payment Request:', req.body, req.headers);
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    const response = await axios.get(
      `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json',
        }
      }
    );
    const data: any = response.data;
    if (data && data.order_status === 'PAID') {
      res.json({ success: true, message: 'Payment verified and successful', order: data });
    } else {
      res.status(200).json({
        success: false,
        message: data?.order_status || 'Payment not yet successful or failed',
        status: data?.order_status || 'pending'
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    const response = await axios.get(
      `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`, // **Updated to use environment variable**
      {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json',
        }
      }
    );
    const data: any = response.data;
    res.json({
      success: true,
      orderId,
      status: data?.order_status || 'unknown'
    });
  } catch (error: any) {
    console.error('Get payment status error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.response?.data || error.message
    });
  }
};
