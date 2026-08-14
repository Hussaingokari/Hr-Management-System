'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

const EyeIcon = ({ show, toggle }) => (
  <button
    type="button"
    onClick={toggle}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
  >
    {show ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export default function EmployeeLogin() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password,
        loginType: 'EMPLOYEE',
      });

      const data = res.data.data;

      dispatch(
        loginSuccess({
          token: data.accessToken,
          user: data,
        })
      );

      toast.success('Welcome ' + data.name + '!', {
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '10px',
        },
      });

      router.push('/employee/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormFilled = form.email && form.password;

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-[#0B1120] transition-colors duration-500">

      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-slate-900 dark:bg-black relative">

        <div className="flex-1 relative overflow-hidden">

          {/* Unsplash Image */}
          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
            alt="Team Working"
            className="absolute inset-0 w-full h-full object-cover opacity-90 dark:opacity-40"
          />

          {/* Green separator line */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] dark:bg-[#ccf000] z-10 transition-colors" />

        </div>

        <div className="h-auto p-12 lg:px-16 lg:py-14 flex flex-col justify-center bg-[#111827] dark:bg-[#0B1120] border-t dark:border-slate-800 border-transparent">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-8 h-8 rounded bg-transparent border-2 border-[#10b981] dark:border-[#ccf000] flex items-center justify-center transition-colors">
              <span className="text-[#10b981] dark:text-[#ccf000] font-bold text-lg leading-none">
                H
              </span>
            </div>

            <span className="text-white font-bold text-[17px] tracking-tight">
              Saiteja Infotech Private Limited - Employee
            </span>

          </div>

          <h1 className="text-white text-4xl xl:text-5xl font-bold leading-[1.1] mb-4 tracking-tight">
            Let's empower your
            <br />
            <span className="dark:text-[#ccf000] text-white">
              employees
            </span>{' '}
            today.
          </h1>

          <p className="text-slate-400 text-[13px] font-medium max-w-sm">
            We help to complete all your conveyancing needs easily
          </p>

        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center relative p-8">

        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-8 left-8 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          Back
        </button>

        <div className="w-full max-w-sm xl:max-w-md flex flex-col pt-12 -translate-y-14">

          {/* Arrow Graphic */}
          <div className="w-full flex justify-start mb-4 opacity-70">
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              className="text-slate-300 dark:text-slate-700 transform -rotate-12 translate-x-4"
            >
              <path
                d="M20,60 Q50,20 80,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <path
                d="M72,30 L80,40 L68,44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-8 text-center">
            Login first to{' '}
            <span className="dark:text-[#ccf000]">
              your account
            </span>
          </h2>

          {error && (
            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 mb-6 flex items-center gap-3">

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </span>

            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="emp-email"
                className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email Address{' '}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="emp-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Input your registered email"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="emp-password"
                className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password{' '}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">

                <input
                  id="emp-password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Input your password account"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                />

                <EyeIcon
                  show={showPassword}
                  toggle={() =>
                    setShowPassword(!showPassword)
                  }
                />

              </div>
            </div>

            {/* Remember / Forgot Password */}
            <div className="flex items-center justify-between mt-1 mb-2">

              <label className="flex items-center gap-2 cursor-pointer">

                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#10b981] dark:text-[#ccf000] focus:ring-[#10b981] dark:focus:ring-[#ccf000] dark:bg-slate-800"
                />

                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Remember Me
                </span>

              </label>

              <button
                type="button"
                onClick={() =>
                  router.push('/forgot-password')
                }
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000] transition-colors"
              >
                Forgot Password
              </button>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !isFormFilled}
              className={`w-full py-3 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                isFormFilled
                  ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] dark:shadow-none'
                  : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>

                  Loading...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Google / Apple login removed */}

          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full px-6 xl:px-12 flex flex-col xl:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">

          <div className="flex flex-col text-center xl:text-left">

            <span className="font-semibold text-slate-500 uppercase tracking-wider">
              © 2025 Saiteja Infotech Private Limited.
            </span>

            <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              All rights reserved.
            </span>

          </div>

          <div className="flex gap-6 items-center">

            <Link
              href="/terms"
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/privacy"
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
            >
              Privacy Policy
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}