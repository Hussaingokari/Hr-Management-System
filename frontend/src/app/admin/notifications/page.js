'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
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

  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

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
    } catch (error) {
      console.error('Failed to load notifications:', error);
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

  /*
   * Mark one notification as read
   */
  const handleMarkRead = async (id) => {
    try {
      await markAdminNotificationRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true }
            : n
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  /*
   * Mark all notifications as read
   */
  const handleMarkAll = async () => {
    setMarkingAll(true);

    try {
      await markAllAdminNotificationsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      toast.success(
        'All notifications marked as read!'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error(
        'Failed to mark all as read:',
        error
      );

      toast.error(
        'Failed to mark all as read'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * Open individual delete confirmation
   */
  const openDeleteModal = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  /*
   * Delete one notification
   */
  const handleDelete = async () => {
    if (!notificationToDelete) {
      return;
    }

    const id = notificationToDelete.id;

    setDeletingId(id);

    try {
      await deleteAdminNotification(id);

      /*
       * If deleted notification was unread,
       * decrease unread count.
       */
      if (!notificationToDelete.isRead) {
        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }

      setShowDeleteModal(false);
      setNotificationToDelete(null);

      toast.success(
        'Notification deleted'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

      /*
       * If this was the only notification
       * on a page other than the first page,
       * move to the previous page.
       */
      if (notifications.length === 1 && page > 0) {
        setPage((prev) => Math.max(0, prev - 1));
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to delete notification'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * Open Clear All confirmation
   */
  const openClearAllModal = () => {
    if (notifications.length === 0) {
      return;
    }

    setShowClearModal(true);
  };

  /*
   * Delete all notifications belonging
   * to the currently logged-in Admin/HR user.
   */
  const handleClearAll = async () => {
    setClearingAll(true);

    try {
      await clearAllAdminNotifications();

      setNotifications([]);
      setUnreadCount(0);
      setTotalPages(0);
      setPage(0);

      setShowClearModal(false);

      toast.success(
        'All notifications cleared'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error(
        'Failed to clear notifications:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to clear notifications'
      );
    } finally {
      setClearingAll(false);
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
    <>
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

          {/* Header actions */}
          <div className="flex items-center gap-2 flex-wrap">

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition cursor-pointer disabled:opacity-50"
              >
                {markingAll
                  ? '⏳ Marking...'
                  : '✓ Mark all as read'}
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={openClearAllModal}
                disabled={clearingAll}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer disabled:opacity-50"
              >
                🗑 Clear All
              </button>
            )}

          </div>
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                filter === f
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f === 'ALL'
                ? 'All Notifications'
                : `Unread (${unreadCount})`}
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

              <div className="text-5xl">
                🔔
              </div>

              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {filter === 'UNREAD'
                  ? 'All caught up!'
                  : 'No notifications yet'}
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
                    className={`flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 transition ${
                      n.isRead
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        : 'bg-blue-50/40 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800/80'
                    }`}
                  >

                    {/* Unread dot */}
                    <div className="pt-2 shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          n.isRead
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
                        className={`text-sm sm:text-base ${
                          n.isRead
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

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2">

                      {!n.isRead && (
                        <button
                          onClick={() =>
                            handleMarkRead(n.id)
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() =>
                          openDeleteModal(n)
                        }
                        disabled={deletingId === n.id}
                        title="Delete notification"
                        aria-label="Delete notification"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === n.id
                          ? '⏳'
                          : '🗑️'}
                      </button>

                    </div>

                  </div>

                ))}

              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 flex items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-800">

                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.max(0, p - 1)
                      )
                    }
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
                      setPage((p) =>
                        Math.min(
                          totalPages - 1,
                          p + 1
                        )
                      )
                    }
                    disabled={
                      page >= totalPages - 1
                    }
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

      {/* =====================================================
          DELETE ONE NOTIFICATION MODAL
          ===================================================== */}
      {showDeleteModal && notificationToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">

            <div className="p-6">

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Notification?
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Are you sure you want to delete this notification?
              </p>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {notificationToDelete.title}
                </p>

                {notificationToDelete.message && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {notificationToDelete.message}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setNotificationToDelete(null);
                  }}
                  disabled={deletingId !== null}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deletingId !== null
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CLEAR ALL NOTIFICATIONS MODAL
          ===================================================== */}
      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">

            <div className="p-6">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-xl">
                  🗑️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Clear All Notifications?
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>

              </div>

              <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
                All notifications belonging to your account will be permanently deleted.
              </p>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  onClick={() =>
                    setShowClearModal(false)
                  }
                  disabled={clearingAll}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {clearingAll
                    ? 'Clearing...'
                    : 'Clear All'}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </>
  );
}