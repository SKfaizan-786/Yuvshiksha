
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/bookingAPI';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const hasProcessed = useRef(false);

  const orderId = searchParams.get('order_id');
  // Get type and data from location.state or localStorage
  const type = location.state?.type || localStorage.getItem('pendingPaymentType');
  const bookingData = location.state?.bookingData || JSON.parse(localStorage.getItem('pendingBookingData') || 'null');
  const listingData = location.state?.listingData || JSON.parse(localStorage.getItem('pendingListingData') || 'null');

  useEffect(() => {
    if (hasProcessed.current || !orderId) return;
    hasProcessed.current = true;

    const verifyAndProcess = async () => {
      try {
        // 1. Verify payment
        const verificationResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });
        const verificationData = await verificationResponse.json();
        if (!verificationData.success) {
          throw new Error(verificationData.message || 'Payment verification failed');
        }

        if (type === 'listing') {
          // Mark teacher as listed (update backend)
          if (listingData) {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch('/api/profile/teacher/listing', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token.replace(/^"|"$/g, '')}` } : {})
                },
                body: JSON.stringify({ isListed: true })
              });
              const result = await res.json();
              if (!res.ok || !result.success) {
                throw new Error(result.message || 'Failed to update listing status');
              }
              // Update localStorage user for instant dashboard update
              const user = JSON.parse(localStorage.getItem('currentUser'));
              if (user) {
                user.teacherProfileData = user.teacherProfileData || {};
                user.teacherProfileData.isListed = true;
                user.teacherProfileData.listedAt = result.listedAt || new Date().toISOString();
                localStorage.setItem('currentUser', JSON.stringify(user));
              }
              localStorage.removeItem('pendingListingData');
              localStorage.removeItem('pendingPaymentType');
              setStatus('success');
              setTimeout(() => navigate('/teacher/dashboard'), 2000);
            } catch (err) {
              setError(err.message || 'Failed to update listing status');
              setStatus('error');
            }
          } else {
            setError('Listing data missing.');
            setStatus('error');
          }
        } else {
          // Default: booking flow
          if (!bookingData) {
            setError('Booking data missing.');
            setStatus('error');
            return;
          }
          await bookingAPI.createBooking(bookingData);
          localStorage.removeItem('pendingBookingData');
          localStorage.removeItem('pendingPaymentType');
          setStatus('success');
          setTimeout(() => navigate('/student/dashboard'), 2000);
        }
      } catch (err) {
        setError(err.message || 'Payment processing failed');
        setStatus('error');
      }
    };
    verifyAndProcess();
  }, [orderId, type, bookingData, listingData, navigate]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-green-600"></div>
          <p className="text-gray-700">
            {type === 'listing' ? 'Verifying payment and updating listing...' : 'Verifying payment and creating booking...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-200">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(type === 'listing' ? '/teacher/dashboard' : '/')}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 bg-red-400"
            >
              Back to {type === 'listing' ? 'Dashboard' : 'Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-200">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {type === 'listing' ? 'Listing Payment Successful!' : 'Payment & Booking Successful!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {type === 'listing' ? 'You are now listed. Redirecting to dashboard...' : 'Your booking has been confirmed. Redirecting to dashboard...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}