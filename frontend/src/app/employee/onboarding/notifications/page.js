'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { FileText, AlertTriangle, CheckCircle, Star, Bell } from 'lucide-react';

const TYPE_META = {
    DOCUMENT_UPLOADED: {
        icon: <FileText className="w-4 h-4 text-blue-500" />,
        bg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    DOCUMENT_REJECTED: {
        icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />,
        bg: 'bg-red-50 dark:bg-red-950/50',
    },
    DOCUMENT_APPROVED: {
        icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    CHECKLIST_COMPLETED: {
        icon: <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    DEFAULT: {
        icon: <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
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
        <div className="max-w-5xl mx-auto space-y-5 text-slate-900 dark:text-slate-100">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
                    </p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || markingAll}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
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
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${tab === t.key
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Main List Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                        Loading notifications...
                    </div>
                ) : visible.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                        <div className="flex justify-center text-slate-400 dark:text-slate-500">
                            <Bell className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {tab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Updates about your documents and checklist will show up here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visible.map((n) => {
                            const meta = TYPE_META[n.type] || TYPE_META.DEFAULT;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleOpen(n)}
                                    className={`flex items-start gap-3.5 p-4 sm:p-5 cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${n.isRead
                                            ? 'bg-white dark:bg-slate-900'
                                            : 'bg-indigo-50/30 dark:bg-indigo-950/20'
                                        }`}
                                >
                                    {/* Icon Badge */}
                                    <div
                                        className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${meta.bg}`}
                                    >
                                        {meta.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`text-xs sm:text-sm text-slate-900 dark:text-slate-100 ${n.isRead ? 'font-semibold' : 'font-extrabold'
                                                }`}
                                        >
                                            {n.title}
                                        </div>
                                        {n.message && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                {n.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Time & Unread Indicator */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {timeAgo(n.createdAt)}
                                        </span>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
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