'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FileText, AlertTriangle, CheckCircle, Star, UserPlus, Bell } from 'lucide-react';

const TYPE_META = {
    DOCUMENT_UPLOADED: {
        icon: <FileText size={20} className="text-blue-600 dark:text-blue-400" />,
        bg: 'bg-blue-50 dark:bg-blue-950/60',
    },
    DOCUMENT_REJECTED: {
        icon: <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />,
        bg: 'bg-rose-50 dark:bg-rose-950/60',
    },
    DOCUMENT_APPROVED: {
        icon: <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    CHECKLIST_COMPLETED: {
        icon: <Star size={20} className="text-emerald-600 dark:text-emerald-400" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    ONBOARDING_INITIATED: {
        icon: <UserPlus size={20} className="text-indigo-600 dark:text-indigo-400" />,
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    },
    DEFAULT: {
        icon: <Bell size={20} className="text-slate-500 dark:text-slate-400" />,
        bg: 'bg-slate-100 dark:bg-slate-800',
    },
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

export default function NotificationsPage() {
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
        } catch {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications]
    );

    const visible = useMemo(() => {
        if (tab === 'UNREAD') return notifications.filter((n) => !n.isRead);
        return notifications;
    }, [notifications, tab]);

    const handleOpen = async (n) => {
        if (!n.isRead) {
            setNotifications((prev) =>
                prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
            );
            try {
                await api.put(`/api/notifications/${n.id}/read`);
            } catch {
                setNotifications((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x))
                );
                toast.error('Could not mark notification as read');
                return;
            }
        }
        if (n.referenceType === 'Onboarding' && n.referenceId) {
            router.push(`/admin/onboarding/checklist/view?id=${n.referenceId}`);
        } else if (n.referenceType === 'OnboardingDocument') {
            router.push('/admin/onboarding/document-requests');
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);
        const prev = notifications;
        setNotifications((p) => p.map((x) => ({ ...x, isRead: true })));
        try {
            await api.put('/api/notifications/mark-all-read');
            toast.success('All notifications marked as read');
        } catch {
            setNotifications(prev);
            toast.error('Could not mark all as read');
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
                    </p>
                </div>

                <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || markingAll}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${unreadCount === 0
                            ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs'
                        }`}
                >
                    {markingAll ? 'Marking...' : 'Mark all as read'}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'ALL', label: 'All' },
                    { key: 'UNREAD', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition ${tab === t.key
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Notification List Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                        Loading notifications...
                    </div>
                ) : visible.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                        <div className="flex justify-center text-slate-400 dark:text-slate-600">
                            <Bell size={40} strokeWidth={1.5} />
                        </div>
                        <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {tab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Updates about onboardings will show up here.
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {visible.map((n) => {
                            const meta = TYPE_META[n.type] || TYPE_META.DEFAULT;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleOpen(n)}
                                    className={`flex items-start gap-4 p-4 sm:p-5 transition cursor-pointer ${n.isRead
                                            ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                            : 'bg-blue-50/40 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800/80'
                                        }`}
                                >
                                    {/* Icon Badge */}
                                    <div
                                        className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}
                                    >
                                        {meta.icon}
                                    </div>

                                    {/* Body Content */}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`text-sm sm:text-base ${n.isRead
                                                    ? 'font-semibold text-slate-700 dark:text-slate-200'
                                                    : 'font-extrabold text-slate-900 dark:text-white'
                                                }`}
                                        >
                                            {n.title}
                                        </div>
                                        {n.message && (
                                            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                {n.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date & Unread Indicator */}
                                    <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {timeAgo(n.createdAt)}
                                        </span>
                                        {!n.isRead && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}