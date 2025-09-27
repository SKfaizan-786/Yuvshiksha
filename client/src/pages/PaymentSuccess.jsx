import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { listingAPI } from '../services/listingAPI';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const hasProcessed = useRef(false);

  const orderId = searchParams.get('order_id');
  const type = location.state?.type || localStorage.getItem('pendingPaymentType');
  const listingData = location.state?.listingData || JSON.parse(localStorage.getItem('pendingListingData') || 'null');

  useEffect(() => {
    if (!orderId) {
      setError("Missing payment order ID.");
      setStatus('error');
    }
  }, [orderId]);

  useEffect(() => {
    if (hasProcessed.current || !orderId || status === 'error') return;
    hasProcessed.current = true;

    const verifyAndProcess = async () => {
      try {
        // Step 1: Verify payment with the backend
        const verificationResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
          credentials: 'include',
        });

        if (!verificationResponse.ok) {
          const errorData = await verificationResponse.json();
          throw new Error(errorData.message || 'Payment verification failed');
        }

        const verificationData = await verificationResponse.json();
        if (!verificationData.success) {
          throw new Error(verificationData.message || 'Payment verification failed');
        }

        // Step 2: Update teacher's listing status
        if (!listingData) {
          setError('Listing data missing.');
          setStatus('error');
          return;
        }

        const result = await listingAPI.updateListingStatus(true);
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (user) {
          user.teacherProfileData = user.teacherProfileData || {};
          user.teacherProfileData.isListed = true;
          user.teacherProfileData.listedAt = result.listedAt || new Date().toISOString();
          localStorage.setItem('currentUser', JSON.stringify(user));
        }

        // Clean up localStorage
        localStorage.removeItem('pendingListingData');
        localStorage.removeItem('pendingPaymentType');
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('pendingPaymentSessionId');

        setStatus('success');
        setTimeout(() => navigate('/teacher/dashboard'), 2000);

      } catch (err) {
        console.error('Processing error:', err);
        setError(err.message || 'Payment processing failed');
        setStatus('error');
      }
    };

    verifyAndProcess();
  }, [orderId, listingData, navigate, status]); // Removed unused dependencies

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-green-600"></div>
          <p className="text-gray-700">Verifying payment and updating listing...</p>
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
              onClick={() => navigate('/teacher/dashboard')}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 bg-red-400"
            >
              Back to Dashboard
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Listing Payment Successful!</h2>
            <p className="text-gray-600 mb-6">You are now listed. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}