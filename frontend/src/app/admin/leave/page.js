'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getPendingLeaves,
  getPendingCancellations,
  leaveAction,
  cancelAction,
} from '@/lib/adminApi';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

function Badge({ status }) {
  const map = {
    APPROVED:             { bg: '#dcfce7', color: '#16a34a' },
    PENDING:              { bg: '#fef9c3', color: '#ca8a04' },
    REJECTED:             { bg: '#fee2e2', color: '#dc2626' },
    HR_PENDING:           { bg: '#fff7ed', color: '#f59e0b' },
    MANAGER_PENDING:      { bg: '#eff6ff', color: '#3b82f6' },
    CANCELLATION_PENDING: { bg: '#fdf4ff', color: '#9333ea' },
    CANCELLED:            { bg: '#f1f5f9', color: '#64748b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminLeavePage() {
  const [tab, setTab] = useState('PENDING');
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actioning, setActioning]       = useState(null);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(0);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await api.get(`/api/leaves/pending?page=0&size=100`);
    const all = res.data?.data?.content || [];

    if (tab === 'PENDING') {
      const filtered = all.filter(l => l.status === 'PENDING');
      setPendingLeaves(filtered);
    } else if (tab === 'CANCELLATIONS') {
      try {
        const cancelRes = await getPendingCancellations(page, 10);
        setCancellations(cancelRes.data?.data?.content || []);
      } catch (e) {
        console.error('Failed to fetch pending cancellations:', e);
        setCancellations([]);
      }
    }
  } catch (err) {
    toast.error('Failed to load leaves');
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [tab, page]);

useEffect(() => {
  const timer = setTimeout(() => {
    fetchData();
  }, 0);
  return () => clearTimeout(timer);
}, [fetchData]);

  const handleAction = async (id, action) => {
    setActioning(id + action);
    try {
      await leaveAction(
        id, action,
        action === 'APPROVED' ? 'Approved' : 'Rejected'
      );
      toast.success(action === 'APPROVED' ? '✅ Leave approved!' : '❌ Leave rejected!');
      setPendingLeaves(prev => prev.map(l => {
        if (l.id === id) {
          return { ...l, status: action, actionTaken: true };
        }
        return l;
      }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? '⚡ Someone already actioned this one' : msg);
    } finally {
      setActioning(null);
    }
  };

  const handleCancelAction = async (id, approve) => {
    setActioning(id + approve);
    try {
      await cancelAction(
        id, approve,
        approve ? 'Cancellation confirmed by HR' : 'Cancellation denied by HR'
      );
      toast.success(approve ? 'Cancellation approved!' : 'Cancellation denied!');
      setCancellations(prev => prev.map(l => {
        if (l.id === id) {
          return { ...l, status: approve ? 'CANCELLED' : 'APPROVED', actionTaken: true };
        }
        return l;
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActioning(null);
    }
  };

  const currentData = tab === 'PENDING' ? pendingLeaves : cancellations;

  const tabs = [
    { key: 'PENDING',       label: `Pending Approvals (${pendingLeaves.length})` },
    { key: 'CANCELLATIONS', label: `Cancellations (${cancellations.length})` },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Leave Approvals
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Manage employee leave requests and cancellations
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '4px',
        background: '#f1f5f9', borderRadius: '10px',
        padding: '4px', width: 'fit-content',
        marginBottom: '20px',
      }}>
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setPage(0); }}
            style={{
              padding: '8px 16px',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1e293b' : '#64748b',
              border: 'none', borderRadius: '8px',
              fontSize: '13px',
              fontWeight: tab === t.key ? '700' : '400',
              cursor: 'pointer',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-responsive" style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.5fr 1.5fr 2fr',
          padding: '10px 20px', background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {['Employee', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            Loading...
          </div>
        ) : currentData.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              All clear!
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              No {tab === 'PENDING' ? 'leaves awaiting approval' : 'pending cancellations'}
            </div>
          </div>
        ) : (
          <>
            {currentData.map((l, i) => (
              <div key={l.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.5fr 1.5fr 2fr',
                padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0,
                  }}>
                    {l.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                      {l.employeeName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                      &quot;{l.reason?.substring(0, 25)}{l.reason?.length > 25 ? '...' : ''}&quot;
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  {l.leaveType}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{l.startDate}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{l.endDate}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                  {l.totalDays}
                </div>
                <Badge status={l.approvalStage || l.status}/>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {tab === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(l.id, 'APPROVED')}
                        disabled={!!actioning || l.actionTaken}
                        style={{
                          padding: '6px 12px', background: l.actionTaken ? '#f1f5f9' : '#dcfce7',
                          color: l.actionTaken ? '#94a3b8' : '#16a34a', border: '1px solid ' + (l.actionTaken ? '#e2e8f0' : '#bbf7d0'),
                          borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          cursor: l.actionTaken ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                        }}>
                        {actioning === l.id + 'APPROVED' ? '⏳' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(l.id, 'REJECTED')}
                        disabled={!!actioning || l.actionTaken}
                        style={{
                          padding: '6px 12px', background: l.actionTaken ? '#f1f5f9' : '#fee2e2',
                          color: l.actionTaken ? '#94a3b8' : '#dc2626', border: '1px solid ' + (l.actionTaken ? '#e2e8f0' : '#fecaca'),
                          borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          cursor: l.actionTaken ? 'not-allowed' : 'pointer',
                        }}>
                        {actioning === l.id + 'REJECTED' ? '⏳' : '✗ Reject'}
                      </button>
                    </>
                  )}

                  {tab === 'CANCELLATIONS' && (
                    <>
                      <button
                        onClick={() => handleCancelAction(l.id, true)}
                        disabled={!!actioning || l.actionTaken}
                        style={{
                          padding: '6px 12px', background: l.actionTaken ? '#f1f5f9' : '#dcfce7',
                          color: l.actionTaken ? '#94a3b8' : '#16a34a', border: '1px solid ' + (l.actionTaken ? '#e2e8f0' : '#bbf7d0'),
                          borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          cursor: l.actionTaken ? 'not-allowed' : 'pointer',
                        }}>
                        {actioning === l.id + 'true' ? '⏳' : '✓ Confirm'}
                      </button>
                      <button
                        onClick={() => handleCancelAction(l.id, false)}
                        disabled={!!actioning || l.actionTaken}
                        style={{
                          padding: '6px 12px', background: l.actionTaken ? '#f1f5f9' : '#fee2e2',
                          color: l.actionTaken ? '#94a3b8' : '#dc2626', border: '1px solid ' + (l.actionTaken ? '#e2e8f0' : '#fecaca'),
                          borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          cursor: l.actionTaken ? 'not-allowed' : 'pointer',
                        }}>
                        {actioning === l.id + 'false' ? '⏳' : '✗ Deny'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
                  {page + 1} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
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