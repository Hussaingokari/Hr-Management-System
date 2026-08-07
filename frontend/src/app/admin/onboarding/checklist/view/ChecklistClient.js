'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

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

function DocStatusBadge({ status }) {
    const map = {
        UNDER_REVIEW: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
        APPROVED: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
        REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Not submitted' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            {s.label}
        </span>
    );
}

function StatusPill({ status }) {
    const map = {
        PENDING: { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Pending' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6', label: 'In Progress' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    };
    const s = map[status] || map.PENDING;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            {s.label}
        </span>
    );
}

export default function OnboardingProfilePage() {
    const searchParams = useSearchParams();
    const onboardingId = searchParams?.get('id');
    const router = useRouter();
    const [onboarding, setOnboarding] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState({});
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [onbRes, docRes] = await Promise.all([
                api.get(`/api/onboarding/${onboardingId}`),
                api.get(`/api/onboarding/documents/${onboardingId}`),
            ]);
            const onb = onbRes.data?.data;
            setOnboarding(onb);
            setDocuments(docRes.data?.data || []);
            const cl = {};
            CHECKLIST_ITEMS.forEach(item => { cl[item.key] = onb?.[item.key] || false; });
            setChecklist(cl);
            setRemarks(onb?.remarks || '');
        } catch (err) {
            toast.error('Failed to load employee profile');
        } finally {
            setLoading(false);
        }
    }, [onboardingId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleItem = (key) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put(`/api/onboarding/${onboardingId}`, { ...checklist, remarks });
            const updated = res.data?.data;
            setOnboarding(updated);
            toast.success('Checklist updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const docsByKey = documents.reduce((acc, d) => { acc[d.documentKey] = d; return acc; }, {});

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (!onboarding) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Employee not found.</div>;
    }

    const initials = onboarding.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2);

    return (
        <div>
            <button
                onClick={() => router.push('/admin/onboarding/checklist')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ← Back to Dashboard
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '16px', margin: '0 auto 14px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', fontWeight: '800', color: 'white',
                    }}>
                        {initials}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {onboarding.employeeName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        {onboarding.employeeDesignation || '—'}
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <StatusPill status={onboarding.status} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Onboarding Progress</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5' }}>{onboarding.completionPercent}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#4f46e5', width: `${onboarding.completionPercent}%`, borderRadius: '3px' }} />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                        {[
                            { label: 'Email', value: onboarding.employeeEmail },
                            { label: 'Phone', value: onboarding.employeePhone },
                            { label: 'Department', value: onboarding.department },
                            { label: 'Joining Date', value: onboarding.joiningDate },
                            { label: 'Date of Birth', value: onboarding.employeeDateOfBirth },
                            { label: 'Assigned HR', value: onboarding.assignedHrName },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '12px', minWidth: 0 }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{f.label}</div>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                    fontWeight: '500',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                }}>
                                    {f.value || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                ✅ Onboarding Checklist
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                Click a row to check/uncheck, then Save
                            </div>
                        </div>
                        {CHECKLIST_ITEMS.map((item, i) => (
                            <label key={item.key}
                                htmlFor={`checklist-${item.key}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px 8px', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                                    cursor: 'pointer', borderRadius: '8px',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <input
                                    id={`checklist-${item.key}`}
                                    type="checkbox"
                                    checked={!!checklist[item.key]}
                                    onChange={() => toggleItem(item.key)}
                                    style={{
                                        width: '18px', height: '18px', flexShrink: 0,
                                        accentColor: '#16a34a', cursor: 'pointer',
                                    }}
                                />
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                    background: checklist[item.key] ? '#16a34a' : '#f1f5f9',
                                    color: checklist[item.key] ? 'white' : '#64748b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: '700',
                                }}>
                                    {checklist[item.key] ? '✓' : i + 1}
                                </div>
                                <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: checklist[item.key] ? '#16a34a' : '#1e293b' }}>
                                    {item.label}
                                </div>
                                <span style={{
                                    background: checklist[item.key] ? '#dcfce7' : '#f1f5f9',
                                    color: checklist[item.key] ? '#16a34a' : '#64748b',
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                }}>
                                    {checklist[item.key] ? 'Done' : 'Pending'}
                                </span>
                            </label>
                        ))}

                        <div style={{ marginTop: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                                Remarks
                            </label>
                            <textarea
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                rows={2}
                                placeholder="Add any remarks about the onboarding..."
                                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%', marginTop: '14px', padding: '12px',
                                background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1,
                            }}>
                            {saving ? '⏳ Saving...' : '💾 Save Checklist'}
                        </button>
                    </div>

                    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                            📄 Documents
                        </div>
                        {Object.keys(DOC_KEY_LABELS).map((key, i) => {
                            const doc = docsByKey[key];
                            return (
                                <div key={key} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                                        📄
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{DOC_KEY_LABELS[key]}</div>
                                        {doc?.fileUrl && (
                                            <a href={doc.fileUrl?.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${doc.fileUrl}` : doc.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3b82f6' }}>
                                                View file
                                            </a>
                                        )}
                                        {doc?.status === 'REJECTED' && doc?.rejectionRemarks && (
                                            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                                                Remarks: {doc.rejectionRemarks}
                                            </div>
                                        )}
                                    </div>
                                    <DocStatusBadge status={doc?.status} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}