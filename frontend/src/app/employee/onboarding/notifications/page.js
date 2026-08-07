'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FileText, AlertTriangle, CheckCircle, Star, Bell } from 'lucide-react';

const TYPE_META = {
    DOCUMENT_UPLOADED: { icon: <FileText size={16} color="#3b82f6" />, color: '#3b82f6', bg: '#eff6ff' },
    DOCUMENT_REJECTED: { icon: <AlertTriangle size={16} color="#dc2626" />, color: '#dc2626', bg: '#fee2e2' },
    DOCUMENT_APPROVED: { icon: <CheckCircle size={16} color="#16a34a" />, color: '#16a34a', bg: '#dcfce7' },
    CHECKLIST_COMPLETED: { icon: <Star size={16} color="#16a34a" />, color: '#16a34a', bg: '#dcfce7' },
    DEFAULT: { icon: <Bell size={16} color="var(--text-secondary)" />, color: 'var(--text-secondary)', bg: '#f1f5f9' },
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function EmployeeOnboardingNotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('ALL');
    const [markingAll, setMarkingAll] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications?size=50');
            setNotifications(res.data?.data?.content || []);
        } catch (err) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    const visible = useMemo(() => {
        if (tab === 'UNREAD') return notifications.filter(n => !n.isRead);
        return notifications;
    }, [notifications, tab]);

    const handleOpen = async (n) => {
        if (!n.isRead) {
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
            try {
                await api.put(`/api/notifications/${n.id}/read`);
            } catch (err) {
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x));
                toast.error('Could not mark notification as read');
                return;
            }
        }
        if (n.referenceType === 'OnboardingDocument') {
            router.push('/employee/onboarding/documents');
        } else if (n.referenceType === 'Onboarding') {
            router.push('/employee/onboarding/checklist');
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);
        const prev = notifications;
        setNotifications(p => p.map(x => ({ ...x, isRead: true })));
        try {
            await api.put('/api/notifications/mark-all-read');
            toast.success('All notifications marked as read');
        } catch (err) {
            setNotifications(prev);
            toast.error('Could not mark all as read');
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>Notifications</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {unreadCount > 0 ? `${unreadCount} unread` : 'You\u2019re all caught up'}
                    </div>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || markingAll}
                    style={{
                        padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
                        background: 'var(--card-bg)', color: '#374151', fontSize: '13px', fontWeight: '700',
                        cursor: unreadCount === 0 ? 'not-allowed' : 'pointer', opacity: unreadCount === 0 ? 0.5 : 1,
                    }}>
                    {markingAll ? 'Marking...' : 'Mark all as read'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[
                    { key: 'ALL', label: 'All' },
                    { key: 'UNREAD', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '700',
                            background: tab === t.key ? '#1e3a5f' : '#f1f5f9',
                            color: tab === t.key ? 'white' : '#64748b',
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <Bell size={32} strokeWidth={1.5} />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {tab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Updates about your documents and checklist will show up here.
                        </div>
                    </div>
                ) : (
                    visible.map((n, i) => {
                        const meta = TYPE_META[n.type] || TYPE_META.DEFAULT;
                        return (
                            <div
                                key={n.id}
                                onClick={() => handleOpen(n)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px',
                                    borderTop: i === 0 ? 'none' : '1px solid #f1f5f9', cursor: 'pointer',
                                    background: n.isRead ? 'white' : '#f8faff',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : '#f8faff'}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                    background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px',
                                }}>
                                    {meta.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: n.isRead ? '600' : '800', color: 'var(--text-primary)' }}>
                                        {n.title}
                                    </div>
                                    {n.message && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {n.message}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {timeAgo(n.createdAt)}
                                    </div>
                                    {!n.isRead && (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
