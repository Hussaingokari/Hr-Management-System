'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Briefcase,
  Users,
  Pencil,
  Save,
  LockKeyhole,
} from 'lucide-react';

const STATUSES = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'REJECTED',
];

// ---------------------------------------------------------------------------
// THEME VARIABLES
// ---------------------------------------------------------------------------
function ThemeVars() {
  return (
    <style jsx global>{`
      :root {
        --bg-page: #f4f6f8;
        --bg-card: #ffffff;
        --bg-card-header: #f8fafc;
        --bg-hover: #f1f5f9;
        --bg-selected: #f0fdf4;
        --border-color: #e2e8f0;
        --border-color-light: #f1f5f9;
        --border-color-strong: #cbd5e1;

        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-muted: #94a3b8;

        --accent-primary: #0d9488;
        --accent-primary-hover: #0f766e;
        --accent-blue: #10b981;
        --accent-blue-bg: #ecfdf5;

        --btn-secondary-bg: #f1f5f9;
        --btn-secondary-text: #334155;

        --shadow-card:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -2px rgba(0, 0, 0, 0.05);

        --badge-open-bg: #dcfce7;
        --badge-open-text: #15803d;

        --badge-closed-bg: #ffe4e6;
        --badge-closed-text: #e11d48;

        --badge-draft-bg: #f1f5f9;
        --badge-draft-text: #64748b;

        --badge-applied-bg: #e0f2fe;
        --badge-applied-text: #0284c7;

        --badge-shortlisted-bg: #fae8ff;
        --badge-shortlisted-text: #a21caf;

        --badge-interview-bg: #fef3c7;
        --badge-interview-text: #b45309;

        --badge-interviewed-bg: #fef9c3;
        --badge-interviewed-text: #a16207;

        --badge-offer-bg: #d1fae5;
        --badge-offer-text: #047857;

        --badge-accepted-bg: #dcfce7;
        --badge-accepted-text: #15803d;

        --badge-rejected-bg: #ffe4e6;
        --badge-rejected-text: #e11d48;
      }

      .dark {
        --bg-page: #090d16;
        --bg-card: #111827;
        --bg-card-header: #1f2937;
        --bg-hover: #1f2937;
        --bg-selected: #064e3b;

        --border-color: #1f2937;
        --border-color-light: #162032;
        --border-color-strong: #374151;

        --text-primary: #f9fafb;
        --text-secondary: #9ca3af;
        --text-muted: #6b7280;

        --accent-primary: #14b8a6;
        --accent-primary-hover: #2dd4bf;
        --accent-blue: #34d399;
        --accent-blue-bg: #064e3b;

        --btn-secondary-bg: #1f2937;
        --btn-secondary-text: #e5e7eb;

        --shadow-card:
          0 10px 15px -3px rgba(0, 0, 0, 0.5),
          0 4px 6px -4px rgba(0, 0, 0, 0.5);

        --badge-open-bg: #064e3b;
        --badge-open-text: #6ee7b7;

        --badge-closed-bg: #881337;
        --badge-closed-text: #fda4af;

        --badge-draft-bg: #1f2937;
        --badge-draft-text: #9ca3af;

        --badge-applied-bg: #075985;
        --badge-applied-text: #7dd3fc;

        --badge-shortlisted-bg: #701a75;
        --badge-shortlisted-text: #f0abfc;

        --badge-interview-bg: #78350f;
        --badge-interview-text: #fde68a;

        --badge-interviewed-bg: #713f12;
        --badge-interviewed-text: #fef08a;

        --badge-offer-bg: #065f46;
        --badge-offer-text: #6ee7b7;

        --badge-accepted-bg: #064e3b;
        --badge-accepted-text: #6ee7b7;

        --badge-rejected-bg: #881337;
        --badge-rejected-text: #fda4af;
      }

      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.96) translateY(8px);
        }

        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// STATUS BADGE
// ---------------------------------------------------------------------------
function Badge({ status }) {
  const map = {
    OPEN: {
      bg: 'var(--badge-open-bg)',
      color: 'var(--badge-open-text)',
    },

    CLOSED: {
      bg: 'var(--badge-closed-bg)',
      color: 'var(--badge-closed-text)',
    },

    DRAFT: {
      bg: 'var(--badge-draft-bg)',
      color: 'var(--badge-draft-text)',
    },

    APPLIED: {
      bg: 'var(--badge-applied-bg)',
      color: 'var(--badge-applied-text)',
    },

    SHORTLISTED: {
      bg: 'var(--badge-shortlisted-bg)',
      color: 'var(--badge-shortlisted-text)',
    },

    INTERVIEW_SCHEDULED: {
      bg: 'var(--badge-interview-bg)',
      color: 'var(--badge-interview-text)',
    },

    INTERVIEWED: {
      bg: 'var(--badge-interviewed-bg)',
      color: 'var(--badge-interviewed-text)',
    },

    OFFER_SENT: {
      bg: 'var(--badge-offer-bg)',
      color: 'var(--badge-offer-text)',
    },

    OFFER_ACCEPTED: {
      bg: 'var(--badge-accepted-bg)',
      color: 'var(--badge-accepted-text)',
    },

    OFFER_REJECTED: {
      bg: 'var(--badge-rejected-bg)',
      color: 'var(--badge-rejected-text)',
    },

    REJECTED: {
      bg: 'var(--badge-rejected-bg)',
      color: 'var(--badge-rejected-text)',
    },
  };

  const s =
    map[status] || {
      bg: 'var(--badge-draft-bg)',
      color: 'var(--badge-draft-text)',
    };

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DELETE CONFIRMATION MODAL
// ---------------------------------------------------------------------------
function DeleteJobModal({
  job,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!job) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                }}
              >
                Delete Job Posting
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                Permanent action
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--btn-secondary-bg)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div
            style={{
              background: 'var(--bg-card-header)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Briefcase
                size={18}
                color="var(--accent-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                  }}
                >
                  {job.title}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                  }}
                >
                  {job.department} · {job.location}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '13px 14px',
              borderRadius: '10px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle
              size={18}
              color="#ea580c"
              style={{
                flexShrink: 0,
                marginTop: '1px',
              }}
            />

            <div
              style={{
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#9a3412',
              }}
            >
              This action will permanently delete the job
              posting and all applications associated with it.
              <strong> This cannot be undone.</strong>
            </div>
          </div>

          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Are you sure you want to delete this job posting?
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              padding: '10px 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-color-strong)',
              background: 'var(--btn-secondary-bg)',
              color: 'var(--btn-secondary-text)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '10px 18px',
              borderRadius: '9px',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PERMISSION DENIED MODAL
// ---------------------------------------------------------------------------
function PermissionDeniedModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.30)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.18s ease-out',
        }}
      >
        <div style={{ padding: '28px 26px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockKeyhole size={27} strokeWidth={2.2} />
          </div>

          <div
            style={{
              fontSize: '19px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Permission Denied
          </div>

          <div
            style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              maxWidth: '340px',
              margin: '0 auto',
            }}
          >
            You don't have permission to delete recruitment postings.
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              lineHeight: '1.5',
              color: 'var(--text-muted)',
            }}
          >
            Only an <strong style={{ color: 'var(--text-secondary)' }}>Admin</strong> can
            delete recruitment postings.
          </div>
        </div>

        <div
          style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px 18px',
              border: 'none',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROLE HELPER
// ---------------------------------------------------------------------------
function getCurrentUserRole() {
  if (typeof window === 'undefined') return null;

  const normalizeRole = (role) => {
    if (!role || typeof role !== 'string') return null;

    const normalized = role
      .replace(/^ROLE_/i, '')
      .trim()
      .toUpperCase();

    return ['ADMIN', 'HR'].includes(normalized) ? normalized : null;
  };

  const readRole = (value) => {
    if (!value) return null;

    if (typeof value === 'string') {
      return normalizeRole(value);
    }

    if (typeof value !== 'object') return null;

    const direct =
      normalizeRole(value.role) ||
      normalizeRole(value.userRole) ||
      normalizeRole(value.authority);

    if (direct) return direct;

    for (const key of ['roles', 'authorities', 'permissions']) {
      if (!Array.isArray(value[key])) continue;

      for (const item of value[key]) {
        const role =
          typeof item === 'string'
            ? normalizeRole(item)
            : normalizeRole(item?.authority || item?.role);

        if (role) return role;
      }
    }

    return null;
  };

  const readJwt = (token) => {
    if (!token || typeof token !== 'string') return null;

    try {
      const parts = token.replace(/^Bearer\s+/i, '').split('.');
      if (parts.length !== 3) return null;

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(window.atob(padded));

      return readRole(payload);
    } catch {
      return null;
    }
  };

  const keys = [
    'user',
    'currentUser',
    'auth',
    'authUser',
    'userData',
    'profile',
    'accessToken',
    'access_token',
    'token',
    'jwt',
  ];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const role = readRole(parsed);
        if (role) return role;
      } catch {
        // Value is not JSON; it may be a JWT.
      }

      const jwtRole = readJwt(raw);
      if (jwtRole) return jwtRole;

      const stringRole = normalizeRole(raw);
      if (stringRole) return stringRole;
    } catch {
      // Ignore storage read errors.
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// EDIT JOB MODAL
// ---------------------------------------------------------------------------
function EditJobModal({
  job,
  form,
  submitting,
  onChange,
  onCancel,
  onSave,
}) {
  if (!job) return null;

  const isReopening = job.status === 'CLOSED' && form.status === 'OPEN';

  const fieldStyle = {
    width: '100%',
    padding: '11px 12px',
    background: 'var(--bg-card-header)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color-strong)',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.30)',
          animation: 'modalFadeIn 0.18s ease-out',
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-card)',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--accent-blue-bg)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pencil size={19} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                }}
              >
                Edit Job Posting
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '3px',
                }}
              >
                Update job details and posting status
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              width: '34px',
              height: '34px',
              border: 'none',
              borderRadius: '9px',
              background: 'var(--btn-secondary-bg)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div
            style={{
              padding: '15px',
              borderRadius: '13px',
              background: 'var(--bg-card-header)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {job.title}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '7px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {job.department}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {job.location || 'Location not specified'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <Badge status={job.status} />
            </div>
          </div>

          {isReopening && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '13px 14px',
                borderRadius: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                marginBottom: '18px',
              }}
            >
              <Briefcase
                size={17}
                color="#059669"
                style={{ flexShrink: 0, marginTop: '1px' }}
              />
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#047857',
                    marginBottom: '3px',
                  }}
                >
                  Reopening this job
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#065f46' }}>
                  Saving with status <strong>OPEN</strong> will make this job available
                  again for candidates.
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
            }}
          >
            <div>
              <label style={labelStyle}>Job Title</label>
              <input
                name="title"
                value={form.title || ''}
                onChange={onChange}
                style={fieldStyle}
                placeholder="Job title"
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={form.status || ''}
                onChange={onChange}
                style={{
                  ...fieldStyle,
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                <option value="OPEN">Open — accepting applications</option>
                <option value="CLOSED">Closed — not accepting applications</option>
                <option value="DRAFT">Draft</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Salary Range</label>
              <input
                name="salaryRange"
                value={form.salaryRange || ''}
                onChange={onChange}
                style={fieldStyle}
                placeholder="e.g. 6-10 LPA"
              />
            </div>

            <div>
              <label style={labelStyle}>Application Deadline</label>
              <input
                type="date"
                name="applicationDeadline"
                min={todayStr}
                value={form.applicationDeadline || ''}
                onChange={onChange}
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              rows={5}
              value={form.description || ''}
              onChange={onChange}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
              placeholder="Describe the role..."
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Requirements</label>
            <textarea
              name="requirements"
              rows={5}
              value={form.requirements || ''}
              onChange={onChange}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
              placeholder="Skills, qualifications and experience..."
            />
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            position: 'sticky',
            bottom: 0,
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '10px 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-color-strong)',
              background: 'var(--btn-secondary-bg)',
              color: 'var(--btn-secondary-text)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={submitting}
            style={{
              padding: '10px 18px',
              borderRadius: '9px',
              border: 'none',
              background: isReopening ? '#059669' : 'var(--accent-primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={15} />
                {isReopening ? 'Save & Reopen Job' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EMPTY JOB
// ---------------------------------------------------------------------------
const EMPTY_JOB = {
  title: '',
  department: '',
  location: '',
  employmentType: 'FULL_TIME',
  description: '',
  requirements: '',
  experienceRequired: '',
  salaryRange: '',
  applicationDeadline: '',
};

// ---------------------------------------------------------------------------
// TODAY
// ---------------------------------------------------------------------------
const todayStr = new Date().toLocaleDateString('en-CA');

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function RecruitmentPage() {
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);

  // Edit job state. Reopening is intentionally handled through this edit flow.
  const [showEditJob, setShowEditJob] = useState(false);
  const [editJobForm, setEditJobForm] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(null);
  const [togglingJob, setTogglingJob] = useState(null);

  // ---------------------------------------------------------
  // DELETE STATE
  // ---------------------------------------------------------
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deletingJob, setDeletingJob] = useState(false);

  // Delete permission is ADMIN-only.
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // ---------------------------------------------------------
  // LOAD CURRENT USER ROLE
  // ---------------------------------------------------------
  useEffect(() => {
    setCurrentUserRole(getCurrentUserRole());
  }, []);

  // ---------------------------------------------------------
  // VIEW RESUME
  // ---------------------------------------------------------
  const handleViewResume = async (e, resumeUrl) => {
    e.preventDefault();

    try {
      const url = resumeUrl.startsWith('http')
        ? new URL(resumeUrl).pathname
        : resumeUrl;

      const res = await api.get(url, {
        responseType: 'blob',
      });

      const contentType =
        res.headers['content-type'] ||
        'application/pdf';

      const blob = new Blob([res.data], {
        type: contentType,
      });

      const blobUrl = window.URL.createObjectURL(blob);

      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error('Failed to open resume');
      console.error(err);
    }
  };

  // ---------------------------------------------------------
  // FETCH JOBS
  // ---------------------------------------------------------
  const fetchJobs = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get(
        '/api/recruitment/jobs/all'
      );

      setJobs(
        res.data?.data?.content ||
        res.data?.data ||
        []
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // ---------------------------------------------------------
  // FETCH APPLICATIONS
  // ---------------------------------------------------------
  const fetchApplications = async (jobId) => {
    setLoadingApps(true);

    try {
      const res = await api.get(
        `/api/recruitment/jobs/${jobId}/applications`
      );

      setApplications(
        res.data?.data?.content ||
        res.data?.data ||
        []
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  };

  // ---------------------------------------------------------
  // SELECT JOB
  // ---------------------------------------------------------
  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setSelectedApp(null);
    fetchApplications(job.id);
  };

  // ---------------------------------------------------------
  // NOTIFICATION JOB SELECTION
  // ---------------------------------------------------------
  useEffect(() => {
    const targetId = searchParams.get('id');

    if (!targetId || jobs.length === 0) {
      return;
    }

    const job = jobs.find(
      (j) => String(j.id) === String(targetId)
    );

    if (
      job &&
      selectedJob?.id !== job.id
    ) {
      handleSelectJob(job);
    }
  }, [
    jobs,
    searchParams,
    selectedJob,
  ]);

  // ---------------------------------------------------------
  // FORM INPUT
  // ---------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setJobForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------
  // CREATE JOB
  // ---------------------------------------------------------
  const handleCreateJob = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      await api.post(
        '/api/recruitment/jobs',
        jobForm
      );

      toast.success(
        'Job posted successfully!'
      );

      setShowJobForm(false);
      setJobForm(EMPTY_JOB);

      await fetchJobs();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        'Failed to post job'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // OPEN EDIT JOB
  // ---------------------------------------------------------
  const handleEditJob = (e, job) => {
    e.stopPropagation();

    setEditJobForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      salaryRange: job.salaryRange || '',
      applicationDeadline: job.applicationDeadline || '',
      status: job.status || 'DRAFT',
    });

    setShowEditJob(true);
  };

  // ---------------------------------------------------------
  // EDIT FORM INPUT
  // ---------------------------------------------------------
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    setEditJobForm((prev) => ({
      ...prev,
      [name]: name === 'applicationDeadline'
        ? (value && value < todayStr ? todayStr : value)
        : value,
    }));
  };

  // ---------------------------------------------------------
  // SAVE EDITED JOB
  // ---------------------------------------------------------
  const handleUpdateJob = async () => {
    if (!selectedJob?.id || !editJobForm) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: editJobForm.title,
        description: editJobForm.description,
        requirements: editJobForm.requirements,
        salaryRange: editJobForm.salaryRange,
        applicationDeadline: editJobForm.applicationDeadline || null,
        status: editJobForm.status,
      };

      const res = await api.put(
        `/api/recruitment/jobs/${selectedJob.id}`,
        payload
      );

      const updatedJob =
        res.data?.data || {
          ...selectedJob,
          ...payload,
        };

      setJobs((prev) =>
        prev.map((job) =>
          job.id === selectedJob.id
            ? { ...job, ...updatedJob }
            : job
        )
      );

      setSelectedJob((prev) =>
        prev
          ? { ...prev, ...updatedJob }
          : prev
      );

      toast.success(
        selectedJob.status === 'CLOSED' && editJobForm.status === 'OPEN'
          ? 'Job reopened successfully!'
          : 'Job updated successfully!'
      );

      setShowEditJob(false);
      setEditJobForm(null);
    } catch (err) {
      console.error('Update job failed:', err);

      toast.error(
        err.response?.data?.message ||
        'Failed to update job'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // CLOSE JOB
  // ---------------------------------------------------------
  const handleCloseJob = async (e, job) => {
    e.stopPropagation();

    setTogglingJob(job.id);

    try {
      const payload = {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        salaryRange: job.salaryRange,
        applicationDeadline: job.applicationDeadline || null,
        status: 'CLOSED',
      };

      const res = await api.put(
        `/api/recruitment/jobs/${job.id}`,
        payload
      );

      const updatedJob =
        res.data?.data || {
          ...job,
          status: 'CLOSED',
        };

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, ...updatedJob }
            : j
        )
      );

      if (selectedJob?.id === job.id) {
        setSelectedJob((prev) =>
          prev
            ? { ...prev, ...updatedJob }
            : prev
        );
      }

      toast.success('Job closed successfully!');
    } catch (err) {
      console.error('Close job failed:', err);

      toast.error(
        err.response?.data?.message ||
        'Failed to close job'
      );
    } finally {
      setTogglingJob(null);
    }
  };

  // ---------------------------------------------------------
  // OPEN DELETE MODAL
  // ---------------------------------------------------------
  const handleDeleteClick = (e, job) => {
    e.stopPropagation();

    const role = currentUserRole || getCurrentUserRole();

    // HR and other non-admin users cannot even open the delete confirmation.
    if (role && role !== 'ADMIN') {
      setShowPermissionPopup(true);
      return;
    }

    // Backend remains the final authorization layer.
    setJobToDelete(job);
  };

  // ---------------------------------------------------------
  // DELETE JOB
  // ---------------------------------------------------------
  const handleDeleteJob = async () => {
    if (!jobToDelete?.id) {
      return;
    }

    setDeletingJob(true);

    try {
      await api.delete(
        `/api/recruitment/jobs/${jobToDelete.id}`
      );

      toast.success(
        'Job deleted successfully!'
      );

      const deletedId = jobToDelete.id;

      setJobs((prev) =>
        prev.filter(
          (job) => job.id !== deletedId
        )
      );

      if (
        selectedJob?.id === deletedId
      ) {
        setSelectedJob(null);
        setApplications([]);
        setSelectedApp(null);
      }

      setJobToDelete(null);
    } catch (err) {
      console.error(
        'Delete job failed:',
        err
      );

      if (err.response?.status === 401 || err.response?.status === 403) {
        setJobToDelete(null);
        setShowPermissionPopup(true);
        return;
      }

      toast.error(
        err.response?.data?.message ||
        'Failed to delete job'
      );
    } finally {
      setDeletingJob(false);
    }
  };

  // ---------------------------------------------------------
  // APPLICATION UPDATE
  // ---------------------------------------------------------
  const handleUpdateApplication = async (
    appId,
    statusOverride = null
  ) => {
    const status =
      statusOverride || newStatus;

    if (!status) {
      toast.error('Select a status');
      return;
    }

    setUpdatingApp(appId);

    try {
      const payload = {
        status,
      };

      if (
        status === 'INTERVIEW_SCHEDULED'
      ) {
        payload.interviewDate =
          interviewDate;

        payload.interviewMode = 'VIDEO';

        payload.interviewerId = 2;
      }

      if (status === 'INTERVIEWED') {
        payload.interviewScore =
          parseInt(interviewScore) || 0;

        payload.interviewNotes =
          interviewNotes;
      }

      if (status === 'REJECTED') {
        payload.rejectionReason =
          rejectionReason;
      }

      await api.put(
        `/api/recruitment/applications/${appId}`,
        payload
      );

      if (status === 'SHORTLISTED') {
        toast.success(
          'Candidate approved successfully!'
        );
      } else if (
        status === 'REJECTED'
      ) {
        toast.success(
          'Candidate rejected.'
        );
      } else {
        toast.success(
          'Application updated!'
        );
      }

      setSelectedApp(null);
      setNewStatus('');
      setInterviewDate('');
      setInterviewScore('');
      setInterviewNotes('');
      setRejectionReason('');

      if (selectedJob) {
        fetchApplications(
          selectedJob.id
        );
      }
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        'Update failed'
      );
    } finally {
      setUpdatingApp(null);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div
      style={{
        backgroundColor:
          'var(--bg-page)',
        minHeight: '100vh',
        padding: '12px',
      }}
    >
      <ThemeVars />

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            Recruitment
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            Manage job postings and
            candidate applications
          </p>
        </div>

        <button
          onClick={() =>
            setShowJobForm(true)
          }
          style={{
            padding: '10px 20px',
            background:
              'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow:
              '0 4px 12px rgba(13, 148, 136, 0.25)',
          }}
        >
          + Post Job
        </button>
      </div>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            selectedJob
              ? '1fr 1.5fr'
              : '1fr',
          gap: '20px',
        }}
      >
        {/* ===================================================
            JOB LIST
        =================================================== */}
        <div
          style={{
            background:
              'var(--bg-card)',
            borderRadius: '14px',
            border:
              '1px solid var(--border-color)',
            boxShadow:
              'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom:
                '1px solid var(--border-color)',
              background:
                'var(--bg-card-header)',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color:
                  'var(--text-primary)',
              }}
            >
              Job Postings ({jobs.length})
            </h3>
          </div>

          {loading ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color:
                  'var(--text-muted)',
              }}
            >
              Loading...
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                padding: '60px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  marginBottom: '12px',
                }}
              >
                💼
              </div>

              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color:
                    'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                No jobs posted yet
              </div>

              <button
                onClick={() =>
                  setShowJobForm(true)
                }
                style={{
                  padding:
                    '8px 18px',
                  background:
                    'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                + Post First Job
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() =>
                  handleSelectJob(job)
                }
                style={{
                  padding:
                    '16px 20px',
                  borderBottom:
                    '1px solid var(--border-color-light)',
                  cursor: 'pointer',
                  background:
                    selectedJob?.id ===
                      job.id
                      ? 'var(--bg-selected)'
                      : 'var(--bg-card)',
                  borderLeft:
                    selectedJob?.id ===
                      job.id
                      ? '4px solid var(--accent-primary)'
                      : '4px solid transparent',
                  transition:
                    'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (
                    selectedJob?.id !==
                    job.id
                  ) {
                    e.currentTarget.style.background =
                      'var(--bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    selectedJob?.id !==
                    job.id
                  ) {
                    e.currentTarget.style.background =
                      'var(--bg-card)';
                  }
                }}
              >
                {/* JOB HEADER */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'flex-start',
                    gap: '12px',
                    marginBottom:
                      '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color:
                        'var(--text-primary)',
                      minWidth: 0,
                    }}
                  >
                    {job.title}
                  </div>

                  {/* ACTIONS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: '7px',
                      flexShrink: 0,
                    }}
                  >
                    <Badge
                      status={job.status}
                    />

                    {/* EDIT */}
                    <button
                      onClick={(e) =>
                        handleEditJob(e, job)
                      }
                      title={
                        job.status === 'CLOSED'
                          ? 'Edit job to reopen'
                          : 'Edit job'
                      }
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        border: '1px solid #c7d2fe',
                        borderRadius: '7px',
                        background: '#eef2ff',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '800',
                      }}
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    {/* CLOSE — reopening is only available through Edit */}
                    {job.status === 'OPEN' && (
                      <button
                        onClick={(e) =>
                          handleCloseJob(e, job)
                        }
                        disabled={
                          togglingJob ===
                          job.id
                        }
                        title="Close job"
                        style={{
                          height: '30px',
                          padding: '0 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          border:
                            '1px solid var(--border-color-strong)',
                          borderRadius: '7px',
                          background:
                            'var(--btn-secondary-bg)',
                          color:
                            'var(--btn-secondary-text)',
                          cursor:
                            togglingJob ===
                              job.id
                              ? 'not-allowed'
                              : 'pointer',
                          opacity:
                            togglingJob ===
                              job.id
                              ? 0.5
                              : 1,
                        }}
                      >
                        {togglingJob === job.id
                          ? '...'
                          : 'Close'}
                      </button>
                    )}

                    {/* DELETE */}
                    <button
                      onClick={(e) =>
                        handleDeleteClick(
                          e,
                          job
                        )
                      }
                      title="Delete job"
                      style={{
                        width: '30px',
                        height: '30px',
                        border:
                          '1px solid #fecaca',
                        borderRadius:
                          '7px',
                        background:
                          '#fef2f2',
                        color:
                          '#dc2626',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        cursor:
                          'pointer',
                        transition:
                          'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          '#fef2f2';
                      }}
                    >
                      <Trash2
                        size={14}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </div>

                {/* JOB INFO */}
                <div
                  style={{
                    fontSize: '12px',
                    color:
                      'var(--text-secondary)',
                    marginBottom:
                      '4px',
                  }}
                >
                  📍 {job.location} ·{' '}
                  {job.department} ·{' '}
                  {job.employmentType}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  💰 {job.salaryRange} ·
                  Exp:{' '}
                  {job.experienceRequired}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color:
                      'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  Deadline:{' '}
                  {job.applicationDeadline}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===================================================
            APPLICATIONS PANEL
        =================================================== */}
        {selectedJob && (
          <div
            style={{
              background:
                'var(--bg-card)',
              borderRadius: '14px',
              border:
                '1px solid var(--border-color)',
              boxShadow:
                'var(--shadow-card)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '16px 20px',
                borderBottom:
                  '1px solid var(--border-color)',
                background:
                  'var(--bg-card-header)',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color:
                    'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                {selectedJob.title}
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color:
                    'var(--text-muted)',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '5px',
                }}
              >
                <Users size={13} />
                {applications.length}{' '}
                application(s)
                received
              </p>
            </div>

            {loadingApps ? (
              <div
                style={{
                  padding: '40px',
                  textAlign:
                    'center',
                  color:
                    'var(--text-muted)',
                }}
              >
                Loading applications...
              </div>
            ) : applications.length ===
              0 ? (
              <div
                style={{
                  padding: '60px',
                  textAlign:
                    'center',
                }}
              >
                <div
                  style={{
                    fontSize: '40px',
                    marginBottom:
                      '12px',
                  }}
                >
                  📭
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    fontWeight:
                      '600',
                    color:
                      'var(--text-primary)',
                  }}
                >
                  No applications yet
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color:
                      'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  Applications will
                  appear here when
                  candidates apply
                </div>
              </div>
            ) : (
              applications.map(
                (app) => (
                  <div
                    key={app.id}
                    style={{
                      padding:
                        '16px 20px',
                      borderBottom:
                        '1px solid var(--border-color-light)',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                        marginBottom:
                          '8px',
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius:
                              '50%',
                            background:
                              'linear-gradient(135deg, var(--accent-primary), var(--accent-blue))',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            fontSize:
                              '13px',
                            fontWeight:
                              '700',
                            color:
                              'white',
                            flexShrink:
                              0,
                          }}
                        >
                          {app.candidateName
                            ?.split(
                              ' '
                            )
                            .map(
                              (n) =>
                                n[0]
                            )
                            .join(
                              ''
                            )
                            .slice(
                              0,
                              2
                            )}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize:
                                '14px',
                              fontWeight:
                                '700',
                              color:
                                'var(--text-primary)',
                              marginBottom:
                                '3px',
                            }}
                          >
                            {
                              app.candidateName
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                '11px',
                              color:
                                'var(--text-muted)',
                              marginBottom:
                                '2px',
                            }}
                          >
                            {
                              app.candidateEmail
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                '11px',
                              color:
                                'var(--text-muted)',
                            }}
                          >
                            {
                              app.candidatePhone
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                '11px',
                              color:
                                'var(--text-muted)',
                              marginTop:
                                '2px',
                            }}
                          >
                            {app.experienceYears ??
                              0}{' '}
                            {(app.experienceYears ??
                              0) ===
                              1
                              ? 'year'
                              : 'years'}{' '}
                            {app.experienceMonths ??
                              0}{' '}
                            {(app.experienceMonths ??
                              0) ===
                              1
                              ? 'month'
                              : 'months'}{' '}
                            experience
                          </div>
                        </div>
                      </div>

                      <Badge
                        status={
                          app.status
                        }
                      />
                    </div>

                    {/* RESUME */}
                    {app.resumeUrl && (
                      <div
                        style={{
                          marginBottom:
                            '8px',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              '12px',
                            color:
                              'var(--text-secondary)',
                          }}
                        >
                          📄 Resume:
                        </span>

                        <a
                          href="#"
                          onClick={(e) =>
                            handleViewResume(
                              e,
                              app.resumeUrl
                            )
                          }
                          style={{
                            fontSize:
                              '12px',
                            color:
                              'var(--accent-primary)',
                            fontWeight:
                              '700',
                            textDecoration:
                              'none',
                          }}
                        >
                          View Resume →
                        </a>
                      </div>
                    )}

                    {/* REFERRED BY */}
                    <div
                      style={{
                        fontSize:
                          '12px',
                        color:
                          'var(--text-secondary)',
                        marginBottom:
                          '8px',
                      }}
                    >
                      👤 Referred By:{' '}
                      <strong
                        style={{
                          color:
                            'var(--text-primary)',
                        }}
                      >
                        {app.referredByName ||
                          'Direct Application'}
                      </strong>
                    </div>

                    {/* APPROVE / REJECT */}
                    {app.status ===
                      'APPLIED' && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: '10px',
                            marginTop:
                              '10px',
                            marginBottom:
                              '12px',
                          }}
                        >
                          <button
                            onClick={() =>
                              handleUpdateApplication(
                                app.id,
                                'SHORTLISTED'
                              )
                            }
                            disabled={
                              updatingApp ===
                              app.id
                            }
                            style={{
                              flex: 1,
                              padding:
                                '7px 12px',
                              background:
                                '#059669',
                              color:
                                'white',
                              border:
                                'none',
                              borderRadius:
                                '6px',
                              fontSize:
                                '12px',
                              fontWeight:
                                '700',
                              cursor:
                                'pointer',
                            }}
                          >
                            ✓ Approve
                          </button>

                          <button
                            onClick={() =>
                              handleUpdateApplication(
                                app.id,
                                'REJECTED'
                              )
                            }
                            disabled={
                              updatingApp ===
                              app.id
                            }
                            style={{
                              flex: 1,
                              padding:
                                '7px 12px',
                              background:
                                '#e11d48',
                              color:
                                'white',
                              border:
                                'none',
                              borderRadius:
                                '6px',
                              fontSize:
                                '12px',
                              fontWeight:
                                '700',
                              cursor:
                                'pointer',
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          POST JOB MODAL
      ===================================================== */}
      {showJobForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0, 0, 0, 0.65)',
            backdropFilter:
              'blur(4px)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background:
                'var(--bg-card)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border:
                '1px solid var(--border-color)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '20px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color:
                    'var(--text-primary)',
                }}
              >
                Post a New Job
              </h2>

              <button
                onClick={() =>
                  setShowJobForm(false)
                }
                style={{
                  border: 'none',
                  background:
                    'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color:
                    'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                handleCreateJob
              }
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display:
                      'block',
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      'var(--text-secondary)',
                    marginBottom:
                      '6px',
                  }}
                >
                  Job Title *
                </label>

                <input
                  type="text"
                  required
                  name="title"
                  value={
                    jobForm.title
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. Senior Frontend Developer"
                  style={{
                    width: '100%',
                    padding:
                      '10px 12px',
                    background:
                      'var(--bg-card-header)',
                    color:
                      'var(--text-primary)',
                    border:
                      '1px solid var(--border-color-strong)',
                    borderRadius:
                      '8px',
                    fontSize:
                      '14px',
                    outline:
                      'none',
                  }}
                />
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Department *
                  </label>

                  <input
                    type="text"
                    required
                    name="department"
                    value={
                      jobForm.department
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Engineering"
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Location *
                  </label>

                  <select
                    required
                    name="location"
                    value={
                      jobForm.location
                    }
                    onChange={
                      handleInputChange
                    }
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  >
                    <option value="">
                      Select Location
                    </option>
                    <option value="On-site">
                      On-site
                    </option>
                    <option value="Remote">
                      Remote
                    </option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Employment Type
                  </label>

                  <select
                    name="employmentType"
                    value={
                      jobForm.employmentType
                    }
                    onChange={
                      handleInputChange
                    }
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  >
                    <option value="FULL_TIME">
                      Full Time
                    </option>
                    <option value="PART_TIME">
                      Part Time
                    </option>
                    <option value="CONTRACT">
                      Contract
                    </option>
                    <option value="INTERNSHIP">
                      Internship
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Salary Range
                  </label>

                  <input
                    type="text"
                    name="salaryRange"
                    value={
                      jobForm.salaryRange
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="2-6 lpa"
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Experience Required
                  </label>

                  <input
                    type="text"
                    name="experienceRequired"
                    value={
                      jobForm.experienceRequired
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. 3+ years"
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      fontSize:
                        '12px',
                      fontWeight:
                        '700',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '6px',
                    }}
                  >
                    Application Deadline
                  </label>

                  <input
                    type="date"
                    name="applicationDeadline"
                    min={todayStr}
                    value={
                      jobForm.applicationDeadline
                    }
                    onChange={(e) => {
                      const v =
                        e.target.value;

                      setJobForm(
                        (prev) => ({
                          ...prev,
                          applicationDeadline:
                            v &&
                              v <
                              todayStr
                              ? todayStr
                              : v,
                        })
                      );
                    }}
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      background:
                        'var(--bg-card-header)',
                      color:
                        'var(--text-primary)',
                      border:
                        '1px solid var(--border-color-strong)',
                      borderRadius:
                        '8px',
                      fontSize:
                        '14px',
                      outline:
                        'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display:
                      'block',
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      'var(--text-secondary)',
                    marginBottom:
                      '6px',
                  }}
                >
                  Description *
                </label>

                <textarea
                  rows="3"
                  name="description"
                  required
                  value={
                    jobForm.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Job overview and details..."
                  style={{
                    width: '100%',
                    padding:
                      '10px 12px',
                    background:
                      'var(--bg-card-header)',
                    color:
                      'var(--text-primary)',
                    border:
                      '1px solid var(--border-color-strong)',
                    borderRadius:
                      '8px',
                    fontSize:
                      '14px',
                    outline:
                      'none',
                    resize:
                      'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display:
                      'block',
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      'var(--text-secondary)',
                    marginBottom:
                      '6px',
                  }}
                >
                  Requirements
                </label>

                <textarea
                  rows="3"
                  name="requirements"
                  value={
                    jobForm.requirements
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Required skills and qualifications..."
                  style={{
                    width: '100%',
                    padding:
                      '10px 12px',
                    background:
                      'var(--bg-card-header)',
                    color:
                      'var(--text-primary)',
                    border:
                      '1px solid var(--border-color-strong)',
                    borderRadius:
                      '8px',
                    fontSize:
                      '14px',
                    outline:
                      'none',
                    resize:
                      'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  display:
                    'flex',
                  gap: '10px',
                  justifyContent:
                    'flex-end',
                  marginTop:
                    '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowJobForm(
                      false
                    )
                  }
                  style={{
                    padding:
                      '10px 18px',
                    background:
                      'var(--btn-secondary-bg)',
                    color:
                      'var(--btn-secondary-text)',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    fontWeight:
                      '600',
                    cursor:
                      'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  style={{
                    padding:
                      '10px 20px',
                    background:
                      'var(--accent-primary)',
                    color:
                      'white',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    fontWeight:
                      '700',
                    cursor:
                      submitting
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      submitting
                        ? 0.7
                        : 1,
                  }}
                >
                  {submitting
                    ? 'Posting...'
                    : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT JOB MODAL
      ===================================================== */}
      {showEditJob && editJobForm && selectedJob && (
        <EditJobModal
          job={selectedJob}
          form={editJobForm}
          submitting={submitting}
          onChange={handleEditInputChange}
          onCancel={() => {
            if (!submitting) {
              setShowEditJob(false);
              setEditJobForm(null);
            }
          }}
          onSave={handleUpdateJob}
        />
      )}

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}
      {jobToDelete && (
        <DeleteJobModal
          job={jobToDelete}
          deleting={deletingJob}
          onCancel={() => {
            if (!deletingJob) {
              setJobToDelete(
                null
              );
            }
          }}
          onConfirm={
            handleDeleteJob
          }
        />
      )}

      {showPermissionPopup && (
        <PermissionDeniedModal
          onClose={() => setShowPermissionPopup(false)}
        />
      )}
    </div>
  );
}