import { useNavigate } from 'react-router-dom';

export default function PaymentFailed() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-300">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-200">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">Your payment could not be processed. Please try again or contact support.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 bg-red-400"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
