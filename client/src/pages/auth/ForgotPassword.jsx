import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
  const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 space-y-6">
          <Link to="/login" className="flex items-center text-violet-600 hover:text-violet-800">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to login
          </Link>
          
          <h2 className="text-2xl font-bold text-slate-800">Forgot Password</h2>
          
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-green-800 font-medium">Password reset email sent!</p>
                <p className="text-green-600 text-sm">Check your inbox for instructions</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600">Enter your email to receive a password reset link</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full py-3 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      placeholder="your@email.com"
                      required
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;