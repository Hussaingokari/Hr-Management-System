'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMyOnboarding, getMyDocuments } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, FileText, CheckCircle, Hand } from 'lucide-react';

const CHECKLIST_ITEMS = [
    { key: 'offerLetterSigned', label: 'Offer Letter Signed' },
    { key: 'idProofSubmitted', label: 'ID Proof Submitted' },
    { key: 'educationDocsSubmitted', label: 'Education Docs Submitted' },
    { key: 'bankDetailsSubmitted', label: 'Bank Details Submitted' },
    { key: 'emailCreated', label: 'Email Created' },
    { key: 'systemAccessGiven', label: 'System Access Given' },
];

const DOC_KEY_LABELS = {
    OFFER_LETTER: 'Offer Letter',
    AADHAR_CARD: 'Aadhar Card',
    PAN_CARD: 'PAN Card',
    SSC_CERTIFICATE: 'SSC Certificate',
    INTER_DIPLOMA_CERTIFICATE: 'Inter / Diploma Certificate',
    DEGREE_CERTIFICATE: 'Degree Certificate',
    BANK_PASSBOOK: 'Bank Passbook',
};

function StatusPill({ status }) {
    const map = {
        UNDER_REVIEW: { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Pending' },
        APPROVED: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
        REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Pending' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}

export default function EmployeeOnboardingDashboardPage() {
    const router = useRouter();
    const [onboarding, setOnboarding] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyOnboarding();
            const onb = res.data?.data;
            setOnboarding(onb);
            if (onb?.id) {
                const docRes = await getMyDocuments(onb.id);
                setDocuments(docRes.data?.data || []);
            }
        } catch (err) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (!onboarding) {
        return (
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#94a3b8' }}><ClipboardList size={40} strokeWidth={1.5} /></div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>No onboarding checklist yet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your HR team hasn't set this up for you yet.</div>
            </div>
        );
    }

    const docsByKey = documents.reduce((acc, d) => { acc[d.documentKey] = d; return acc; }, {});
    const pendingTasksCount = CHECKLIST_ITEMS.filter(item => !onboarding[item.key]).length;
    const approvedDocsCount = documents.filter(d => d.status === 'APPROVED').length;
    const firstName = onboarding.employeeName?.split(' ')[0] || 'there';

    const STATS = [
        { label: 'Pending Tasks', value: pendingTasksCount, sub: 'To be completed', bg: '#fef9c3', icon: <Clock size={15} color="#ca8a04" /> },
        { label: 'Documents Uploaded', value: documents.length, sub: 'Total uploaded', bg: '#eff6ff', icon: <FileText size={15} color="#3b82f6" /> },
        { label: 'Approved Docs', value: approvedDocsCount, sub: 'Verified by HR', bg: '#dcfce7', icon: <CheckCircle size={15} color="#16a34a" /> },
    ];

    return (
        <div>
            {/* Welcome banner */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '16px', padding: '24px 28px', marginBottom: '20px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Welcome, {firstName}! <Hand size={22} color="#fbbf24" />
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                            {onboarding.employeeDesignation || '—'} · {onboarding.department || '—'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '28px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '26px', fontWeight: '900' }}>{onboarding.completionPercent}%</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Onboarding</div>
                        </div>
                        <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '28px' }}>
                            <div style={{ fontSize: '26px', fontWeight: '900' }}>{approvedDocsCount}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Docs Approved</div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '16px', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--card-bg)', width: `${onboarding.completionPercent}%`, borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '18px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{s.label}</span>
                            <div style={{ width: '30px', height: '30px', background: s.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Onboarding Checklist preview */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Onboarding Checklist</div>
                        <button
                            onClick={() => router.push('/employee/onboarding/checklist')}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            View all
                        </button>
                    </div>
                    {CHECKLIST_ITEMS.map(item => (
                        <div key={item.key} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '13px 14px', marginBottom: '8px', borderRadius: '10px',
                            background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</span>
                            <StatusPill status={onboarding[item.key] ? 'APPROVED' : 'UNDER_REVIEW'} />
                        </div>
                    ))}
                </div>

                {/* Recent Documents preview */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Recent Documents</div>
                        <button
                            onClick={() => router.push('/employee/onboarding/documents')}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            View all
                        </button>
                    </div>
                    {documents.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No documents uploaded yet.
                        </div>
                    ) : (
                        documents.slice(0, 5).map(doc => (
                            <div key={doc.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '13px 14px', marginBottom: '8px', borderRadius: '10px',
                                background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                            }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                                    <FileText size={16} />
                                </div>
                                <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {DOC_KEY_LABELS[doc.documentKey] || doc.documentKey}
                                </span>
                                <StatusPill status={doc.status} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}