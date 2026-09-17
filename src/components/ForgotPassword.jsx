import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IoMailOutline, IoArrowBackOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import AppInput from './AppInput';
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from '../Utils/regex';
import ApiHit from '../Utils/ApiHit';
import { ForgotPasswordAPI } from './Constant/Api/Api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmed = email.trim();
    if (!trimmed) {
      setError(VALIDATION_MESSAGES.required);
      return;
    }
    if (!REGEX_PATTERNS.email.test(trimmed)) {
      setError(VALIDATION_MESSAGES.email);
      return;
    }

    setIsLoading(true);

    try {
      const r = await ApiHit(ForgotPasswordAPI, 'POST', { email: trimmed });

      // The server answers the same way whether or not the address belongs to an
      // account — telling the difference here would undo that on the client.
      if (r?.success) {
        setIsEmailSent(true);
      } else {
        setError(r?.message || 'Could not send the reset email. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    setEmail('');
    setError('');
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-4">
              <IoCheckmarkCircleOutline className="h-12 w-12 text-green-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
              Check your email
            </h2>
            <p className="text-gray-400 dark:text-slate-500 mb-6">
              If <span className="text-white font-medium">{email}</span> belongs to an
              account, a reset link is on its way.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
              The link works once and expires in 30 minutes. Nothing arriving?
              Check the spam folder, or try a different address.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Try Different Email
            </button>
            
            <Link
              to="/login"
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-full text-gray-300 dark:text-slate-600 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <IoArrowBackOutline className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
            Forgot Password?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 dark:text-slate-500">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AppInput
            type="email"
            name="email"
            label="Email Address"
            placeholder="Enter your registered email"
            value={email}
            onChange={handleInputChange}
            icon={<IoMailOutline />}
            error={error}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Reset Link...
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <IoArrowBackOutline className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;