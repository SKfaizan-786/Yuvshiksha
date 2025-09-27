import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { load } from "@cashfreepayments/cashfree-js";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  
  // Only handle listing data
  let { orderId, paymentSessionId, listingData, type } = location.state || {};

  // Save to localStorage if present in state
  useEffect(() => {
    if (orderId && paymentSessionId) {
      localStorage.setItem("pendingOrderId", orderId);
      localStorage.setItem("pendingPaymentSessionId", paymentSessionId);
      if (listingData) localStorage.setItem("pendingListingData", JSON.stringify(listingData));
      if (type) localStorage.setItem("pendingPaymentType", type);
    }
  }, [orderId, paymentSessionId, listingData, type]);

  // Fallback to localStorage if missing
  if (!orderId) orderId = localStorage.getItem("pendingOrderId");
  if (!paymentSessionId) paymentSessionId = localStorage.getItem("pendingPaymentSessionId");
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
      const cashfree = await load({ mode: "production" }); // **This is the change**
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
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
        <div className="animate-pulse rounded-full h-12 w-12 border-4 mx-auto mb-4 border-blue-500"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Initializing payment gateway...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the payment page</p>
      </div>
    </div>
  );
}