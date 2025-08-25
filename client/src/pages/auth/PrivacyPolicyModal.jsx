import React from 'react';
import policyText from '../utils/privacy-policy.txt?raw';

export default function PrivacyPolicyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200/60 backdrop-blur-sm">
      <div className="bg-white max-w-2xl w-full rounded-lg shadow-lg p-6 overflow-y-auto max-h-[80vh] relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Privacy Policy & Terms</h2>
        <div className="text-sm text-gray-700 whitespace-pre-line" style={{fontFamily: 'inherit'}}>
          {policyText}
        </div>
      </div>
    </div>
  );
}
