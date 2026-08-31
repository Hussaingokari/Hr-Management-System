'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

import {
  Trash2,
  X,
  Check,
} from 'lucide-react';


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
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('ALL');

  const [markingAll, setMarkingAll] = useState(false);

  // Individual delete
  const [deletingId, setDeletingId] = useState(null);

  // Clear all
  const [clearingAll, setClearingAll] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showClearModal, setShowClearModal] =
    useState(false);

  const [notificationToDelete, setNotificationToDelete] =
    useState(null);

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [now, setNow] = useState(() => Date.now());


  /*
   * Update time
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);


  /*
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const [
        notifRes,
        unreadRes,
      ] = await Promise.allSettled([

        filter === 'UNREAD'
          ? api.get(
              `/api/notifications/unread?page=${page}&size=10`
            )
          : getAdminNotifications(page, 10),

        getAdminUnreadCount(),

      ]);


      /*
       * Notifications
       */
      if (notifRes.status === 'fulfilled') {
        const data =
          notifRes.value.data?.data;

        setNotifications(
          data?.content || []
        );

        setTotalPages(
          data?.totalPages || 0
        );
      }


      /*
       * Unread count
       */
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(
          unreadRes.value.data?.data || 0
        );
      }

    } catch (error) {
      console.error(
        'Failed to load notifications:',
        error
      );

      toast.error(
        'Failed to load notifications'
      );

    } finally {
      setLoading(false);
    }

  }, [filter, page]);


  /*
   * Load notifications
   */
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

    const notification =
      notifications.find(
        (n) => n.id === id
      );

    if (!notification || notification.isRead) {
      return;
    }


    /*
     * Optimistic update
     */
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              isRead: true,
            }
          : n
      )
    );

    setUnreadCount((prev) =>
      Math.max(0, prev - 1)
    );


    try {
      await markAdminNotificationRead(id);

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

    } catch (error) {

      console.error(
        'Failed to mark as read:',
        error
      );

      toast.error(
        'Failed to mark as read'
      );

      fetchNotifications();
    }
  };


  /*
   * Mark all as read
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
   * Notification click
   *
   * Existing Admin navigation is preserved.
   */
  const handleNotificationClick = async (
    notification
  ) => {

    try {

      if (!notification.isRead) {
        await handleMarkRead(
          notification.id
        );
      }


      const type = String(
        notification.referenceType ||
          notification.type ||
          ''
      ).toUpperCase();


      const referenceId =
        notification.referenceId ??
        notification.reference_id;


      if (!referenceId) {

        toast.error(
          'This notification is not linked to an approval request.'
        );

        return;
      }


      /*
       * Leave
       */
      if (type.includes('LEAVE')) {

        const notifType =
          String(
            notification.type || ''
          ).toUpperCase();

        const isCancellation =
          notifType ===
            'LEAVE_CANCELLED' ||
          String(
            notification.title || ''
          )
            .toLowerCase()
            .includes('cancel');

        const targetTab =
          isCancellation
            ? 'CANCELLATIONS'
            : 'PENDING';


        router.push(
          `/admin/leave?highlightId=${encodeURIComponent(
            referenceId
          )}&tab=${targetTab}`
        );

        return;
      }


      /*
       * Job Posted
       */
      if (
        type.includes('JOB_POSTED') ||
        type.includes('JOBPOSTING')
      ) {

        router.push(
          `/admin/recruitment?id=${encodeURIComponent(
            referenceId
          )}`
        );

        return;
      }


      /*
       * Document / Onboarding
       */
      if (
        type.includes('DOCUMENT') ||
        type.includes('ONBOARDING') ||
        type.includes('DOC')
      ) {

        router.push(
          `/admin/onboarding/document-requests?highlightId=${encodeURIComponent(
            referenceId
          )}`
        );

        return;
      }


      toast(
        'This notification does not have an approval destination.'
      );

    } catch (error) {

      console.error(
        'Unable to open notification:',
        error
      );

      toast.error(
        'Unable to open notification'
      );
    }
  };


  /*
   * Open individual delete modal
   */
  const openDeleteModal = (
    notification
  ) => {

    setNotificationToDelete(
      notification
    );

    setShowDeleteModal(true);
  };


  /*
   * Delete individual notification
   */
  const handleDelete = async () => {

    if (!notificationToDelete) {
      return;
    }


    const id =
      notificationToDelete.id;


    setDeletingId(id);


    try {

      await deleteAdminNotification(id);


      /*
       * If deleted notification was unread,
       * decrease unread count.
       */
      if (
        !notificationToDelete.isRead
      ) {

        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }


      /*
       * Remove immediately from UI
       */
      setNotifications((prev) =>
        prev.filter(
          (n) => n.id !== id
        )
      );


      /*
       * Close modal
       */
      setShowDeleteModal(false);

      setNotificationToDelete(null);


      toast.success(
        'Notification deleted'
      );


      window.dispatchEvent(
        new Event('notificationsUpdated')
      );


      /*
       * Refresh pagination/data
       */
      if (notifications.length === 1) {

        if (page > 0) {

          setPage((prev) =>
            Math.max(0, prev - 1)
          );

        } else {

          await fetchNotifications();
        }

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
   * Open Clear All modal
   */
  const openClearAllModal = () => {

    if (
      notifications.length === 0
    ) {
      return;
    }

    setShowClearModal(true);
  };


  /*
   * Clear all notifications
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


  /*
   * Notification icon
   */
  const getNotifIcon = (title) => {

    if (!title) return '🔔';

    const t =
      title.toLowerCase();


    if (t.includes('leave'))
      return '🌴';

    if (
      t.includes('payroll') ||
      t.includes('salary')
    )
      return '💰';

    if (t.includes('performance'))
      return '⭐';

    if (t.includes('training'))
      return '📚';

    if (t.includes('attendance'))
      return '📅';

    if (t.includes('onboarding'))
      return '📋';

    if (t.includes('recruitment'))
      return '💼';

    if (t.includes('approved'))
      return '✅';

    if (t.includes('rejected'))
      return '❌';

    if (t.includes('cancelled'))
      return '🚫';

    if (t.includes('employee'))
      return '👤';

    if (t.includes('job'))
      return '💼';


    return '🔔';
  };


  return (
    <div>

      {/* =====================================================
          PAGE STYLES
          ===================================================== */}

      <style jsx global>{`

        .admin-notifications-card {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .admin-notification-row {
          border-color: var(--card-border) !important;
        }

        .admin-notification-row.read {
          background: var(--card-bg) !important;
        }

        .admin-notification-row.unread {
          background: #f8faff !important;
        }

        .admin-notification-row.unread:hover {
          background: #f0f4ff !important;
        }

        .admin-notification-row.read:hover {
          background: #f8fafc !important;
        }

        .admin-notification-action {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .admin-notification-delete {
          color: #dc2626;
          transition: all 0.15s ease;
        }

        .admin-notification-delete:hover {
          background: #fef2f2 !important;
          border-color: #fecaca !important;
          color: #b91c1c !important;
        }

        .dark .admin-notifications-card {
          background: #171c24 !important;
          border-color: #2d3748 !important;
        }

        .dark .admin-notification-row {
          border-color: #2d3748 !important;
        }

        .dark .admin-notification-row.read {
          background: #171c24 !important;
        }

        .dark .admin-notification-row.unread {
          background: #111827 !important;
        }

        .dark .admin-notification-row.unread:hover {
          background: #1e293b !important;
        }

        .dark .admin-notification-row.read:hover {
          background: #1b222c !important;
        }

        .dark .admin-notification-delete {
          color: #f87171;
        }

        .dark .admin-notification-delete:hover {
          background: #450a0a !important;
          border-color: #7f1d1d !important;
          color: #fca5a5 !important;
        }

        .admin-notification-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
        }

        .admin-notification-modal {
          width: 100%;
          max-width: 430px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
        }

        .admin-notification-modal-title {
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        .admin-notification-modal-text {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .admin-notification-modal-preview {
          background: var(--background);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 12px;
        }

        .admin-notification-modal-preview-title {
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .admin-notification-modal-preview-message {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          margin-top: 4px;
        }

        .admin-notification-modal-cancel {
          padding: 9px 18px;
          border-radius: 9px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-notification-modal-cancel:hover {
          opacity: 0.8;
        }

        .admin-notification-modal-delete {
          padding: 9px 18px;
          border-radius: 9px;
          border: none;
          background: #dc2626;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-notification-modal-delete:hover {
          background: #b91c1c;
        }

        .admin-notification-modal-delete:disabled,
        .admin-notification-modal-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {

          .admin-notification-row {
            flex-wrap: wrap !important;
          }

          .admin-notification-actions {
            width: 100%;
            margin-left: 60px;
          }

        }

      `}</style>


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '20px',
        }}
      >

        <div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >

            <h1
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Notifications
            </h1>


            {unreadCount > 0 && (
              <span
                style={{
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '3px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                {unreadCount} unread
              </span>
            )}

          </div>


          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            Stay updated with your latest alerts
            and activities.
          </p>

        </div>


        {/* Header buttons */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >

          {/* Mark all as read */}

          {unreadCount > 0 && (
            <button
              className="admin-notification-action"
              onClick={handleMarkAll}
              disabled={markingAll}
              style={{
                padding: '11px 20px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border:
                  '1.5px solid var(--card-border)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: markingAll
                  ? 'not-allowed'
                  : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >

              {markingAll ? (
                'Marking...'
              ) : (
                <>
                  <Check size={14} />
                  Mark all as read
                </>
              )}

            </button>
          )}


          {/* Clear All */}

          {notifications.length > 0 && (
            <button
              onClick={openClearAllModal}
              disabled={clearingAll}
              style={{
                padding: '11px 20px',
                background: '#fff1f2',
                color: '#dc2626',
                border:
                  '1.5px solid #fecdd3',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: clearingAll
                  ? 'not-allowed'
                  : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >

              <Trash2 size={14} />

              {clearingAll
                ? 'Clearing...'
                : 'Clear All'}

            </button>
          )}

        </div>

      </div>


      {/* =====================================================
          FILTER
          ===================================================== */}

      <div
        className="admin-notifications-card"
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border:
            '1px solid var(--card-border)',
          padding: '6px',
          width: 'fit-content',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >

        {['ALL', 'UNREAD'].map((f) => (

          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              background:
                filter === f
                  ? '#4f46e5'
                  : 'transparent',
              color:
                filter === f
                  ? 'white'
                  : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >

            {f === 'ALL'
              ? 'All Notifications'
              : `Unread${
                  unreadCount
                    ? ` (${unreadCount})`
                    : ''
                }`}

          </button>

        ))}

      </div>


      {/* =====================================================
          NOTIFICATION CARD
          ===================================================== */}

      <div
        className="admin-notifications-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '14px',
          border:
            '1px solid var(--card-border)',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >

        {/* Loading */}

        {loading ? (

          <div
            style={{
              padding: '70px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            Loading notifications...
          </div>

        ) : notifications.length === 0 ? (

          /* Empty */

          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >

            <div
              style={{
                fontSize: '44px',
                marginBottom: '14px',
              }}
            >
              🔔
            </div>


            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {filter === 'UNREAD'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </div>


            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {filter === 'UNREAD'
                ? 'No unread notifications right now.'
                : 'Updates and alerts will appear here.'}
            </div>


            {filter === 'UNREAD' && (
              <button
                onClick={() => {
                  setFilter('ALL');
                  setPage(0);
                }}
                style={{
                  marginTop: '18px',
                  padding: '10px 22px',
                  background: '#1e3a5f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                View all notifications
              </button>
            )}

          </div>

        ) : (

          <>

            {/* =================================================
                NOTIFICATION LIST
                ================================================= */}

            {notifications.map((n) => {

              return (

                <div
                  key={n.id}
                  className={`admin-notification-row ${
                    n.isRead
                      ? 'read'
                      : 'unread'
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    handleNotificationClick(n)
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key === 'Enter' ||
                      e.key === ' '
                    ) {

                      e.preventDefault();

                      handleNotificationClick(n);
                    }

                  }}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    padding: '18px 20px',
                    borderBottom:
                      '1px solid var(--card-border)',
                    cursor: 'pointer',
                  }}
                >

                  {/* Unread dot */}

                  <div
                    style={{
                      width: '8px',
                      minWidth: '8px',
                      height: '8px',
                      marginTop: '7px',
                      borderRadius: '50%',
                      background:
                        n.isRead
                          ? 'transparent'
                          : '#4f46e5',
                    }}
                  />


                  {/* Notification icon */}

                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      minWidth: '46px',
                      borderRadius: '12px',
                      background:
                        n.isRead
                          ? '#f1f5f9'
                          : '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '21px',
                    }}
                  >
                    {getNotifIcon(n.title)}
                  </div>


                  {/* Content */}

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight:
                          n.isRead
                            ? '600'
                            : '800',
                        color:
                          'var(--text-primary)',
                        marginBottom: '5px',
                      }}
                    >
                      {n.title}
                    </div>


                    {n.message && (
                      <div
                        style={{
                          fontSize: '13px',
                          color:
                            'var(--text-secondary)',
                          lineHeight: '1.5',
                          marginBottom: '6px',
                        }}
                      >
                        {n.message}
                      </div>
                    )}


                    <div
                      style={{
                        fontSize: '12px',
                        color:
                          'var(--text-muted)',
                      }}
                    >
                      {formatTimeAgo(
                        n.createdAt,
                        now
                      )}
                    </div>

                  </div>


                  {/* =================================================
                      ACTIONS
                      ================================================= */}

                  <div
                    className="admin-notification-actions"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >

                    {/* Mark Read */}

                    {!n.isRead && (
                      <button
                        className="admin-notification-action"
                        onClick={(e) => {

                          e.stopPropagation();

                          handleMarkRead(n.id);

                        }}
                        style={{
                          padding: '7px 16px',
                          background:
                            'var(--card-bg)',
                          color: '#4f46e5',
                          border:
                            '1.5px solid var(--card-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mark read
                      </button>
                    )}


                    {/* Single Delete */}

                    <button
                      className="admin-notification-delete"
                      onClick={(e) => {

                        e.stopPropagation();

                        openDeleteModal(n);

                      }}
                      disabled={
                        deletingId === n.id
                      }
                      title="Delete notification"
                      aria-label="Delete notification"
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border:
                          '1.5px solid var(--card-border)',
                        background:
                          'var(--card-bg)',
                        cursor:
                          deletingId === n.id
                            ? 'not-allowed'
                            : 'pointer',
                        flexShrink: 0,
                      }}
                    >

                      {deletingId === n.id ? (

                        <span
                          style={{
                            fontSize: '14px',
                          }}
                        >
                          ⏳
                        </span>

                      ) : (

                        <Trash2 size={16} />

                      )}

                    </button>

                  </div>

                </div>

              );

            })}


            {/* =================================================
                PAGINATION
                ================================================= */}

            {totalPages > 1 && (

              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  borderTop:
                    '1px solid var(--card-border)',
                }}
              >

                <button
                  className="admin-notification-action"
                  onClick={() =>
                    setPage((p) =>
                      Math.max(0, p - 1)
                    )
                  }
                  disabled={page === 0}
                  style={{
                    padding: '7px 16px',
                    border:
                      '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color:
                      page === 0
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background:
                      'var(--card-bg)',
                    cursor:
                      page === 0
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  ← Prev
                </button>


                <span
                  style={{
                    fontSize: '12px',
                    color:
                      'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  Page {page + 1} of{' '}
                  {totalPages}
                </span>


                <button
                  className="admin-notification-action"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        totalPages - 1,
                        p + 1
                      )
                    )
                  }
                  disabled={
                    page >=
                    totalPages - 1
                  }
                  style={{
                    padding: '7px 16px',
                    border:
                      '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color:
                      page >=
                      totalPages - 1
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background:
                      'var(--card-bg)',
                    cursor:
                      page >=
                      totalPages - 1
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  Next →
                </button>

              </div>

            )}

          </>

        )}

      </div>


      {/* =====================================================
          DELETE ONE NOTIFICATION MODAL
          ===================================================== */}

      {showDeleteModal &&
        notificationToDelete && (

          <div
            className="admin-notification-modal-overlay"
            onClick={() => {

              if (!deletingId) {

                setShowDeleteModal(false);

                setNotificationToDelete(
                  null
                );

              }

            }}
          >

            <div
              className="admin-notification-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* Modal Header */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >

                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626',
                    }}
                  >
                    <Trash2 size={18} />
                  </div>


                  <h2 className="admin-notification-modal-title">
                    Delete Notification?
                  </h2>

                </div>


                <button
                  onClick={() => {

                    setShowDeleteModal(
                      false
                    );

                    setNotificationToDelete(
                      null
                    );

                  }}
                  disabled={
                    deletingId !== null
                  }
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color:
                      'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>


              <p className="admin-notification-modal-text">
                Are you sure you want to
                delete this notification?
              </p>


              {/* Preview */}

              <div
                className="admin-notification-modal-preview"
                style={{
                  marginTop: '16px',
                }}
              >

                <div className="admin-notification-modal-preview-title">
                  {
                    notificationToDelete.title
                  }
                </div>

                {notificationToDelete.message && (
                  <div className="admin-notification-modal-preview-message">
                    {
                      notificationToDelete.message
                    }
                  </div>
                )}

              </div>


              {/* Buttons */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                }}
              >

                <button
                  className="admin-notification-modal-cancel"
                  onClick={() => {

                    setShowDeleteModal(
                      false
                    );

                    setNotificationToDelete(
                      null
                    );

                  }}
                  disabled={
                    deletingId !== null
                  }
                >
                  Cancel
                </button>


                <button
                  className="admin-notification-modal-delete"
                  onClick={handleDelete}
                  disabled={
                    deletingId !== null
                  }
                >
                  {deletingId !== null
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              </div>

            </div>

          </div>

        )}


      {/* =====================================================
          CLEAR ALL MODAL
          ===================================================== */}

      {showClearModal && (

        <div
          className="admin-notification-modal-overlay"
          onClick={() => {

            if (!clearingAll) {
              setShowClearModal(false);
            }

          }}
        >

          <div
            className="admin-notification-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <Trash2 size={18} />
                </div>


                <h2 className="admin-notification-modal-title">
                  Clear All Notifications?
                </h2>

              </div>


              <button
                onClick={() =>
                  setShowClearModal(false)
                }
                disabled={clearingAll}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color:
                    'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>


            <p className="admin-notification-modal-text">
              Are you sure you want to clear
              all notifications? This action
              cannot be undone.
            </p>


            {/* Buttons */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '22px',
              }}
            >

              <button
                className="admin-notification-modal-cancel"
                onClick={() =>
                  setShowClearModal(false)
                }
                disabled={clearingAll}
              >
                Cancel
              </button>


              <button
                className="admin-notification-modal-delete"
                onClick={handleClearAll}
                disabled={clearingAll}
              >
                {clearingAll
                  ? 'Clearing...'
                  : 'Clear All'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}