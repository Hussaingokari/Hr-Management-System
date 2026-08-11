'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function formatTimeAgo(dateStr, now) {
  if (!dateStr) return '';
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, unreadRes] = await Promise.allSettled([
        filter === 'UNREAD'
          ? api.get(`/api/notifications/unread?page=${page}&size=10`)
          : getAdminNotifications(page, 10),
        getAdminUnreadCount(),
      ]);
      if (notifRes.status === 'fulfilled') {
        const data = notifRes.value.data?.data;
        setNotifications(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read!');
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotifIcon = (title) => {
    if (!title) return '📢';
    const t = title.toLowerCase();
    if (t.includes('leave')) return '🌴';
    if (t.includes('payroll') || t.includes('salary')) return '💰';
    if (t.includes('performance')) return '⭐';
    if (t.includes('training')) return '📚';
    if (t.includes('attendance')) return '📅';
    if (t.includes('onboarding')) return '📋';
    if (t.includes('recruitment')) return '💼';
    if (t.includes('approved')) return '✅';
    if (t.includes('rejected')) return '❌';
    if (t.includes('cancelled')) return '🚫';
    if (t.includes('employee')) return '👤';
    return '🔔';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            System alerts and activity updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition cursor-pointer disabled:opacity-50"
          >
            {markingAll ? '⏳ Marking...' : '✓ Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${filter === f
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            {f === 'ALL' ? 'All Notifications' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-5xl">🔔</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {filter === 'UNREAD' ? 'All caught up!' : 'No notifications yet'}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filter === 'UNREAD'
                ? 'No unread notifications'
                : 'System notifications will appear here'}
            </p>
            {filter === 'UNREAD' && (
              <button
                onClick={() => setFilter('ALL')}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition"
              >
                View All
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 transition ${n.isRead
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      : 'bg-blue-50/40 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800/80'
                    }`}
                >
                  {/* Unread dot */}
                  <div className="pt-2 shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${n.isRead
                          ? 'bg-slate-200 dark:bg-slate-700'
                          : 'bg-blue-600 dark:bg-blue-400'
                        }`}
                    />
                  </div>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-xl">
                    {getNotifIcon(n.title)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm sm:text-base ${n.isRead
                          ? 'font-medium text-slate-800 dark:text-slate-200'
                          : 'font-bold text-slate-900 dark:text-white'
                        }`}
                    >
                      {n.title}
                    </div>
                    {n.message && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    )}
                    <span className="inline-block text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      {formatTimeAgo(n.createdAt, now)}
                    </span>
                  </div>

                  {/* Mark Read Action */}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}