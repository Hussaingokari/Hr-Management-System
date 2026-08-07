'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyOnboarding } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Mail, Phone, Building2, Briefcase, Calendar, Cake } from 'lucide-react';

function StatusPill({ status }) {
    const map = {
        PENDING: { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Pending' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6', label: 'In Progress' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    };
    const s = map[status] || map.PENDING;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}

function InfoField({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '2px' }}>{icon}</span>
            <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{value || '—'}</div>
            </div>
        </div>
    );
}

export default function EmployeeOnboardingProfilePage() {
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyOnboarding();
            setOnboarding(res.data?.data);
        } catch (err) {
            toast.error('Failed to load profile');
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
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Profile not available yet</div>
            </div>
        );
    }

    const initials = onboarding.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    My Profile
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    View your personal information.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
                {/* Left card */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '28px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                    <div style={{
                        width: '90px', height: '90px', borderRadius: '18px', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '30px', fontWeight: '800', color: 'white',
                    }}>
                        {initials}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {onboarding.employeeName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        {onboarding.employeeDesignation || '—'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <StatusPill status={onboarding.status} />
                    </div>
                    <span style={{ display: 'inline-block', background: 'var(--card-border)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {onboarding.employeeCode}
                    </span>
                </div>

                {/* Right info panel */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        Contact & Personal Information
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                        <InfoField icon={<Mail size={18} />} label="Email" value={onboarding.employeeEmail} />
                        <InfoField icon={<Phone size={18} />} label="Phone" value={onboarding.employeePhone} />
                        <InfoField icon={<Building2 size={18} />} label="Department" value={onboarding.department} />
                        <InfoField icon={<Briefcase size={18} />} label="Designation" value={onboarding.employeeDesignation} />
                        <InfoField icon={<Calendar size={18} />} label="Joining Date" value={onboarding.joiningDate} />
                        <InfoField icon={<Cake size={18} />} label="Date of Birth" value={onboarding.employeeDateOfBirth} />
                    </div>
                </div>
            </div>
        </div>
    );
}