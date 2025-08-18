import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { load } from "@cashfreepayments/cashfree-js";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Try to get from state, else fallback to localStorage
  let { orderId, paymentSessionId, bookingData, listingData, type } = location.state || {};

  // Save to localStorage if present in state
  useEffect(() => {
    if (orderId && paymentSessionId) {
      localStorage.setItem("pendingOrderId", orderId);
      localStorage.setItem("pendingPaymentSessionId", paymentSessionId);
      if (bookingData) localStorage.setItem("pendingBookingData", JSON.stringify(bookingData));
      if (listingData) localStorage.setItem("pendingListingData", JSON.stringify(listingData));
      if (type) localStorage.setItem("pendingPaymentType", type);
    }
  }, [orderId, paymentSessionId, bookingData, listingData, type]);

  // Fallback to localStorage if missing
  if (!orderId) orderId = localStorage.getItem("pendingOrderId");
  if (!paymentSessionId) paymentSessionId = localStorage.getItem("pendingPaymentSessionId");
  if (!bookingData) {
    try {
      bookingData = JSON.parse(localStorage.getItem("pendingBookingData") || "null");
    } catch { bookingData = null; }
  }
  if (!listingData) {
    try {
      listingData = JSON.parse(localStorage.getItem("pendingListingData") || "null");
    } catch { listingData = null; }
  }
  if (!type) type = localStorage.getItem("pendingPaymentType");

  useEffect(() => {
    if (!orderId || !paymentSessionId) {
      setError("Missing payment information");
      return;
    }
    initializePayment();
    // eslint-disable-next-line
  }, [orderId, paymentSessionId]);

  const initializePayment = async () => {
    try {
      const cashfree = await load({ mode: "sandbox" });
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
      };
      await cashfree.checkout(checkoutOptions);
    } catch (err) {
      setError("Failed to initialize payment");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-200">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payments Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(type === 'listing' ? '/teacher/dashboard' : '/')}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 bg-red-400"
            >
              {type === 'listing' ? 'Back to Dashboard' : 'Back to Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-green-600"></div>
        <p className="text-gray-700">Initializing payment gateway...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we redirect you to the payment page</p>
      </div>
    </div>
  );
}
