'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FileText, Loader2 } from 'lucide-react';

const DOC_KEY_LABELS = {
  OFFER_LETTER: 'Offer Letter',
  AADHAR_CARD: 'Aadhar Card',
  PAN_CARD: 'PAN Card',
  SSC_CERTIFICATE: 'SSC Certificate',
  INTER_DIPLOMA_CERTIFICATE: 'Inter / Diploma Certificate',
  DEGREE_CERTIFICATE: 'Degree Certificate',
  BANK_PASSBOOK: 'Bank Passbook',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function StatusPill({ status }) {
  const map = {
    UNDER_REVIEW: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
    APPROVED: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  };
  const s = map[status] || map.UNDER_REVIEW;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

function RejectModal({ doc, onClose, onConfirm, submitting }) {
  const [remarks, setRemarks] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '24px', width: '420px', maxWidth: '90%' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Reject {DOC_KEY_LABELS[doc.documentKey] || doc.documentKey}?</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>{doc.employeeName} · {doc.employeeCode}</div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Reason for rejection</label>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Photo is blurry, please upload a clearer image." rows={3} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: '9px 16px', background: 'var(--card-border)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(remarks)} disabled={submitting || !remarks.trim()} style={{ padding: '9px 16px', background: remarks.trim() ? '#dc2626' : '#fca5a5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: remarks.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : 'Reject Document'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ doc, tab, onApprove, onReject, actingId, highlighted }) {
  const isActing = actingId === doc.id;
  return (
    <div
      id={`document-${doc.id}`}
      style={{
        background: highlighted ? 'rgba(79,70,229,0.08)' : 'var(--card-bg)',
        borderRadius: '12px',
        border: highlighted ? '2px solid rgba(79,70,229,0.55)' : '1px solid var(--card-border)',
        padding: '18px 20px',
        marginBottom: '12px',
        boxShadow: highlighted ? '0 8px 24px rgba(79,70,229,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.25s'
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{DOC_KEY_LABELS[doc.documentKey] || doc.documentKey}</span>
            <StatusPill status={doc.status} />
          </div>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '2px' }}>{doc.employeeName} · {doc.employeeCode}</div>
          {doc.status === 'REJECTED' && doc.rejectionRemarks && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Remarks: {doc.rejectionRemarks}</div>}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Uploaded {timeAgo(doc.uploadedAt)}
            {doc.fileUrl && <> · <a href={doc.fileUrl?.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${doc.fileUrl}` : doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>View file</a></>}
          </div>
        </div>

        {tab === 'PENDING' && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => onApprove(doc)} disabled={isActing} style={{ padding: '7px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: isActing ? 'not-allowed' : 'pointer', opacity: isActing ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {isActing ? <><Loader2 size={12} className="animate-spin" /> ...</> : 'Approve'}
            </button>
            <button onClick={() => onReject(doc)} disabled={isActing} style={{ padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: isActing ? 'not-allowed' : 'pointer' }}>Reject</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentRequestsPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId');

  const [tab, setTab] = useState('PENDING');
  const [docs, setDocs] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get('/api/onboarding/documents/counts');
      setCounts(res.data?.data || { pending: 0, approved: 0, rejected: 0 });
    } catch {}
  }, []);

  const fetchDocs = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/onboarding/documents?status=${status}`);
      setDocs(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Notification links should open the pending approval queue.
  useEffect(() => {
    if (highlightId) setTab('PENDING');
  }, [highlightId]);

  useEffect(() => { fetchDocs(tab); fetchCounts(); }, [tab, fetchDocs, fetchCounts]);

  useEffect(() => {
    if (!highlightId || loading) return;
    const target = docs.find((doc) => String(doc.id) === String(highlightId));
    if (!target) return;

    const element = document.getElementById(`document-${highlightId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      element.style.boxShadow = '0 8px 24px rgba(79,70,229,0.18)';
    }, 50);

    const clearTimer = setTimeout(() => {
      element.style.boxShadow = '';
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [highlightId, loading, docs]);

  const handleApprove = async (doc) => {
    setActingId(doc.id);
    try {
      await api.put(`/api/onboarding/documents/${doc.id}/approve`);
      toast.success(`${DOC_KEY_LABELS[doc.documentKey] || doc.documentKey} approved`);
      await Promise.all([fetchDocs(tab), fetchCounts()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (remarks) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await api.put(`/api/onboarding/documents/${rejectTarget.id}/reject`, { remarks });
      toast.success(`${DOC_KEY_LABELS[rejectTarget.documentKey] || rejectTarget.documentKey} rejected`);
      setRejectTarget(null);
      await Promise.all([fetchDocs(tab), fetchCounts()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const TABS = [
    { key: 'PENDING', label: 'Pending', count: counts.pending },
    { key: 'APPROVED', label: 'Approved', count: counts.approved },
    { key: 'REJECTED', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>Document Requests</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Review, approve, or reject employee documents.</p>
      </div>

      <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '6px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: tab === t.key ? '#4f46e5' : 'transparent',
            color: tab === t.key ? 'white' : '#64748b', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s',
          }}>
            {t.label}
            <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: tab === t.key ? 'white' : '#64748b', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : docs.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed #e2e8f0', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><FileText size={40} strokeWidth={1.5} /></div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>No {tab.toLowerCase()} documents</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tab === 'PENDING' ? "All caught up — no documents awaiting review." : `Nothing in ${tab.toLowerCase()} yet.`}</div>
        </div>
      ) : (
        docs.map(doc => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            tab={tab}
            onApprove={handleApprove}
            onReject={setRejectTarget}
            actingId={actingId}
            highlighted={String(doc.id) === String(highlightId)}
          />
        ))
      )}

      {rejectTarget && (
        <RejectModal
          doc={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          submitting={rejecting}
        />
      )}
    </div>
  );
}
