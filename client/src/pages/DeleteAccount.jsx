import React from 'react';
import { Link } from 'react-router-dom';

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Yuvsiksha
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Delete Account</h1>
          <p className="text-sm text-gray-500 mb-8">Request account and data deletion</p>

          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              We're sorry to see you go. If you wish to delete your Yuvsiksha account and all associated data, 
              please follow the instructions below.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request Account Deletion</h2>
            
            <div className="bg-indigo-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Send an email to:</h3>
              <a 
                href="mailto:yuvsiksha@gmail.com?subject=Account%20Deletion%20Request" 
                className="text-xl font-bold text-indigo-600 hover:text-indigo-800"
              >
                yuvsiksha@gmail.com
              </a>
              <p className="text-sm text-gray-600 mt-2">Subject: Account Deletion Request</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Include in your email:</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Your registered email address</li>
              <li>Your full name</li>
              <li>Reason for deletion (optional)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Gets Deleted</h2>
            <p className="text-gray-700 mb-4">When you request account deletion, the following data will be permanently removed:</p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Your profile information (name, email, phone number)</li>
              <li>Your account credentials</li>
              <li>Your booking history</li>
              <li>Your messages and chat history</li>
              <li>Your profile pictures and uploaded documents</li>
              <li>Your payment history (financial records may be retained for legal compliance)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              Most data will be deleted within <strong>30 days</strong> of your request. However, some data may be 
              retained for legal and compliance purposes:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Transaction records (retained for 7 years as per tax laws)</li>
              <li>Legal compliance data (as required by law)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Time</h2>
            <p className="text-gray-700 mb-6">
              We will process your deletion request within <strong>7 business days</strong>. You will receive a 
              confirmation email once your account has been deleted.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Note:</strong> Account deletion is permanent and cannot be undone. Please ensure you want 
                to proceed before submitting your request.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-700">
              If you have questions about account deletion or data privacy, please contact us at{' '}
              <a href="mailto:yuvsiksha@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-medium">
                yuvsiksha@gmail.com
              </a>
            </p>
          </div>

          {/* Back to Home Button */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2024 Yuvsiksha. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
