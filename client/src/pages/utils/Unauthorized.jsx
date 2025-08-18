import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-3">Access Denied</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You do not have permission to view this page.
          Please log in with appropriate credentials or contact support if you believe this is an error.
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200 shadow-md"
          >
            Go to Login
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-violet-600 text-base font-medium rounded-md text-violet-600 bg-white hover:bg-violet-50 transition-colors duration-200 dark:bg-gray-700 dark:text-violet-300 dark:border-violet-300 dark:hover:bg-gray-600"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
