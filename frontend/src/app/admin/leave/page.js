'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, XCircle, Undo2, Coffee, HeartPulse, Sun, Baby, PersonStanding, ClipboardList, PartyPopper, Loader2 } from 'lucide-react';

function StatusPill({ status }) {
  const map = {
    APPROVED: { bg: 'rgba(22, 163, 74, 0.15)', color: '#15803D', icon: <CheckCircle size={14} /> },
    PENDING: { bg: 'rgba(180, 83, 9, 0.2)', color: '#B45309', icon: <Clock size={14} /> },
    REJECTED: { bg: 'rgba(220, 38, 38, 0.15)', color: '#B91C1C', icon: <XCircle size={14} /> },
    CANCELLATION_PENDING: { bg: 'rgba(126, 34, 206, 0.2)', color: '#7E22CE', icon: <Undo2 size={14} /> },
    CANCELLED: { bg: '#1E293B', color: 'var(--text-secondary)', icon: '·' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '999px',
      fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{ display: 'flex' }}>{s.icon}</span>{status?.replace(/_/g, ' ')}
    </span>
  );
}

const typeMeta = {
  ANNUAL: { icon: <Coffee size={16} />, color: '#4F46E5' },
  SICK: { icon: <HeartPulse size={16} />, color: '#0D9488' },
  CASUAL: { icon: <Sun size={16} />, color: '#D97706' },
  PATERNITY: { icon: <Baby size={16} />, color: '#8B5CF6' },
  MATERNITY: { icon: <PersonStanding size={16} />, color: '#DB2777' },
  UNPAID: { icon: <ClipboardList size={16} />, color: 'var(--text-secondary)' },
};

