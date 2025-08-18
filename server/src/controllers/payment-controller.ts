
import { Request, Response } from 'express';
import axios from 'axios';

// No SDK needed for direct axios call

export const createCashfreeOrder = async (req: Request, res: Response) => {
  try {
    const { amount, customerId, customerName, customerEmail, customerPhone, purpose } = req.body;
    const orderPayload = {
      order_amount: amount,
      order_currency: 'INR',
      order_note: purpose || '',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        // Unified return_url for both listing and booking payments
        return_url: `http://localhost:5173/payment-success?order_id={order_id}`
      }
    };
    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
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
    res.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      ...data // include all original fields for debugging
    });
  } catch (error: any) {
    console.error('Cashfree Order Creation Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.response?.data || error.message
    });
  }
};

// Verify payment
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
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

// Get payment status (polling)
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
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