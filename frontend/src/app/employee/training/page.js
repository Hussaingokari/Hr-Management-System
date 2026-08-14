'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
    BookOpen, Calendar, Clock, User, Users, MapPin,
    ExternalLink, CheckCircle2, Award, Sparkles, Loader2, Inbox
} from 'lucide-react';

function useCurrentEmployeeId() {
    const user = useSelector((state) => state.auth.user);
    return user?.employeeId ?? user?.id ?? null;
}

function Badge({ status }) {
    const map = {
        UPCOMING: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
        ONGOING: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
        COMPLETED: { bg: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.2)' },
        CANCELLED: { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.2)' },
        ENROLLED: { bg: 'rgba(147, 51, 234, 0.1)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.2)' },
        DROPPED: { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.2)' },
        FAILED: { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.2)' },
        ONLINE: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
        OFFLINE: { bg: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.2)' },
        HYBRID: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    };
    const s = map[status] || { bg: 'var(--card-border)', color: 'var(--text-secondary)', border: 'transparent' };
    return (
        <span style={{
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            {status}
        </span>
    );
}

const TABS = [
    { key: 'available', label: 'Available Programs' },
    { key: 'mine', label: 'My Learning Path' },
];

export default function EmployeeTrainingPage() {
    const employeeId = useCurrentEmployeeId();
    const [tab, setTab] = useState('available');
    const [trainings, setTrainings] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);

    const today = new Date().toISOString().split("T")[0];

    // Dynamic status evaluation
    const getDynamicStatus = useCallback((t) => {
        if (t.status === 'CANCELLED') return 'CANCELLED';
        if (!t.startDate || !t.endDate) return t.status || 'UPCOMING';

        if (today < t.startDate) return 'UPCOMING';
        if (today >= t.startDate && today <= t.endDate) return 'ONGOING';
        if (today > t.endDate) return 'COMPLETED';

        return t.status || 'UPCOMING';
    }, [today]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [tRes, mRes] = await Promise.all([
                api.get('/api/trainings?page=0&size=50'),
                api.get('/api/trainings/my?page=0&size=50'),
            ]);
            setTrainings(tRes.data?.data?.content || []);
            setMyEnrollments(mRes.data?.data?.content || []);
        } catch {
            toast.error('Failed to load trainings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const enrollmentFor = (trainingId) =>
        myEnrollments.find(e => e.trainingId === trainingId);

    const handleEnroll = async (trainingId) => {
        if (!employeeId) {
            toast.error('Could not find your employee ID — please contact support.');
            return;
        }
        setEnrollingId(trainingId);
        try {
            await api.post(`/api/trainings/${trainingId}/enroll`, { employeeId });
            toast.success('Successfully enrolled in training!');
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to enroll');
        } finally {
            setEnrollingId(null);
        }
    };

    const availableTrainings = useMemo(() => {
        return trainings.filter(t => {
            const status = getDynamicStatus(t);
            return status === 'UPCOMING' || status === 'ONGOING';
        });
    }, [trainings, getDynamicStatus]);

    // Quick learning dashboard stats
    const completedCount = useMemo(() =>
        myEnrollments.filter(e => e.status === 'COMPLETED').length, [myEnrollments]);

    const activeCount = useMemo(() =>
        myEnrollments.filter(e => e.status === 'ENROLLED' || e.status === 'ONGOING').length, [myEnrollments]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* Header Banner */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Learning & Development
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Explore new skill opportunities and manage your continuous learning roadmap
                </p>
            </div>

            {/* Summary KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px', padding: '12px' }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Available Courses</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{availableTrainings.length}</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', padding: '12px' }}>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>In Progress</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{activeCount}</div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '12px', padding: '12px' }}>
                        <Award size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Completed</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* Nav Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: tab === t.key ? '1.5px solid #1e3a5f' : '1.5px solid var(--card-border)',
                            cursor: 'pointer',
                            background: tab === t.key ? '#1e3a5f' : 'var(--card-bg)',
                            color: tab === t.key ? '#ffffff' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                        {t.label}
                        {t.key === 'mine' && myEnrollments.length > 0 && (
                            <span style={{
                                background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--card-border)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px'
                            }}>
                                {myEnrollments.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                border: '1px solid var(--card-border)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#1e3a5f' }} />
                        <div>Fetching your learning tracks...</div>
                    </div>
                ) : tab === 'available' ? (
                    availableTrainings.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
                                <Inbox size={48} strokeWidth={1.2} />
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                No Active Programs Available
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Check back later for newly scheduled training tracks.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                            {availableTrainings.map(t => {
                                const enr = enrollmentFor(t.id);
                                const isFull = t.maxParticipants != null && t.enrolledCount >= t.maxParticipants;
                                const dynamicStatus = getDynamicStatus(t);

                                return (
                                    <div key={t.id} style={{
                                        padding: '20px 24px',
                                        borderBottom: '1px solid var(--card-border)',
                                        transition: 'background 0.2s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '16px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                        {t.title}
                                                    </span>
                                                    {t.category && (
                                                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--card-border)', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                            {t.category.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                <Badge status={t.mode} />
                                                <Badge status={dynamicStatus} />
                                            </div>
                                        </div>

                                        {t.description && (
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6, maxWidth: '900px' }}>
                                                {t.description}
                                            </div>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '18px',
                                            fontSize: '12px',
                                            color: 'var(--text-muted)',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={14} /> {t.trainer}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} /> {t.startDate} → {t.endDate}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} /> {t.durationHours} hrs
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Users size={14} /> {t.enrolledCount ?? 0}/{t.maxParticipants ?? '∞'} Seats
                                            </div>
                                            {t.venue && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MapPin size={14} /> {t.venue}
                                                </div>
                                            )}
                                        </div>

                                        {t.meetingLink && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <a
                                                    href={t.meetingLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                                    <ExternalLink size={12} /> Access Meeting Link
                                                </a>
                                            </div>
                                        )}

                                        {enr ? (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'rgba(22, 163, 74, 0.08)',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(22, 163, 74, 0.2)'
                                            }}>
                                                <CheckCircle2 size={16} color="#16a34a" />
                                                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700' }}>
                                                    Enrolled ({enr.status})
                                                </span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEnroll(t.id)}
                                                disabled={enrollingId === t.id || isFull}
                                                style={{
                                                    padding: '9px 18px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    border: 'none',
                                                    cursor: (enrollingId === t.id || isFull) ? 'not-allowed' : 'pointer',
                                                    background: isFull ? 'var(--card-border)' : '#1e3a5f',
                                                    color: isFull ? 'var(--text-muted)' : '#ffffff',
                                                    opacity: enrollingId === t.id ? 0.7 : 1,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    transition: 'all 0.2s'
                                                }}>
                                                {enrollingId === t.id && <Loader2 size={14} className="animate-spin" />}
                                                {isFull ? 'Program Full' : enrollingId === t.id ? 'Enrolling...' : 'Enroll Program →'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    myEnrollments.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
                                <BookOpen size={48} strokeWidth={1.2} />
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                No Enrolled Courses Found
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Browse available programs to start building new skills.
                            </div>
                            <button
                                onClick={() => setTab('available')}
                                style={{
                                    padding: '9px 18px',
                                    background: '#1e3a5f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}>
                                Browse Programs
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                            {myEnrollments.map(enr => (
                                <div key={enr.id} style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid var(--card-border)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {enr.trainingTitle || 'Training Program'}
                                        </div>
                                        <Badge status={enr.status} />
                                    </div>

                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', gap: '16px' }}>
                                        <span>Enrolled: {new Date(enr.enrolledAt).toLocaleDateString('en-IN')}</span>
                                        {enr.completedAt && (
                                            <span>Completed: {new Date(enr.completedAt).toLocaleDateString('en-IN')}</span>
                                        )}
                                    </div>

                                    {enr.score != null && (
                                        <div style={{
                                            marginTop: '10px',
                                            background: 'var(--bg-primary, rgba(0,0,0,0.02))',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--card-border)',
                                            fontSize: '12.5px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            Performance Score: <strong style={{ color: '#16a34a', fontWeight: '800' }}>{enr.score}/100</strong>
                                            {enr.feedback && <span style={{ marginLeft: '8px', fontStyle: 'italic', color: 'var(--text-muted)' }}>— "{enr.feedback}"</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

        </div>
    );
}