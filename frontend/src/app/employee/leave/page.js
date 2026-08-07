'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function StatusPill({ status }) {
  const map = {
    APPROVED: { bg: 'rgba(22, 163, 74, 0.15)', color: '#15803D', icon: '✅' },
    PENDING: { bg: 'rgba(180, 83, 9, 0.2)', color: '#B45309', icon: '⏳' },
    REJECTED: { bg: 'rgba(220, 38, 38, 0.15)', color: '#B91C1C', icon: '✕' },
    CANCELLATION_PENDING: { bg: 'rgba(126, 34, 206, 0.2)', color: '#7E22CE', icon: '↩️' },
    CANCELLED: { bg: '#1E293B', color: 'var(--text-secondary)', icon: '·' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: '999px',
      fontSize: '11.5px', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span>{s.icon}</span>{status?.replace(/_/g, ' ')}
    </span>
  );
}

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual', icon: '🌴' },
  { value: 'SICK', label: 'Sick', icon: '🤒' },
  { value: 'CASUAL', label: 'Casual', icon: '☀️' },
  { value: 'PATERNITY', label: 'Paternity', icon: '👨‍🍼' },
  { value: 'MATERNITY', label: 'Maternity', icon: '🤱' },
  { value: 'UNPAID', label: 'Unpaid', icon: '📋' },
];

const balanceStyle = {
  ANNUAL: { color: '#4F46E5', soft: 'rgba(79, 70, 229, 0.15)', icon: '🌴' },
  SICK: { color: '#0D9488', soft: 'rgba(13, 148, 136, 0.15)', icon: '🤒' },
  CASUAL: { color: '#D97706', soft: 'rgba(217, 119, 6, 0.15)', icon: '☀️' },
  PATERNITY: { color: '#8B5CF6', soft: 'rgba(139, 92, 246, 0.15)', icon: '👨‍🍼' },
  MATERNITY: { color: '#DB2777', soft: 'rgba(219, 39, 119, 0.15)', icon: '🤱' },
  UNPAID: { color: 'var(--text-secondary)', soft: '#1E293B', icon: '📋' },
};

