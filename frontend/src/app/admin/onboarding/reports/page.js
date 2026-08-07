'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const DEPT_COLORS = ['#4f46e5', '#3b82f6', '#eda100', '#1baf7a', '#e34948', '#e87ba4'];

export default function OnboardingReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/onboarding/reports');
            setData(res.data?.data);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    if (loading || !data) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    const STATS = [
        { label: 'Total Employees', value: data.totalEmployees, bg: '#eef2ff', color: '#4f46e5', icon: '👥' },
        { label: 'Approved Docs', value: data.approvedDocs, bg: '#dcfce7', color: '#16a34a', icon: '✅' },
        { label: 'Pending Docs', value: data.pendingDocs, bg: '#fef9c3', color: '#ca8a04', icon: '📄' },
        { label: 'Rejected Docs', value: data.rejectedDocs, bg: '#fee2e2', color: '#dc2626', icon: '⚠️' },
    ];

    const deptEntries = Object.entries(data.employeesByDepartment || {});
    const maxDeptCount = Math.max(...deptEntries.map(([, v]) => v), 1);

    const statusTotal = data.notStarted + data.inProgress + data.completed || 1;
    const statusSegments = [
        { label: 'Not Started', value: data.notStarted, color: 'var(--text-muted)' },
        { label: 'In Progress', value: data.inProgress, color: '#4f46e5' },
        { label: 'Completed', value: data.completed, color: '#16a34a' },
    ];

    // Build conic-gradient stops for the donut
    let cumulative = 0;
    const gradientStops = statusSegments.map(seg => {
        const start = (cumulative / statusTotal) * 360;
        cumulative += seg.value;
        const end = (cumulative / statusTotal) * 360;
        return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Reports & Analytics
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Insights into your onboarding pipeline.
                </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '18px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{s.label}</span>
                            <div style={{ width: '30px', height: '30px', background: s.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Employees by department */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
                        Employees by Department
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px', paddingBottom: '4px' }}>
                        {deptEntries.map(([dept, count], i) => (
                            <div key={dept} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{count}</span>
                                <div style={{
                                    width: '100%', maxWidth: '48px',
                                    height: `${(count / maxDeptCount) * 100}%`,
                                    minHeight: '6px',
                                    background: DEPT_COLORS[i % DEPT_COLORS.length],
                                    borderRadius: '6px 6px 0 0',
                                }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        {deptEntries.map(([dept]) => (
                            <div key={dept} style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', wordBreak: 'break-word' }}>{dept}</div>
                        ))}
                    </div>
                </div>

                {/* Onboarding status donut */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
                        Onboarding Status
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%',
                            background: `conic-gradient(${gradientStops})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--card-bg)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        {statusSegments.map(seg => (
                            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: seg.color }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{seg.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}