export default function AdminLeavePage() {
  const [tab, setTab] = useState('PENDING');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'PENDING') {
        const res = await api.get(`/api/leaves/pending?page=${page}&size=20`);
        const data = res.data?.data;
        setPending(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else if (tab === 'CANCELLATIONS') {
        const res = await api.get(`/api/leaves/pending-cancellations?page=${page}&size=20`);
        const data = res.data?.data;
        setCancellations(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else {
        // Approved / Rejected — pulled from the full history and filtered by status.
        // Shows the most recent 100 records; no separate backend endpoint per status yet.
        const res = await api.get(`/api/leaves?page=0&size=100`);
        const all = res.data?.data?.content || [];
        if (tab === 'APPROVED') setApproved(all.filter(l => l.status === 'APPROVED'));
        if (tab === 'REJECTED') setRejected(all.filter(l => l.status === 'REJECTED'));
        setTotalPages(0);
      }
    } catch (err) {
      toast.error("Couldn't load requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Either Admin or HR can approve/reject — first click wins
  const handleAction = async (id, action) => {
    setActioning(id + action);
    try {
      await api.put(`/api/leaves/${id}/action`, {
        action,
        remarks: action === 'APPROVED' ? 'Approved' : 'Rejected',
      });
      toast.success(action === 'APPROVED' ? '✅ Leave approved!' : '❌ Leave rejected');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? '⚡ Someone already actioned this one' : msg);
      fetchData();
    } finally {
      setActioning(null);
    }
  };

  const handleCancelAction = async (id, approve) => {
    setActioning(id + approve);
    try {
      await api.put(`/api/leaves/${id}/cancel-action`, {
        approve,
        remarks: approve ? 'Cancellation confirmed' : 'Cancellation denied',
      });
      toast.success(approve ? 'Cancellation confirmed!' : 'Cancellation denied');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? '⚡ Already resolved by someone else' : msg);
      fetchData();
    } finally {
      setActioning(null);
    }
  };

  const currentData =
    tab === 'PENDING' ? pending :
      tab === 'APPROVED' ? approved :
        tab === 'REJECTED' ? rejected :
          cancellations;

  const tabs = [
    { key: 'PENDING', label: `Pending Approvals (${pending.length})`, icon: <Clock size={16} /> },
    { key: 'APPROVED', label: `Approved (${approved.length})`, icon: <CheckCircle size={16} /> },
    { key: 'REJECTED', label: `Rejected (${rejected.length})`, icon: <XCircle size={16} /> },
    { key: 'CANCELLATIONS', label: `Cancellations (${cancellations.length})`, icon: <Undo2 size={16} /> },
  ];

  const lastColumnLabel =
    tab === 'PENDING' || tab === 'CANCELLATIONS' ? 'Actions' : 'Reviewed By';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={28} /> Leave Requests
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Shared queue — any Admin or HR teammate can approve or decline. First one in settles it.
        </p>
      </div>

      {/* Flow indicator */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: '16px', padding: '14px 20px',
        border: '1px solid #EEF0F5', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      }}>
        <span style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
          1. Employee applies
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>→</span>
        <span style={{ background: 'rgba(180, 83, 9, 0.2)', color: '#B45309', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
          2. Admin or HR reviews
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>→</span>
        <span style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#15803D', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
          3. Approved ✅ / Rejected
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F0FA', borderRadius: '14px', padding: '4px', width: 'fit-content', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setPage(0); }}
            style={{
              padding: '9px 18px',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1E293B' : '#94A3B8',
              border: 'none', borderRadius: '11px', fontSize: '13px',
              fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer',
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid #EEF0F5', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1fr 0.5fr 1.3fr 2fr',
          padding: '10px 22px', background: 'var(--card-bg)', borderBottom: '1px solid #F1F5F9',
        }}>
          {['Employee', 'Type', 'From', 'To', 'Days', 'Status', lastColumnLabel].map(h => (
            <div key={h} style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : currentData.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#16a34a' }}>
              <PartyPopper size={48} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>All clear!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No {tab === 'PENDING' ? 'leaves waiting on a decision'
                : tab === 'APPROVED' ? 'approved leaves yet'
                  : tab === 'REJECTED' ? 'rejected leaves'
                    : 'pending cancellations'} right now
            </div>
          </div>
        ) : (
          <>
            {currentData.map((l) => {
              const m = typeMeta[l.leaveType] || typeMeta.UNPAID;
              return (
                <div key={l.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1fr 0.5fr 1.3fr 2fr',
                  padding: '14px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${m.color}, ${m.color}CC)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0,
                    }}>
                      {(l.employeeName || '').split(' ').map(n => n[0] || '').join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{l.employeeName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        &quot;{l.reason?.substring(0, 25)}{l.reason?.length > 25 ? '...' : ''}&quot;
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{m.icon}</span>{l.leaveType}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{l.startDate}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{l.endDate}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{l.totalDays}</div>
                  <StatusPill status={l.status} />

                  <div>
                    {tab === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAction(l.id, 'APPROVED')}
                          disabled={!!actioning}
                          style={{
                            padding: '7px 14px', background: 'rgba(22, 163, 74, 0.15)', color: '#15803D',
                            border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: 700,
                            cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '85px'
                          }}>
                          {actioning === l.id + 'APPROVED' ? <Loader2 size={14} className="animate-spin" /> : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(l.id, 'REJECTED')}
                          disabled={!!actioning}
                          style={{
                            padding: '7px 14px', background: 'rgba(220, 38, 38, 0.15)', color: '#DC2626',
                            border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '80px'
                          }}>
                          {actioning === l.id + 'REJECTED' ? <Loader2 size={14} className="animate-spin" /> : '✗ Reject'}
                        </button>
                      </div>
                    )}

                    {tab === 'CANCELLATIONS' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCancelAction(l.id, true)}
                          disabled={!!actioning}
                          style={{
                            padding: '7px 14px', background: 'rgba(22, 163, 74, 0.15)', color: '#15803D',
                            border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '85px'
                          }}>
                          {actioning === l.id + 'true' ? <Loader2 size={14} className="animate-spin" /> : '✓ Confirm'}
                        </button>
                        <button
                          onClick={() => handleCancelAction(l.id, false)}
                          disabled={!!actioning}
                          style={{
                            padding: '7px 14px', background: 'rgba(220, 38, 38, 0.15)', color: '#DC2626',
                            border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '80px'
                          }}>
                          {actioning === l.id + 'false' ? <Loader2 size={14} className="animate-spin" /> : '✗ Deny'}
                        </button>
                      </div>
                    )}

                    {(tab === 'APPROVED' || tab === 'REJECTED') && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {l.reviewedByName || '—'}
                        </div>
                        {l.remarks && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            &quot;{l.remarks}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {(tab === 'PENDING' || tab === 'CANCELLATIONS') && totalPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: page === 0 ? '#475569' : '#1E293B', background: 'var(--card-bg)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
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
  );
}