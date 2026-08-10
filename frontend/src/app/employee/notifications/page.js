'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyNotifications, getUnreadCount, markNotificationRead } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Palmtree,
  Calendar,
  Banknote,
  Star,
  BookOpen,
  Hand,
  FileText,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Bell,
  Check,
} from 'lucide-react';

const TYPE_META = {
  LEAVE_APPLIED: { icon: <Palmtree size={20} color="#16a34a" />, bg: '#f0fdf4', color: '#16a34a' },
  LEAVE_APPROVED: { icon: <Palmtree size={20} color="#16a34a" />, bg: '#dcfce7', color: '#16a34a' },
  LEAVE_REJECTED: { icon: <Palmtree size={20} color="#dc2626" />, bg: '#fee2e2', color: '#dc2626' },
  LEAVE_CANCELLED: { icon: <Palmtree size={20} color="var(--text-secondary)" />, bg: '#f1f5f9', color: 'var(--text-secondary)' },
  ATTENDANCE_REMINDER: { icon: <Calendar size={20} color="#3b82f6" />, bg: '#eff6ff', color: '#3b82f6' },
  PAYROLL_GENERATED: { icon: <Banknote size={20} color="#ca8a04" />, bg: '#fef9c3', color: '#ca8a04' },
  PERFORMANCE_REVIEWED: { icon: <Star size={20} color="#4f46e5" />, bg: '#eef2ff', color: '#4f46e5' },
  TRAINING_ENROLLED: { icon: <BookOpen size={20} color="#3b82f6" />, bg: '#eff6ff', color: '#3b82f6' },
  TRAINING_COMPLETED: { icon: <BookOpen size={20} color="#16a34a" />, bg: '#dcfce7', color: '#16a34a' },
  ONBOARDING_INITIATED: { icon: <Hand size={20} color="#4f46e5" />, bg: '#eef2ff', color: '#4f46e5' },
  DOCUMENT_UPLOADED: { icon: <FileText size={20} color="#3b82f6" />, bg: '#eff6ff', color: '#3b82f6' },
  DOCUMENT_APPROVED: { icon: <CheckCircle size={20} color="#16a34a" />, bg: '#dcfce7', color: '#16a34a' },
  DOCUMENT_REJECTED: { icon: <AlertTriangle size={20} color="#dc2626" />, bg: '#fee2e2', color: '#dc2626' },
  CHECKLIST_COMPLETED: { icon: <CheckCircle size={20} color="#16a34a" />, bg: '#dcfce7', color: '#16a34a' },
  JOB_APPLICATION: { icon: <Briefcase size={20} color="#4f46e5" />, bg: '#eef2ff', color: '#4f46e5' },
  GENERAL: { icon: <Bell size={20} color="var(--text-secondary)" />, bg: '#f1f5f9', color: 'var(--text-secondary)' },
};

function getMeta(n) {
  return TYPE_META[n.type] || TYPE_META.GENERAL;
}

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

export default function NotificationsPage() {
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
          : getMyNotifications(page, 10),
        getUnreadCount(),
      ]);

      if (notifRes.status === 'fulfilled') {
        const data = notifRes.value.data?.data;
        setNotifications(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (err) {
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      toast.error('Failed to mark as read');
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);

    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All caught up!');
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <style jsx global>{`
        .notifications-card {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .notification-row {
          border-color: var(--card-border) !important;
        }

        .notification-row.read {
          background: var(--card-bg) !important;
        }

        .notification-row.unread {
          background: #f8faff !important;
        }

        .notification-row.unread:hover {
          background: #f0f4ff !important;
        }

        .notification-action-button,
        .notification-pagination-button {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .dark .notifications-card {
          background: #171c24 !important;
          border-color: #2d3748 !important;
        }

        .dark .notification-row {
          border-color: #2d3748 !important;
        }

        .dark .notification-row.read {
          background: #171c24 !important;
        }

        .dark .notification-row.unread {
          background: #111827 !important;
        }

        .dark .notification-row.unread:hover {
          background: #1e293b !important;
        }

        .dark .notification-row.read:hover {
          background: #1b222c !important;
        }

        .dark .notification-title {
          color: #f1f5f9 !important;
        }

        .dark .notification-message {
          color: #cbd5e1 !important;
        }

        .dark .notification-time {
          color: #94a3b8 !important;
        }

        .dark .notification-action-button,
        .dark .notification-pagination-button {
          background: #0f172a !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }

        .dark .notification-filter-inactive {
          color: #94a3b8 !important;
        }

        .dark .notification-empty-state {
          background: #171c24 !important;
          color: #94a3b8 !important;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '4px',
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
            Stay updated with your latest alerts and activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="notification-action-button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              padding: '11px 20px',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--card-border)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: markingAll ? 'not-allowed' : 'pointer',
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
                <Check size={14} /> Mark all as read
              </>
            )}
          </button>
        )}
      </div>

      <div
        className="notifications-card"
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
          padding: '6px',
          width: 'fit-content',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
            className={filter === f ? '' : 'notification-filter-inactive'}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              background: filter === f ? '#4f46e5' : 'transparent',
              color:
                filter === f
                  ? 'white'
                  : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {f === 'ALL'
              ? 'All Notifications'
              : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      <div
        className="notifications-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '14px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            className="notification-empty-state"
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
          <div
            className="notification-empty-state"
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Bell size={44} strokeWidth={1.5} />
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
                onClick={() => setFilter('ALL')}
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
            {notifications.map((n, i) => {
              const meta = getMeta(n);

              return (
                <div
                  key={n.id}
                  className={`notification-row ${n.isRead ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (!n.isRead) handleMarkRead(n.id);
                  }}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    padding: '18px 22px',
                    cursor: n.isRead ? 'default' : 'pointer',
                    borderTop:
                      i === 0
                        ? 'none'
                        : '1px solid var(--card-border)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      background: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        className="notification-title"
                        style={{
                          fontSize: '15px',
                          fontWeight: n.isRead ? '600' : '800',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {n.title}
                      </span>

                      {!n.isRead && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#4f46e5',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    <div
                      className="notification-message"
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        marginBottom: '6px',
                      }}
                    >
                      {n.message}
                    </div>

                    <div
                      className="notification-time"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {formatTimeAgo(n.createdAt, now)}
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      className="notification-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: '7px 16px',
                        background: 'var(--card-bg)',
                        color: '#4f46e5',
                        border: '1.5px solid var(--card-border)',
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
                </div>
              );
            })}

            {totalPages > 1 && (
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  borderTop: '1px solid var(--card-border)',
                }}
              >
                <button
                  className="notification-pagination-button"
                  onClick={() =>
                    setPage((p) => Math.max(0, p - 1))
                  }
                  disabled={page === 0}
                  style={{
                    padding: '7px 16px',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color:
                      page === 0
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor:
                      page === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Prev
                </button>

                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  className="notification-pagination-button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages - 1, p + 1)
                    )
                  }
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '7px 16px',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color:
                      page >= totalPages - 1
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor:
                      page >= totalPages - 1
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
    </div>
  );
}