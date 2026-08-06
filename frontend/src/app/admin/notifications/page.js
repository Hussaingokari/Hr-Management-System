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
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('ALL');
  const [markingAll, setMarkingAll]       = useState(false);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);

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
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
    if (t.includes('leave'))       return '🌴';
    if (t.includes('payroll') || t.includes('salary')) return '💰';
    if (t.includes('performance')) return '⭐';
    if (t.includes('training'))    return '📚';
    if (t.includes('attendance'))  return '📅';
    if (t.includes('onboarding'))  return '📋';
    if (t.includes('recruitment')) return '💼';
    if (t.includes('approved'))    return '✅';
    if (t.includes('rejected'))    return '❌';
    if (t.includes('cancelled'))   return '🚫';
    if (t.includes('employee'))    return '👤';
    return '🔔';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '800', color: '#1e293b',
            marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white',
                borderRadius: '20px', padding: '2px 10px',
                fontSize: '13px', fontWeight: '700',
              }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            System alerts and activity updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            style={{
              padding: '10px 18px', background: '#eff6ff',
              color: '#3b82f6', border: '1px solid #bfdbfe',
              borderRadius: '10px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer',
            }}>
            {markingAll ? '⏳ Marking...' : '✓ Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex', gap: '4px', background: '#f1f5f9',
        borderRadius: '10px', padding: '4px',
        width: 'fit-content', marginBottom: '20px',
      }}>
        {['ALL', 'UNREAD'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }}
            style={{
              padding: '8px 20px',
              background: filter === f ? 'white' : 'transparent',
              color: filter === f ? '#1e293b' : '#64748b',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: filter === f ? '700' : '400',
              cursor: 'pointer',
              boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            {f === 'ALL' ? 'All Notifications' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
              {filter === 'UNREAD' ? 'All caught up!' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              {filter === 'UNREAD'
                ? 'No unread notifications'
                : 'System notifications will appear here'}
            </div>
            {filter === 'UNREAD' && (
              <button onClick={() => setFilter('ALL')}
                style={{ marginTop: '16px', padding: '8px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                View All
              </button>
            )}
          </div>
        ) : (
          <>
            {notifications.map((n, i) => (
              <div key={n.id} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '16px 20px',
                borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: n.isRead ? 'white' : '#f8fbff',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : '#f8fbff'}
              >
                {/* Unread dot */}
                <div style={{ paddingTop: '6px', flexShrink: 0 }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: n.isRead ? '#e2e8f0' : '#3b82f6',
                  }}/>
                </div>

                {/* Icon */}
                <div style={{
                  width: '40px', height: '40px', flexShrink: 0,
                  background: '#f1f5f9', borderRadius: '10px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px',
                }}>
                  {getNotifIcon(n.title)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: n.isRead ? '500' : '700',
                    color: '#1e293b', marginBottom: '4px',
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: '13px', color: '#64748b',
                    lineHeight: '1.5', marginBottom: '6px',
                  }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {formatTimeAgo(n.createdAt, now)}
                  </div>
                </div>

                {/* Mark read */}
                {!n.isRead && (
                  <button onClick={() => handleMarkRead(n.id)}
                    style={{
                      flexShrink: 0, padding: '6px 14px',
                      background: '#eff6ff', color: '#3b82f6',
                      border: '1px solid #bfdbfe', borderRadius: '6px',
                      fontSize: '11px', fontWeight: '700',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                    Mark read
                  </button>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '14px 20px', display: 'flex',
                justifyContent: 'center', gap: '8px',
                borderTop: '1px solid #e2e8f0',
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
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