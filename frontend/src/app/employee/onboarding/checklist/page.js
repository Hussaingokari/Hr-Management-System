'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyOnboarding } from '@/lib/employeeApi';
import toast from 'react-hot-toast';

const CHECKLIST_ITEMS = [
    { key: 'offerLetterSigned', label: 'Offer Letter Signed', icon: '📄' },
    { key: 'idProofSubmitted', label: 'ID Proof Submitted', icon: '🪪' },
    { key: 'educationDocsSubmitted', label: 'Education Docs Submitted', icon: '🎓' },
    { key: 'bankDetailsSubmitted', label: 'Bank Details Submitted', icon: '🏦' },
    { key: 'emailCreated', label: 'Email Created', icon: '📧' },
    { key: 'systemAccessGiven', label: 'System Access Given', icon: '🔐' },
];

export default function EmployeeOnboardingChecklistPage() {
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyOnboarding();
            setOnboarding(res.data?.data);
        } catch (err) {
            toast.error('Failed to load checklist');
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
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No onboarding checklist yet</div>
            </div>
        );
    }

    const pendingItems = CHECKLIST_ITEMS.filter(item => !onboarding[item.key]);
    const completedItems = CHECKLIST_ITEMS.filter(item => onboarding[item.key]);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Onboarding Checklist
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Track your onboarding progress — {onboarding.completionPercent}% complete.
                </p>
            </div>

            <div style={{ marginBottom: '20px', height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '4px',
                    background: onboarding.completionPercent === 100 ? '#16a34a' : '#4f46e5',
                    width: `${onboarding.completionPercent}%`, transition: 'width 0.5s',
                }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Pending box */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--card-border)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', background: '#fef9c3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                        }}>⏳</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            To Do ({pendingItems.length})
                        </div>
                    </div>

                    {pendingItems.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Nothing pending — great job! 🎉
                        </div>
                    ) : (
                        pendingItems.map(item => (
                            <div key={item.key} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', marginBottom: '10px', borderRadius: '12px',
                                background: '#fffbeb', border: '1px solid #fde68a',
                            }}>
                                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                                <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#92400e' }}>{item.label}</span>
                                <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                    Pending
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Completed box */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--card-border)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', background: '#dcfce7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                        }}>✅</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            Completed ({completedItems.length})
                        </div>
                    </div>

                    {completedItems.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Nothing completed yet.
                        </div>
                    ) : (
                        completedItems.map(item => (
                            <div key={item.key} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', marginBottom: '10px', borderRadius: '12px',
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                            }}>
                                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                                <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#166534' }}>{item.label}</span>
                                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                    Done
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}