'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ============================================================
   CONSTANTS
============================================================ */

const LOCK_FALLBACK_SECONDS = 120;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

/* ============================================================
   ICONS
============================================================ */

const EyeIcon = ({ show, toggle }) => (
  <button
    type="button"
    onClick={toggle}
<<<<<<< HEAD
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
=======
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
    aria-label={show ? 'Hide password' : 'Show password'}
    tabIndex={0}
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
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
<<<<<<< HEAD
=======
        aria-hidden="true"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
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
<<<<<<< HEAD
=======
        aria-hidden="true"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
      >
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

<<<<<<< HEAD
const ClockIcon = ({ size = 13 }) => (
=======
const ClockIcon = ({ size = 14 }) => (
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
<<<<<<< HEAD
=======
    aria-hidden="true"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

<<<<<<< HEAD
function extractLockoutMinutes(message) {
  if (!message) return null;

  const match = message.match(/(\d+)\s*minute/i);

  return match ? parseInt(match[1], 10) : null;
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');

  const s = (totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${m}:${s}`;
=======
const OtpIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 9h.01" />
    <path d="M11 9h6" />
    <path d="M7 13h.01" />
    <path d="M11 13h6" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
);

const ErrorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ============================================================
   HELPERS
============================================================ */

function normalizeEmail(email) {
  return typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';
}

function extractMessage(responseData, fallback) {
  if (!responseData) {
    return fallback;
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  return (
    responseData?.message ||
    responseData?.error ||
    responseData?.data?.message ||
    fallback
  );
}

function extractLockoutSeconds(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const minuteMatch = message.match(
    /(\d+)\s*(?:minute|minutes|min|mins)/i
  );

  if (minuteMatch) {
    const minutes = Number.parseInt(minuteMatch[1], 10);

    if (Number.isFinite(minutes) && minutes > 0) {
      return minutes * 60;
    }
  }

  const secondMatch = message.match(
    /(\d+)\s*(?:second|seconds|sec|secs)/i
  );

  if (secondMatch) {
    const seconds = Number.parseInt(secondMatch[1], 10);

    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds;
    }
  }

  return null;
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Math.floor(Number(totalSeconds) || 0)
  );

  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');

  const seconds = (safeSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
}

function isOtpRequiredResponse(responseData) {
  return (
    responseData?.otpRequired === true ||
    responseData?.requiresOtp === true ||
    responseData?.data?.otpRequired === true ||
    responseData?.data?.requiresOtp === true
  );
}

/* ============================================================
   EMPLOYEE LOGIN
============================================================ */

export default function EmployeeLogin() {
  const router = useRouter();
  const dispatch = useDispatch();

<<<<<<< HEAD
=======
  /* ==========================================================
     FORM
  ========================================================== */

>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
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
     ACCOUNT LOCK
  ========================================================== */

  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [lockedSecondsLeft, setLockedSecondsLeft] = useState(0);

  const isLocked = lockedSecondsLeft > 0;

  /* ==========================================================
     OTP
  ========================================================== */

  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);

  /* ==========================================================
     FORM STATE
  ========================================================== */

  const isFormFilled = useMemo(
    () =>
      normalizeEmail(form.email).length > 0 &&
      form.password.length > 0,
    [form.email, form.password]
  );

  /* ==========================================================
     CLEAR LOCK COUNTDOWN
  ========================================================== */

  useEffect(() => {
    if (!lockExpiresAt) {
      setLockedSecondsLeft(0);
      return undefined;
    }

    const updateLockCountdown = () => {
      const remaining = Math.ceil(
        (lockExpiresAt - Date.now()) / 1000
      );

      if (remaining <= 0) {
        setLockedSecondsLeft(0);
        setLockExpiresAt(null);
        setError('');
        return;
      }

      setLockedSecondsLeft(remaining);
    };

    updateLockCountdown();

    const interval = window.setInterval(
      updateLockCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [lockExpiresAt]);

  /* ==========================================================
     OTP COUNTDOWN
  ========================================================== */

  useEffect(() => {
    if (!otpExpiresAt) {
      setOtpSecondsLeft(0);
      return undefined;
    }

    const updateOtpCountdown = () => {
      const remaining = Math.ceil(
        (otpExpiresAt - Date.now()) / 1000
      );

      if (remaining <= 0) {
        setOtpSecondsLeft(0);
        setOtpExpiresAt(null);
        return;
      }

      setOtpSecondsLeft(remaining);
    };

    updateOtpCountdown();

    const interval = window.setInterval(
      updateOtpCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [otpExpiresAt]);

  /* ==========================================================
     INPUT CHANGE
  ========================================================== */

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
  }, []);

  /* ==========================================================
     SHOW OTP MODE
  ========================================================== */

  const openOtpMode = useCallback(() => {
    setOtpMode(true);
    setOtp('');
    setOtpSent(false);
    setOtpExpiresAt(null);
    setOtpSecondsLeft(0);
    setError('');
  }, []);

  /* ==========================================================
     SUCCESSFUL LOGIN
  ========================================================== */

  const completeLogin = useCallback(
    (data) => {
      if (!data?.accessToken) {
        setError(
          'Login succeeded, but the server did not return an access token.'
        );
        return false;
      }

      dispatch(
        loginSuccess({
          token: data.accessToken,
          user: data,
        })
      );

      toast.success(`Welcome ${data.name || 'Employee'}!`, {
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '10px',
        },
      });

      router.replace('/employee/dashboard');

      return true;
    },
    [dispatch, router]
  );

  /* ==========================================================
     PASSWORD LOGIN
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || otpLoading || isLocked || otpMode) {
      return;
    }
<<<<<<< HEAD

    countdownRef.current = setInterval(() => {
      setLockedSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setError('');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [lockedSecondsLeft > 0]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (!isLocked) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) return;
=======

    const email = normalizeEmail(form.email);
    const password = form.password;

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

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

<<<<<<< HEAD
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
=======
      const responseData = response?.data;
      const data = responseData?.data;

      /* --------------------------------------------------------
         OTP REQUIRED
      -------------------------------------------------------- */
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

      if (isOtpRequiredResponse(responseData)) {
        openOtpMode();

        setError(
          'For your security, OTP verification is required.'
        );

        return;
      }

      /* --------------------------------------------------------
         SUCCESS
      -------------------------------------------------------- */

      if (!completeLogin(data)) {
        return;
      }
    } catch (err) {
<<<<<<< HEAD
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        'Invalid email or password';

      if (status === 423) {
        const minutes = extractLockoutMinutes(message);

        if (minutes) {
          setLockedSecondsLeft(minutes * 60);
        }

        setError(message);
      } else {
        setError(message);
=======
      const status = err?.response?.status ?? null;
      const responseData = err?.response?.data ?? null;

      const backendMessage = extractMessage(
        responseData,
        'Unable to login. Please try again.'
      );

      /* --------------------------------------------------------
         NETWORK ERROR
      -------------------------------------------------------- */

      if (!err?.response) {
        setError(
          'Unable to connect to the HRMS server. Please try again later.'
        );

        toast.error('Unable to connect to HRMS server.');

        return;
      }

      /* --------------------------------------------------------
         400
      -------------------------------------------------------- */

      if (status === 400) {
        setError(
          backendMessage ||
          'Invalid login request. Please check your details.'
        );

        return;
      }

      /* --------------------------------------------------------
         401
      -------------------------------------------------------- */

      if (status === 401) {
        setError(
          backendMessage || 'Invalid email or password.'
        );

        return;
      }

      /* --------------------------------------------------------
         403
      -------------------------------------------------------- */

      if (status === 403) {
        setError(
          backendMessage ||
          'You are not authorized to use the Employee portal.'
        );

        return;
      }

      /* --------------------------------------------------------
         423 ACCOUNT LOCKED
      -------------------------------------------------------- */

      if (status === 423) {
        const seconds =
          extractLockoutSeconds(backendMessage) ??
          LOCK_FALLBACK_SECONDS;

        setLockExpiresAt(
          Date.now() + seconds * 1000
        );

        setLockedSecondsLeft(seconds);
        setError('');

        toast.error('Account temporarily locked.');

        return;
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
      }

      /* --------------------------------------------------------
         428 OTP REQUIRED
      -------------------------------------------------------- */

      if (
        status === 428 ||
        isOtpRequiredResponse(responseData)
      ) {
        openOtpMode();

        setError(
          'For your security, OTP verification is required.'
        );

        return;
      }

      /* --------------------------------------------------------
         429 TOO MANY REQUESTS
      -------------------------------------------------------- */

      if (status === 429) {
        setError(
          backendMessage ||
          'Too many requests. Please wait and try again.'
        );

        return;
      }

      /* --------------------------------------------------------
         5XX
      -------------------------------------------------------- */

      if (status >= 500) {
        setError(
          'The HRMS server is temporarily unavailable. Please try again later.'
        );

        return;
      }

      /* --------------------------------------------------------
         DEFAULT
      -------------------------------------------------------- */

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     SEND LOGIN OTP
  ========================================================== */

  const handleSendOtp = async () => {
    if (
      otpLoading ||
      otpSecondsLeft > 0 ||
      isLocked
    ) {
      return;
    }

    const email = normalizeEmail(form.email);

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

      const responseData = response?.data;

      if (responseData?.success === false) {
        throw new Error(
          extractMessage(
            responseData,
            'Unable to send login OTP.'
          )
        );
      }

      setOtpSent(true);
      setOtp('');
      setOtpExpiresAt(
        Date.now() +
        OTP_RESEND_COOLDOWN_SECONDS * 1000
      );
      setOtpSecondsLeft(
        OTP_RESEND_COOLDOWN_SECONDS
      );

      toast.success(
        'Login OTP sent to your registered email.'
      );
    } catch (err) {
      const status = err?.response?.status ?? null;
      const responseData = err?.response?.data ?? null;

      if (!err?.response) {
        setError(
          err?.message ||
          'Unable to connect to the HRMS server.'
        );

        return;
      }

      const backendMessage = extractMessage(
        responseData,
        'Unable to send login OTP. Please try again.'
      );

      if (status === 400) {
        setError(backendMessage);
        return;
      }

      if (status === 401) {
        setError(
          'Unable to verify this account. Please login again.'
        );
        return;
      }

      if (status === 403) {
        setError(
          backendMessage ||
          'You are not authorized to request a login OTP.'
        );
        return;
      }

      if (status === 404) {
        setError(
          'Unable to process the OTP request.'
        );
        return;
      }

      if (status === 429) {
        setError(
          backendMessage ||
          'Too many OTP requests. Please wait before trying again.'
        );
        return;
      }

      if (status >= 500) {
        setError(
          'The HRMS server is temporarily unavailable. Please try again later.'
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

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (otpLoading) {
      return;
    }

    const email = normalizeEmail(form.email);
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

      const responseData = response?.data;
      const data = responseData?.data;

      if (!data?.accessToken) {
        setError(
          'OTP verification succeeded, but the server did not return an access token.'
        );

        return;
      }

      completeLogin(data);
    } catch (err) {
      const status = err?.response?.status ?? null;
      const responseData = err?.response?.data ?? null;

      if (!err?.response) {
        setError(
          'Unable to connect to the HRMS server. Please try again.'
        );

        return;
      }

      const backendMessage = extractMessage(
        responseData,
        'Invalid or expired OTP.'
      );

      if (status === 400) {
        setError(
          backendMessage || 'Invalid OTP.'
        );

        setOtp('');
        return;
      }

      if (status === 401) {
        setError(
          backendMessage || 'Invalid or expired OTP.'
        );

        setOtp('');
        return;
      }

      if (status === 403) {
        setError(
          backendMessage ||
          'OTP verification is not allowed for this account.'
        );

        return;
      }

      if (status === 404) {
        setError(
          'Unable to process OTP verification.'
        );

        return;
      }

      if (status === 410) {
        setError(
          backendMessage ||
          'This OTP has expired. Please request a new OTP.'
        );

        setOtp('');
        return;
      }

      if (status === 429) {
        setError(
          backendMessage ||
          'Too many OTP verification attempts. Please wait and try again.'
        );

        setOtp('');
        return;
      }

      if (status >= 500) {
        setError(
          'The HRMS server is temporarily unavailable. Please try again later.'
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
    if (otpLoading) {
      return;
    }

    setOtpMode(false);
    setOtp('');
    setOtpSent(false);
    setOtpExpiresAt(null);
    setOtpSecondsLeft(0);
    setError('');
  };

  /* ==========================================================
     BACK TO HOME
  ========================================================== */

  const handleBack = () => {
    if (loading || otpLoading) {
      return;
    }

    router.push('/');
  };

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
            alt="Professional team working together"
            className="absolute inset-0 w-full h-full object-cover opacity-90 dark:opacity-40"
          />

<<<<<<< HEAD
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] dark:bg-[#ccf000] z-10 transition-colors" />

=======
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] dark:bg-[#ccf000] z-10" />
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
        </div>

        <div className="h-auto p-12 lg:px-16 lg:py-14 flex flex-col justify-center bg-[#111827] dark:bg-[#0B1120] border-t dark:border-slate-800 border-transparent">

          <div className="flex items-center gap-3 mb-6">

<<<<<<< HEAD
            {/* Company Logo */}
            <div className="w-19 h-19 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/removee.png"
                alt="Saiteja Infotech"
                className="w-19 h-19 object-contain"
              />
=======
            <div className="w-8 h-8 rounded border-2 border-[#10b981] dark:border-[#ccf000] flex items-center justify-center">
              <span className="text-[#10b981] dark:text-[#ccf000] font-bold text-lg leading-none">
                H
              </span>
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
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

          <p className="text-slate-400 text-[13px] font-medium max-w-sm leading-relaxed">
            Manage your employee experience securely and efficiently with HRMS.
          </p>

        </div>
      </div>

      {/* ======================================================
          RIGHT PANEL
      ====================================================== */}

      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center relative p-8">

<<<<<<< HEAD
        {/* Back Button */}
=======
        {/* BACK */}

>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
        <button
          type="button"
          onClick={handleBack}
          disabled={loading || otpLoading}
          className="absolute top-8 left-8 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
<<<<<<< HEAD
=======
            aria-hidden="true"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          Back
        </button>

        <div className="w-full max-w-sm xl:max-w-md flex flex-col pt-12 -translate-y-4">

          {/* TOP ICON */}

          {/* Arrow Graphic */}
          <div className="w-full flex justify-start mb-4 opacity-70">

            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              className="text-slate-300 dark:text-slate-700 transform -rotate-12 translate-x-4"
<<<<<<< HEAD
=======
              aria-hidden="true"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
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

<<<<<<< HEAD
          {/* Heading */}
          <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-8 text-center">
            Login first to{' '}
            <span className="dark:text-[#ccf000]">
              your account
            </span>
          </h2>

          {/* Error Message */}
          {error && !isLocked && (
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
=======
          {/* TITLE */}

          <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-8 text-center">

            {otpMode ? (
              <>
                Verify your{' '}
                <span className="dark:text-[#ccf000]">
                  identity
                </span>
              </>
            ) : (
              <>
                Login first to{' '}
                <span className="dark:text-[#ccf000]">
                  your account
                </span>
              </>
            )}

          </h2>

          {/* ERROR */}

          {error && !isLocked && (
            <div
              role="alert"
              className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 mb-6 flex items-start gap-3"
            >

              <span className="text-red-500 shrink-0 mt-0.5">
                <ErrorIcon />
              </span>

              <span className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
                {error}
              </span>

            </div>
          )}

<<<<<<< HEAD
          {/* Locked Notice */}
          {isLocked && (
            <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-6 flex items-center justify-between gap-3">
=======
          {/* LOCKED NOTICE */}

          {isLocked && (
            <div
              role="alert"
              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-6 flex items-center justify-between gap-3"
            >
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

              <div className="flex items-center gap-2.5 min-w-0">

                <span className="w-7 h-7 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
                  <ClockIcon />
                </span>

                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-snug">
                  Sign-in is temporarily disabled after multiple failed attempts.
                </span>

              </div>

              <span className="text-[13px] font-mono font-bold tabular-nums text-slate-700 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 shrink-0">
                {formatCountdown(lockedSecondsLeft)}
              </span>

            </div>
          )}

<<<<<<< HEAD
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
                disabled={isLocked}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Input your password account"
                  required
                  disabled={isLocked}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                />

                {!isLocked && (
                  <EyeIcon
                    show={showPassword}
                    toggle={() =>
                      setShowPassword(!showPassword)
                    }
                  />
                )}

              </div>

            </div>

            {/* Remember / Forgot Password */}
            <div className="flex items-center justify-between mt-1 mb-2">

              <label className="flex items-center gap-2 cursor-pointer">
=======
          {/* ==================================================
              OTP MODE
          ================================================== */}

          {otpMode ? (

            <form
              onSubmit={handleVerifyOtp}
              className="w-full flex flex-col gap-5"
              noValidate
            >

              {/* OTP INFORMATION */}

              <div className="rounded-lg border border-emerald-100 dark:border-slate-700 bg-emerald-50 dark:bg-slate-800/50 p-4">

                <div className="flex items-start gap-3">

                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-[#ccf000] shrink-0">
                    <OtpIcon />
                  </div>

                  <div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-white">
                      OTP verification required
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You have reached the login attempt limit. Verify the OTP sent to your registered email to continue.
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
                  Email Address
                </label>
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

                <input
                  id="otp-email"
                  type="email"
                  value={normalizeEmail(form.email)}
                  disabled
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[13px] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />

<<<<<<< HEAD
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Remember Me
                </span>

              </label>
=======
              </div>

              {/* SEND OTP */}

              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full py-3 rounded-lg text-[13px] font-bold bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {otpLoading ? (
                    <>
                      <Spinner />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
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
                      Enter OTP
                    </label>

                    <input
                      id="login-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        const value = event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6);

                        setOtp(value);
                        setError('');
                      }}
                      placeholder="Enter 6-digit OTP"
                      disabled={otpLoading}
                      aria-label="6-digit login OTP"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[16px] text-center tracking-[0.5em] font-bold focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:opacity-60"
                    />

                  </div>

                  {/* VERIFY */}

                  <button
                    type="submit"
                    disabled={
                      otpLoading ||
                      otp.length !== 6
                    }
                    className={`w-full py-3 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${otp.length === 6
                        ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300]'
                        : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                  >

                    {otpLoading ? (
                      <>
                        <Spinner />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP & Login'
                    )}

                  </button>

                  {/* RESEND */}

                  <div className="text-center">

                    {otpSecondsLeft > 0 ? (
                      <p className="text-[11px] text-slate-400">

                        Resend OTP in{' '}

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

              {/* BACK TO PASSWORD */}
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

              <button
                type="button"
                onClick={handleBackToPasswordLogin}
                disabled={otpLoading}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                ← Back to password login
              </button>
<<<<<<< HEAD

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !isFormFilled || isLocked}
              className={`w-full py-3 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                isLocked
                  ? 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : isFormFilled
                    ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] dark:shadow-none'
                    : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >

              {isLocked ? (
                <>
                  <ClockIcon />
                  Try again in {formatCountdown(lockedSecondsLeft)}
                </>
              ) : loading ? (
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

          </form>
=======

            </form>

          ) : (

            /* ==================================================
               NORMAL LOGIN
            ================================================== */

            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-5"
              noValidate
            >

              {/* EMAIL */}

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
                  autoComplete="email"
                  required
                  disabled={isLocked || loading}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                />

              </div>

              {/* PASSWORD */}

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
                    placeholder="Input your password"
                    autoComplete="current-password"
                    required
                    disabled={isLocked || loading}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  />

                  {!isLocked && !loading && (
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

              <div className="flex items-center justify-between mt-1 mb-2">

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="checkbox"
                    disabled={isLocked || loading}
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
                  disabled={loading || isLocked}
                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000] transition-colors disabled:opacity-50"
                >
                  Forgot Password
                </button>

              </div>

              {/* LOGIN */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !isFormFilled ||
                  isLocked
                }
                className={`w-full py-3 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${isLocked
                    ? 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : isFormFilled && !loading
                      ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] dark:shadow-none'
                      : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
              >

                {isLocked ? (
                  <>
                    <ClockIcon />
                    Try again in{' '}
                    {formatCountdown(
                      lockedSecondsLeft
                    )}
                  </>
                ) : loading ? (
                  <>
                    <Spinner />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}

              </button>

            </form>
          )}
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc

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
<<<<<<< HEAD
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
=======
              className="hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider transition-colors"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
            >
              Terms & Conditions
            </Link>

            <Link
              href="/privacy"
<<<<<<< HEAD
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
=======
              className="hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider transition-colors"
>>>>>>> b9d88df9807eef38df88f5028ac258e93fd17cdc
            >
              Privacy Policy
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}