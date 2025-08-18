// client/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 text-slate-800 p-4 relative overflow-hidden">
      {/* Animated gradient orbs for background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm p-8 sm:p-12 text-center max-w-md w-full border border-white/40 relative z-10">
        <Frown className="w-24 h-24 text-red-500 mx-auto mb-6 animate-bounce-slow" />
        <h1 className="text-5xl font-extrabold text-red-600 mb-4">404</h1>
        <p className="text-2xl font-semibold text-slate-700 mb-4">Page Not Found</p>
        <p className="text-lg text-slate-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-lg shadow-sm
                     hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
