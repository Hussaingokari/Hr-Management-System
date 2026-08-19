'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Shield, Lock, Loader2 } from 'lucide-react';

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

export default function AdminSettingsPage() {
  const { user } = useSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changing, setChanging] = useState(false);

  // Password validation checks
  const validatePassword = (pwd) => {
    if (!pwd) {
      return {
        valid: false,
        checks: {}
      };
    }

    const hasMinimum8 = pwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z\d\s]/.test(pwd);

    const matchesPattern =
      hasMinimum8 &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial;

    return {
      valid: matchesPattern,
      checks: {
        minimum8: hasMinimum8,
        uppercase: hasUppercase,
        lowercase: hasLowercase,
        number: hasNumber,
        special: hasSpecial,
      }
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const metMatch =
    newPassword === confirmPassword &&
    confirmPassword !== '';

  const isPasswordValid = passwordValidation.valid;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword === currentPassword) {
      toast.error(
        'New password cannot be the same as the current password'
      );
      return;
    }

    if (!isPasswordValid) {
      toast.error(
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (!metMatch) {
      toast.error('New passwords do not match');
      return;
    }

    setChanging(true);

    try {
      await api.post('/api/auth/update-password', {
        email: user?.email,
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      toast.success('Password changed successfully!');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to change password'
      );
    } finally {
      setChanging(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 44px 12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: 'var(--card-bg)',
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}
        >
          Settings
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}
        >
          Manage your account settings
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}
      >

        {/* Profile Info */}
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '14px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--card-border)',
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Shield size={16} />

            <h3
              style={{
                fontSize: '15px',
                fontWeight: '700'
              }}
            >
              Admin Profile
            </h3>
          </div>

          <div style={{ padding: '20px' }}>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
                padding: '16px',
                background: 'var(--bg-primary)',
                borderRadius: '12px'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {user?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: 'var(--text-primary)'
                  }}
                >
                  {user?.name}
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {user?.email}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '2px'
                  }}
                >
                  {user?.employeeCode} · {user?.role}
                </div>
              </div>
            </div>

            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email Address', value: user?.email },
              { label: 'Employee Code', value: user?.employeeCode },
              { label: 'Role', value: user?.role },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </span>

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}
                >
                  {item.value || '—'}
                </span>
              </div>
            ))}

            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fdf4ff',
                borderRadius: '8px',
                border: '1px solid #e9d5ff'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#9333ea',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Shield size={14} />

                You have full system access as {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '14px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--card-border)',
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={16} />

            <h3
              style={{
                fontSize: '15px',
                fontWeight: '700'
              }}
            >
              Change Password
            </h3>
          </div>

          <div style={{ padding: '20px' }}>

            <form onSubmit={handleChangePassword}>

              {/* Current Password */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  Current Password *
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e =>
                      setCurrentPassword(e.target.value)
                    }
                    placeholder="Enter current password"
                    required
                    style={inputStyle}
                    onFocus={e =>
                      e.target.style.borderColor = '#1e3a5f'
                    }
                    onBlur={e =>
                      e.target.style.borderColor = '#e2e8f0'
                    }
                  />

                  <EyeIcon
                    show={showCurrent}
                    toggle={() =>
                      setShowCurrent(!showCurrent)
                    }
                  />
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  New Password
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Example: Hussainb@123"
                    required
                    style={inputStyle}
                    onFocus={e =>
                      e.target.style.borderColor = '#1e3a5f'
                    }
                    onBlur={e =>
                      e.target.style.borderColor = '#e2e8f0'
                    }
                  />

                  <EyeIcon
                    show={showNew}
                    toggle={() =>
                      setShowNew(!showNew)
                    }
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  Confirm New Password
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                    required
                    style={inputStyle}
                    onFocus={e =>
                      e.target.style.borderColor = '#1e3a5f'
                    }
                    onBlur={e =>
                      e.target.style.borderColor = '#e2e8f0'
                    }
                  />

                  <EyeIcon
                    show={showConfirm}
                    toggle={() =>
                      setShowConfirm(!showConfirm)
                    }
                  />
                </div>
              </div>

              {/* Password Rules */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  border: '1px solid var(--card-border)'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '8px'
                  }}
                >
                  Password Requirements:
                </div>

                {[
                  {
                    rule: 'Exactly 12 characters',
                    met: passwordValidation.checks.exact12
                  },
                  {
                    rule: 'First letter UPPERCASE',
                    met: passwordValidation.checks.uppercase
                  },
                  {
                    rule: '8 alphabets total',
                    met: passwordValidation.checks.alphabets
                  },
                  {
                    rule: '1 special character (@#$%!&*?)',
                    met: passwordValidation.checks.special
                  },
                  {
                    rule: 'Exactly 3 digits',
                    met: passwordValidation.checks.digits
                  },
                  {
                    rule: 'Passwords match',
                    met: metMatch
                  },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        r.met
                          ? '#16a34a'
                          : '#cbd5e1'
                      }
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>

                    <span
                      style={{
                        fontSize: '12px',
                        color: r.met
                          ? '#16a34a'
                          : '#94a3b8'
                      }}
                    >
                      {r.rule}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={changing || !isPasswordValid}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: isPasswordValid
                    ? '#1e3a5f'
                    : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor:
                    changing || !isPasswordValid
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    changing || !isPasswordValid
                      ? 0.7
                      : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {changing ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Changing...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                      />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>

                    Change Password
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}