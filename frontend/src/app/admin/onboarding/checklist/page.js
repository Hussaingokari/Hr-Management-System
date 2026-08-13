'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
    const map = {
        PENDING: { bg: '#fef9c3', color: '#ca8a04' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            {status?.replace('_', ' ')}
        </span>
    );
}

export default function AdminChecklistPage() {
    const router = useRouter();
    const [onboardings, setOnboardings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initEmpId, setInitEmpId] = useState('');
    const [initializing, setInitializing] = useState(false);
    const [tab, setTab] = useState('ALL');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [onbRes, empRes] = await Promise.allSettled([
                api.get('/api/onboarding'),
                getAllEmployees(0, 100),
            ]);
            if (onbRes.status === 'fulfilled') {
                setOnboardings(onbRes.value.data?.data?.content || []);
            }
            if (empRes.status === 'fulfilled') {
                setEmployees(empRes.value.data?.data?.content || []);
            }
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { fetchAll(); }, 0);
        return () => clearTimeout(timer);
    }, [fetchAll]);

    const handleInit = async () => {
        if (!initEmpId) { toast.error('Select an employee'); return; }
        setInitializing(true);
        try {
            await api.post(`/api/onboarding/init/${initEmpId}`);
            toast.success('Onboarding initialized!');
            setInitEmpId('');
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initialize');
        } finally { setInitializing(false); }
    };

    const filtered = tab === 'ALL'
        ? onboardings
        : tab === 'PENDING'
            ? onboardings.filter(o => o.status === 'PENDING')
            : tab === 'IN_PROGRESS'
                ? onboardings.filter(o => o.status === 'IN_PROGRESS')
                : onboardings.filter(o => o.status === 'COMPLETED');

    const completedCount = onboardings.filter(o => o.status === 'COMPLETED').length;
    const inProgressCount = onboardings.filter(o => o.status === 'IN_PROGRESS').length;
    const pendingCount = onboardings.filter(o => o.status === 'PENDING').length;

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Onboarding Checklists
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Initialize and track employee onboarding checklists
                </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                {[
                    { label: 'Total', value: onboardings.length, color: '#1e3a5f', bg: '#eff6ff', icon: '📋' },
                    { label: 'Pending', value: pendingCount, color: '#ca8a04', bg: '#fef9c3', icon: '⏳' },
                    { label: 'In Progress', value: inProgressCount, color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
                    { label: 'Completed', value: completedCount, color: '#16a34a', bg: '#dcfce7', icon: '✅' },
                ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: 'var(--card-bg)', borderRadius: '12px', padding: '16px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{s.label}</span>
                            <div style={{ width: '28px', height: '28px', background: s.bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                    🚀 Initialize New Onboarding
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select value={initEmpId} onChange={e => setInitEmpId(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}>
                        <option value="">Select employee to onboard...</option>
                        {employees
                            .filter(e => !onboardings.find(o => o.employeeId === e.id))
                            .map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} — {e.employeeCode}
                                </option>
                            ))
                        }
                    </select>
                    <button onClick={handleInit} disabled={initializing || !initEmpId}
                        style={{
                            padding: '10px 24px', background: initEmpId ? '#1e3a5f' : '#cbd5e1',
                            color: 'white', border: 'none', borderRadius: '10px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: initEmpId ? 'pointer' : 'not-allowed',
                        }}>
                        {initializing ? '⏳ Initializing...' : '+ Initialize'}
                    </button>
                </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '4px', background: 'var(--bg-primary)' }}>
                    {[
                        { key: 'ALL', label: 'All' },
                        { key: 'PENDING', label: 'Pending' },
                        { key: 'IN_PROGRESS', label: 'In Progress' },
                        { key: 'COMPLETED', label: 'Done' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{
                                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                                fontWeight: tab === t.key ? '700' : '400',
                                background: tab === t.key ? 'var(--text-primary)' : 'transparent',
                                color: tab === t.key ? 'var(--bg-primary)' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer',
                                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No onboarding records</div>
                    </div>
                ) : (
                    filtered.map((onb) => (
                        <div key={onb.id} onClick={() => router.push(`/admin/onboarding/checklist/view?id=${onb.id}`)}
                            style={{
                                padding: '14px 20px', borderBottom: '1px solid var(--card-border)', cursor: 'pointer',
                                transition: 'all 0.15s', backgroundColor: 'transparent'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                                        {onb.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{onb.employeeName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{onb.employeeCode} · {onb.department}</div>
                                    </div>
                                </div>
                                <Badge status={onb.status} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completion</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6' }}>
                                        {onb.completionPercent}%
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px',
                                        background: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6',
                                        width: `${onb.completionPercent}%`, transition: 'width 0.5s',
                                    }} />
                                </div>
                            </div>

                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                Joining: {onb.joiningDate} · HR: {onb.assignedHrName}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}