function BalanceRing({ pct, color, size = 54 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `conic-gradient(${color} ${pct * 3.6}deg, #EEF0F5 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: size - 8, height: size - 8, borderRadius: '50%',
        background: 'var(--card-bg)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size < 45 ? '9px' : '11px', fontWeight: 800, color,
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, balRes] = await Promise.allSettled([
        api.get(`/api/leaves/my?page=${page}&size=8`),
        api.get('/api/leaves/balance'),
      ]);
      if (leaveRes.status === 'fulfilled') {
        const data = leaveRes.value.data?.data;
        setLeaves(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }
      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
    } catch (err) {
      toast.error("Couldn't load your leave data — try refreshing");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Pick a start and end date');
      return;
    }
    if (form.startDate < today) {
      toast.error('Start date can\u2019t be in the past');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date needs to be after the start date');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/leaves/apply', {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      toast.success('🌿 Leave request sent!');
      setShowForm(false);
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.put(`/api/leaves/${id}/cancel`, { reason: 'Cancelled by employee' });
      toast.success('Cancellation processed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel — try again');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .lm-date-input::-webkit-calendar-picker-indicator { opacity: 0.7; cursor: pointer; }
        .lm-reason-textarea, .lm-reason-textarea::placeholder {
          color: var(--text-primary) !important; background: var(--card-bg) !important;
          -webkit-text-fill-color: var(--text-primary) !important;
        }
        .lm-reason-textarea::placeholder { color: var(--text-muted) !important; -webkit-text-fill-color: var(--text-muted) !important; }
        .lm-type-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            🌿 Time Off
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Apply for leave, track your requests, and keep an eye on your balance
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '12px 22px',
            background: 'linear-gradient(135deg, #6D5DFB, #4F3DF5)',
            color: 'var(--text-primary)', border: 'none', borderRadius: '14px',
            fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 8px 20px rgba(79,61,245,0.28)',
          }}
        >
          ✨ Apply for Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '26px' }}>
        {balance.length === 0 ? (
          Object.keys(balanceStyle).map(type => {
            const c = balanceStyle[type];
            return (
              <div key={type} style={{ background: 'var(--card-bg)', borderRadius: '14px', padding: '12px', border: '1px solid #EEF0F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px' }}>{c.icon}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{type}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>No data yet</div>
              </div>
            );
          })
        ) : (
          balance.map((b, i) => {
            const c = balanceStyle[b.leaveType] || balanceStyle.UNPAID;
            const pct = b.totalAllotted > 0 ? (b.remaining / b.totalAllotted) * 100 : 0;
            return (
              <div key={i} className="lm-type-card" style={{
                background: c.soft, borderRadius: '14px', padding: '12px',
                border: `1px solid ${c.color}22`, transition: 'transform 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', marginBottom: '2px' }}>{c.icon}</div>
                    <div style={{ fontSize: '11px', color: c.color, fontWeight: 700 }}>{b.leaveType}</div>
                  </div>
                  <BalanceRing pct={pct} color={c.color} size={38} />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Quicksand', sans-serif" }}>
                  {b.remaining} <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>/ {b.totalAllotted}d</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Used {b.used}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Apply Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px', backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: '22px', padding: '28px',
            width: '100%', maxWidth: '500px', boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)' }}>
                🌿 Apply for Leave
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'var(--card-bg)', border: 'none', width: '30px', height: '30px', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleApply}>
              {/* Leave Type — visual chip picker */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  What kind of leave?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {LEAVE_TYPES.map(t => {
                    const active = form.leaveType === t.value;
                    return (
                      <button type="button" key={t.value}
                        onClick={() => setForm({ ...form, leaveType: t.value })}
                        style={{
                          padding: '10px 6px', borderRadius: '12px', cursor: 'pointer',
                          border: active ? '2px solid #6D5DFB' : '1.5px solid #E5E7EB',
                          background: active ? 'rgba(79, 70, 229, 0.15)' : '#1E293B',
                          fontSize: '12px', fontWeight: 700,
                          color: active ? '#4F3DF5' : '#64748B',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        }}>
                        <span style={{ fontSize: '18px' }}>{t.icon}</span>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    From
                  </label>
                  <input
                    type="date" className="lm-date-input"
                    value={form.startDate} min={today}
                    onChange={e => {
                      const newStart = e.target.value;
                      setForm(prev => ({
                        ...prev, startDate: newStart,
                        endDate: prev.endDate && prev.endDate < newStart ? '' : prev.endDate,
                      }));
                    }}
                    required
                    style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    To
                  </label>
                  <input
                    type="date" className="lm-date-input"
                    value={form.endDate} min={form.startDate || today}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Tell us why
                </label>
                <textarea
                  className="lm-reason-textarea"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Family function out of town"
                  required rows={3}
                  style={{ width: '100%', padding: '11px 12px', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', padding: '10px 14px', marginBottom: '18px', fontSize: '12px', color: '#6D5DFB', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span>💡</span>
                <span>Your request goes straight to Admin/HR — whoever reviews it first will approve or decline it.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '13px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{
                    flex: 1, padding: '13px',
                    background: 'linear-gradient(135deg, #6D5DFB, #4F3DF5)', color: 'var(--text-primary)',
                    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                  }}>
                  {submitting ? 'Sending...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid #EEF0F5', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            My Requests
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{leaves.length} records</span>
        </div>

        <div className="table-responsive">
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.6fr 1.4fr 1.3fr 1fr',
            padding: '10px 22px', background: 'var(--card-bg)', borderBottom: '1px solid #F1F5F9',
          }}>
            {['Type', 'From', 'To', 'Days', 'Status', 'Reviewed by', 'Action'].map(h => (
              <div key={h} style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : leaves.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>🌴</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No requests yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Apply for your first leave whenever you need a break</div>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '10px 20px', background: '#6D5DFB', color: 'var(--text-primary)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                ✨ Apply for Leave
              </button>
            </div>
          ) : (
            <>
              {leaves.map((l, i) => {
                const typeMeta = balanceStyle[l.leaveType] || balanceStyle.UNPAID;
                const canCancel = ['PENDING', 'APPROVED'].includes(l.status);
                return (
                  <div key={l.id || i} style={{
                    display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.6fr 1.4fr 1.3fr 1fr',
                    padding: '14px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span>{typeMeta.icon}</span>{l.leaveType}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{l.startDate}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{l.endDate}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{l.totalDays}</div>
                    <div><StatusPill status={l.status} /></div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{l.reviewedByName || '—'}</div>
                    <div>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(l.id)}
                          disabled={cancelling === l.id}
                          style={{
                            padding: '6px 12px',
                            background: l.status === 'APPROVED' ? 'rgba(126, 34, 206, 0.2)' : 'rgba(220, 38, 38, 0.15)',
                            color: l.status === 'APPROVED' ? '#7E22CE' : '#DC2626',
                            border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          }}>
                          {cancelling === l.id ? '⏳' : l.status === 'APPROVED' ? 'Request Cancel' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #F1F5F9' }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: page === 0 ? '#475569' : '#1E293B', background: 'var(--card-bg)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                    ← Prev
                  </button>
                  <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: page >= totalPages - 1 ? '#475569' : '#1E293B', background: 'var(--card-bg)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}