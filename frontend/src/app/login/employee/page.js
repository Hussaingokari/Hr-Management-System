'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ============================================================
   EYE ICON
============================================================ */

const EyeIcon = ({ show, toggle }) => (
  <button
    type="button"
    onClick={toggle}
    aria-label={show ? 'Hide password' : 'Show password'}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
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
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

/* ============================================================
   CLOCK ICON
============================================================ */

const ClockIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

/* ============================================================
   OTP ICON
============================================================ */

const OtpIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 9h.01" />
    <path d="M11 9h6" />
    <path d="M7 13h.01" />
    <path d="M11 13h6" />
  </svg>
);

/* ============================================================
   LOCK ICON
============================================================ */

const LockIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </svg>
);

/* ============================================================
   SHIELD ICON
============================================================ */

const ShieldIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/* ============================================================
   HELPERS
============================================================ */

function extractLockoutSeconds(message) {
  if (!message) {
    return null;
  }

  const minuteMatch = message.match(/(\d+)\s*minute/i);

  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10) * 60;
  }

  const secondMatch = message.match(/(\d+)\s*second/i);

  if (secondMatch) {
    return parseInt(secondMatch[1], 10);
  }

  return null;
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);

  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');

  const seconds = (safeSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

/* ============================================================
   EMPLOYEE LOGIN
============================================================ */

export default function EmployeeLogin() {
  const router = useRouter();
  const dispatch = useDispatch();

  /* ==========================================================
     LOGIN FORM
  ========================================================== */

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  /* ==========================================================
     GENERAL STATE
  ========================================================== */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ==========================================================
     TEMPORARY LOCK
  ========================================================== */

  const [lockedSecondsLeft, setLockedSecondsLeft] = useState(0);

  const countdownRef = useRef(null);

  const isLocked = lockedSecondsLeft > 0;

  /* ==========================================================
     OTP STATE
  ========================================================== */

  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);

  const otpCountdownRef = useRef(null);

  /* ==========================================================
     LOCK COUNTDOWN
  ========================================================== */

  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (lockedSecondsLeft <= 0) {
      return;
    }

    countdownRef.current = setInterval(() => {
      setLockedSecondsLeft((previous) => {
        if (previous <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [lockedSecondsLeft > 0]);

  /* ==========================================================
     CLEAR LOCK MESSAGE
  ========================================================== */

  useEffect(() => {
    if (lockedSecondsLeft === 0) {
      setError((previous) => {
        if (previous === 'Account temporarily locked.') {
          return '';
        }

        return previous;
      });
    }
  }, [lockedSecondsLeft]);

  /* ==========================================================
     OTP COUNTDOWN
  ========================================================== */

  useEffect(() => {
    if (otpCountdownRef.current) {
      clearInterval(otpCountdownRef.current);
      otpCountdownRef.current = null;
    }

    if (otpSecondsLeft <= 0) {
      return;
    }

    otpCountdownRef.current = setInterval(() => {
      setOtpSecondsLeft((previous) => {
        if (previous <= 1) {
          if (otpCountdownRef.current) {
            clearInterval(otpCountdownRef.current);
            otpCountdownRef.current = null;
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (otpCountdownRef.current) {
        clearInterval(otpCountdownRef.current);
        otpCountdownRef.current = null;
      }
    };
  }, [otpSecondsLeft > 0]);

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
  };

  /* ==========================================================
     NORMAL LOGIN
  ========================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || otpLoading || isLocked || otpMode) {
      return;
    }

    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(
        '/api/auth/login',
        {
          email,
          password,
          loginType: 'EMPLOYEE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const responseData = response.data;
      const data = responseData?.data;

      /* ======================================================
         OTP REQUIRED
      ====================================================== */

      if (
        responseData?.requiresOtp === true ||
        responseData?.otpRequired === true ||
        data?.requiresOtp === true ||
        data?.otpRequired === true
      ) {
        setOtpMode(true);
        setOtp('');
        setOtpSent(false);
        setOtpSecondsLeft(0);
        setError('');

        return;
      }

      /* ======================================================
         SUCCESS
      ====================================================== */

      if (!data?.accessToken) {
        setError(
          responseData?.message ||
          'Invalid login response from server.'
        );

        return;
      }

      dispatch(
        loginSuccess({
          token: data.accessToken,
          user: data,
        })
      );

      toast.success(`Welcome ${data.name || 'Employee'}!`, {
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '10px',
        },
      });

      router.push('/employee/dashboard');
    } catch (err) {
      const status = err?.response?.status ?? null;
      const responseData = err?.response?.data ?? null;

      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.data?.message ||
        err?.message ||
        'Unable to login. Please try again.';

      /* ======================================================
         NETWORK ERROR
      ====================================================== */

      if (!err?.response) {
        setError(
          'Unable to connect to the HRMS server. Please make sure the backend is running.'
        );

        toast.error('Cannot connect to HRMS server.');

        return;
      }

      /* ======================================================
         OTP REQUIRED
      ====================================================== */

      if (
        status === 428 ||
        responseData?.otpRequired === true ||
        responseData?.requiresOtp === true ||
        responseData?.data?.otpRequired === true ||
        responseData?.data?.requiresOtp === true
      ) {
        setOtpMode(true);
        setOtp('');
        setOtpSent(false);
        setOtpSecondsLeft(0);
        setError('');

        return;
      }

      /* ======================================================
         LOCKED
      ====================================================== */

      if (status === 423) {
        const lockSeconds = extractLockoutSeconds(
          backendMessage
        );

        setLockedSecondsLeft(
          lockSeconds && lockSeconds > 0
            ? lockSeconds
            : 120
        );

        setError('');

        toast.error('Account temporarily locked.');

        return;
      }

      /* ======================================================
         400
      ====================================================== */

      if (status === 400) {
        setError(
          backendMessage ||
          'Invalid login request.'
        );

        return;
      }

      /* ======================================================
         401
      ====================================================== */

      if (status === 401) {
        setError(
          backendMessage ||
          'Invalid email or password.'
        );

        return;
      }

      /* ======================================================
         403
      ====================================================== */

      if (status === 403) {
        setError(
          backendMessage ||
          'You are not allowed to login from the Employee portal.'
        );

        return;
      }

      /* ======================================================
         500
      ====================================================== */

      if (status >= 500) {
        setError(
          backendMessage ||
          'Internal server error. Please try again later.'
        );

        return;
      }

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     SEND OTP
  ========================================================== */

  const handleSendOtp = async () => {
    if (otpLoading || otpSecondsLeft > 0) {
      return;
    }

    const email = form.email.trim();

    if (!email) {
      setError(
        'Please enter your registered email address.'
      );

      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await api.post(
        '/api/auth/login/send-otp',
        {
          email,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const responseData = response.data;

      if (responseData?.success === false) {
        throw new Error(
          responseData?.message ||
          'Unable to send login OTP.'
        );
      }

      setOtpSent(true);
      setOtp('');
      setOtpSecondsLeft(60);

      toast.success(
        'Login OTP sent to your registered email.'
      );
    } catch (err) {
      const responseData = err?.response?.data ?? null;

      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.data?.message ||
        err?.message ||
        'Unable to send login OTP. Please try again.';

      if (!err?.response) {
        setError(
          'Unable to connect to the HRMS server.'
        );

        return;
      }

      setError(backendMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  /* ==========================================================
     VERIFY OTP
  ========================================================== */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otpLoading) {
      return;
    }

    const email = form.email.trim();
    const enteredOtp = otp.trim();

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (!enteredOtp) {
      setError('Please enter the OTP.');
      return;
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await api.post(
        '/api/auth/login/verify-otp',
        {
          email,
          otp: enteredOtp,
          loginType: 'EMPLOYEE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const responseData = response.data;
      const data = responseData?.data;

      if (!data?.accessToken) {
        setError(
          responseData?.message ||
          'OTP verification succeeded, but no access token was returned.'
        );

        return;
      }

      dispatch(
        loginSuccess({
          token: data.accessToken,
          user: data,
        })
      );

      toast.success(
        `Welcome ${data.name || 'Employee'}!`,
        {
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '10px',
          },
        }
      );

      router.push('/employee/dashboard');
    } catch (err) {
      const responseData = err?.response?.data ?? null;

      const backendMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.data?.message ||
        err?.message ||
        'Invalid or expired OTP.';

      if (!err?.response) {
        setError(
          'Unable to connect to the HRMS server.'
        );

        return;
      }

      setError(backendMessage);
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  };

  /* ==========================================================
     BACK TO PASSWORD LOGIN
  ========================================================== */

  const handleBackToPasswordLogin = () => {
    setOtpMode(false);
    setOtp('');
    setOtpSent(false);
    setOtpSecondsLeft(0);
    setError('');
  };

  const isFormFilled =
    form.email.trim() !== '' &&
    form.password.trim() !== '';

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-[#0B1120] transition-colors duration-500">

      {/* ======================================================
          LEFT PANEL
      ====================================================== */}

      <div className="hidden lg:flex lg:w-[45%] flex-col bg-slate-900 dark:bg-black relative">

        <div className="flex-1 relative overflow-hidden">

          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
            alt="Team Working"
            className="absolute inset-0 w-full h-full object-cover opacity-90 dark:opacity-40"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] dark:bg-[#ccf000] z-10" />

        </div>

        <div className="p-12 lg:px-16 lg:py-14 bg-[#111827] dark:bg-[#0B1120] border-t dark:border-slate-800">

          <div className="flex items-center gap-3 mb-6">

              {/* Company Logo */}
            <div className="w-[73px] h-[73px] flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/removee.png"
                alt="Saiteja Infotech"
                className="w-[73px] h-[73px] object-contain"
              />
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
            Securely access your employee workspace and manage your work with ease.
          </p>

        </div>

      </div>

      {/* ======================================================
          RIGHT PANEL
      ====================================================== */}

      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center relative p-8">

        {/* BACK */}

        <button
          type="button"
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

        <div className="w-full max-w-sm xl:max-w-md flex flex-col">

          {/* ==================================================
              TOP ICON
          ================================================== */}

          <div className="flex justify-center mb-5">

            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#ccf000]/10 border border-emerald-100 dark:border-[#ccf000]/20 flex items-center justify-center text-[#10b981] dark:text-[#ccf000]">

              {otpMode ? (
                <ShieldIcon size={24} />
              ) : isLocked ? (
                <LockIcon size={24} />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                </svg>
              )}

            </div>

          </div>

          {/* ==================================================
              TITLE
          ================================================== */}

          <h2 className="text-[25px] font-bold text-slate-900 dark:text-white text-center tracking-tight">

            {isLocked ? (
              <>
                Account temporarily{' '}
                <span className="dark:text-[#ccf000]">
                  locked
                </span>
              </>
            ) : otpMode ? (
              <>
                Verify your{' '}
                <span className="dark:text-[#ccf000]">
                  identity
                </span>
              </>
            ) : (
              <>
                Login to{' '}
                <span className="dark:text-[#ccf000]">
                  your account
                </span>
              </>
            )}

          </h2>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-2 mb-7">

            {isLocked
              ? 'Your account has been temporarily protected after multiple failed attempts.'
              : otpMode
                ? 'Complete the verification step to securely access your account.'
                : 'Enter your registered employee credentials to continue.'}

          </p>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && !isLocked && (

            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3.5 mb-5 flex items-start gap-3">

              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <span className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                {error}
              </span>

            </div>

          )}

          {/* ==================================================
              LOCK SCREEN
          ================================================== */}

          {isLocked ? (

            <div className="w-full">

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6">

                <div className="text-center">

                  <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-slate-500 mb-3">
                    Try again in
                  </div>

                  <div className="text-5xl font-mono font-bold tracking-tight text-slate-800 dark:text-white">
                    {formatCountdown(lockedSecondsLeft)}
                  </div>

                  <div className="mt-4 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">

                    <div
                      className="h-full bg-[#10b981] dark:bg-[#ccf000] transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          100,
                          (lockedSecondsLeft / 120) * 100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">

                  <div className="flex items-start gap-3">

                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
                      <LockIcon size={15} />
                    </div>

                    <div>

                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Sign-in temporarily disabled
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        For your security, please wait until the timer expires before trying again.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          ) : otpMode ? (

            /* ==================================================
               OTP SCREEN
            ================================================== */

            <form
              onSubmit={handleVerifyOtp}
              className="w-full flex flex-col gap-5"
            >

              {/* OTP INFO */}

              <div className="rounded-xl border border-emerald-100 dark:border-slate-700 bg-emerald-50/70 dark:bg-slate-900/60 p-4">

                <div className="flex items-start gap-3">

                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-slate-800 flex items-center justify-center text-[#10b981] dark:text-[#ccf000] shrink-0">

                    <OtpIcon />

                  </div>

                  <div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-white">
                      Extra security verification
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      An OTP will be sent to your registered email address to confirm your identity.
                    </p>

                  </div>

                </div>

              </div>

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="otp-email"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Registered Email
                </label>

                <input
                  id="otp-email"
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[13px] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />

              </div>

              {/* SEND OTP */}

              {!otpSent && (

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full py-3.5 rounded-xl text-[13px] font-bold bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_5px_18px_rgba(16,185,129,0.18)] dark:shadow-none"
                >

                  {otpLoading ? (
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>

                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <OtpIcon size={17} />
                      Send OTP
                    </>
                  )}

                </button>

              )}

              {/* OTP INPUT */}

              {otpSent && (

                <>

                  <div>

                    <label
                      htmlFor="login-otp"
                      className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Enter Verification Code
                    </label>

                    <input
                      id="login-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6);

                        setOtp(value);
                        setError('');
                      }}
                      placeholder="000000"
                      className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[22px] text-center tracking-[0.55em] font-bold focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-2 focus:ring-[#10b981]/10 dark:focus:ring-[#ccf000]/10 transition-all text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-700"
                    />

                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Enter the 6-digit code sent to your email
                    </p>

                  </div>

                  {/* VERIFY */}

                  <button
                    type="submit"
                    disabled={
                      otpLoading ||
                      otp.length !== 6
                    }
                    className={`w-full py-3.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${otp.length === 6
                        ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-[0_5px_18px_rgba(16,185,129,0.18)] dark:shadow-none'
                        : 'bg-slate-100 dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                  >

                    {otpLoading ? (
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>

                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldIcon size={17} />
                        Verify & Login
                      </>
                    )}

                  </button>

                  {/* RESEND */}

                  <div className="text-center">

                    {otpSecondsLeft > 0 ? (

                      <p className="text-[11px] text-slate-400">

                        Didn't receive the code? Resend in{' '}

                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {otpSecondsLeft}s
                        </span>

                      </p>

                    ) : (

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-[11px] font-semibold text-[#10b981] dark:text-[#ccf000] hover:underline disabled:opacity-50"
                      >
                        Resend OTP
                      </button>

                    )}

                  </div>

                </>

              )}

              {/* BACK */}

              <button
                type="button"
                onClick={handleBackToPasswordLogin}
                disabled={otpLoading}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                ← Back to password login
              </button>

            </form>

          ) : (

            /* ==================================================
               NORMAL LOGIN
            ================================================== */

            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="emp-email"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address
                  <span className="text-red-500 ml-1">
                    *
                  </span>
                </label>

                <input
                  id="emp-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  required
                  disabled={isLocked}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-2 focus:ring-[#10b981]/10 dark:focus:ring-[#ccf000]/10 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 disabled:cursor-not-allowed"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="emp-password"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                  <span className="text-red-500 ml-1">
                    *
                  </span>
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isLocked}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-2 focus:ring-[#10b981]/10 dark:focus:ring-[#ccf000]/10 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />

                  {!isLocked && (
                    <EyeIcon
                      show={showPassword}
                      toggle={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                    />
                  )}

                </div>

              </div>

              {/* REMEMBER / FORGOT */}

              <div className="flex items-center justify-between mt-0.5">

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="checkbox"
                    disabled={isLocked}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#10b981] dark:text-[#ccf000] focus:ring-[#10b981] dark:focus:ring-[#ccf000] dark:bg-slate-800 disabled:opacity-50"
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
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000] transition-colors"
                >
                  Forgot Password
                </button>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !isFormFilled ||
                  isLocked
                }
                className={`w-full py-3.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${isLocked
                    ? 'bg-slate-100 dark:bg-[#1E293B] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : isFormFilled
                      ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-[0_5px_18px_rgba(16,185,129,0.18)] dark:shadow-none'
                      : 'bg-slate-100 dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </>
                )}

              </button>

            </form>

          )}

        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

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
              className="hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider"
            >
              Privacy Policy
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}