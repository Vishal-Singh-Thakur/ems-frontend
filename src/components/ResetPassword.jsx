import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IoLockClosedOutline, IoArrowBackOutline, IoCheckmarkCircleOutline,
  IoEyeOutline, IoEyeOffOutline, IoAlertCircleOutline
} from 'react-icons/io5';
import ApiHit from '../Utils/ApiHit';
import { CheckResetTokenAPI, ResetPasswordAPI } from './Constant/Api/Api';
import { REGEX_PATTERNS, VALIDATION_MESSAGES } from '../Utils/regex';

// Where a reset link lands.
//
// The token is checked before the form is shown rather than after it is
// submitted, so an expired link says so immediately instead of after someone has
// typed a new password twice.

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [account, setAccount] = useState(null);   // { name, email } once the link checks out
  const [linkError, setLinkError] = useState('');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [show, setShow] = useState({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLinkError('This link is missing its token. Please request a new one.');
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const r = await ApiHit(CheckResetTokenAPI(token), 'GET');
        if (r?.success) setAccount(r.data);
        else setLinkError(r?.message || 'This link is no longer valid.');
      } catch {
        setLinkError('Could not reach the server. Please try again.');
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const validate = () => {
    const next = {};
    if (!form.password) next.password = VALIDATION_MESSAGES.required;
    else if (!REGEX_PATTERNS.password.test(form.password)) next.password = VALIDATION_MESSAGES.password;

    if (!form.confirmPassword) next.confirmPassword = VALIDATION_MESSAGES.required;
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Both passwords must match';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const r = await ApiHit(ResetPasswordAPI, 'POST', {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      if (r?.success) {
        setDone(true);
        // Straight to the login screen, because the server has just revoked
        // every session this account had — including any open in this browser.
        setTimeout(() => navigate('/login'), 2500);
      } else if (r?.code === 'RESET_TOKEN_INVALID') {
        setLinkError(r.message);
        setAccount(null);
      } else {
        setErrors({ password: r?.message || 'Could not change the password.' });
      }
    } catch {
      setErrors({ password: 'Could not reach the server. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-md w-full space-y-8 text-center">{children}</div>
    </div>
  );

  const backToLogin = (
    <Link
      to="/login"
      className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-full text-gray-300 bg-transparent hover:bg-gray-800 transition-all duration-200"
    >
      <IoArrowBackOutline className="mr-2 h-4 w-4" /> Back to sign in
    </Link>
  );

  if (checking) {
    return shell(<p className="text-gray-400">Checking your link…</p>);
  }

  if (done) {
    return shell(
      <>
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/20 p-4">
            <IoCheckmarkCircleOutline className="h-12 w-12 text-green-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">Password changed</h2>
          <p className="text-gray-400">
            Sign in with your new password. Anywhere you were already signed in has been
            signed out.
          </p>
        </div>
        {backToLogin}
      </>
    );
  }

  if (linkError) {
    return shell(
      <>
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-500/20 p-4">
            <IoAlertCircleOutline className="h-12 w-12 text-amber-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">This link no longer works</h2>
          <p className="text-gray-400">{linkError}</p>
        </div>
        <div className="space-y-4">
          <Link
            to="/forgot-password"
            className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
          >
            Request a new link
          </Link>
          {backToLogin}
        </div>
      </>
    );
  }

  const field = (name, label, placeholder) => (
    <div className="text-left">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type={show[name] ? 'text' : 'password'}
          value={form[name]}
          autoComplete="new-password"
          placeholder={placeholder}
          onChange={(e) => {
            setForm({ ...form, [name]: e.target.value });
            if (errors[name]) setErrors({ ...errors, [name]: '' });
          }}
          className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition ${
            errors[name] ? 'border-red-500' : 'border-gray-700'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [name]: !show[name] })}
          aria-label={show[name] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
        >
          {show[name] ? <IoEyeOffOutline className="h-5 w-5" /> : <IoEyeOutline className="h-5 w-5" />}
        </button>
      </div>
      {errors[name] && <p className="mt-1.5 text-sm text-red-400">{errors[name]}</p>}
    </div>
  );

  return shell(
    <>
      <div>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-500/20 p-4">
            <IoLockClosedOutline className="h-10 w-10 text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose a new password</h2>
        <p className="text-gray-400 text-sm">
          for <span className="text-white font-medium">{account?.email}</span>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {field('password', 'New password', 'At least 8 characters')}
        {field('confirmPassword', 'Confirm new password', 'Type it again')}

        <p className="text-xs text-gray-500 text-left">
          Use at least 8 characters with an uppercase letter, a lowercase letter, a number
          and a symbol.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {submitting ? 'Changing…' : 'Change password'}
        </button>

        {backToLogin}
      </form>
    </>
  );
};

export default ResetPassword;
