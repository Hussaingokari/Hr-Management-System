'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getMyAttendance, checkIn, checkOut,
  getMyLeaves, getLeaveBalance,
  getUnreadCount, getMyNotifications
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '20px',
      border: '1px solid #e2e8f0', flex: 1,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</span>
        <div style={{ width: '36px', height: '36px', background: color + '20', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    APPROVED: { bg: '#dcfce7', color: '#16a34a' },
    PENDING: { bg: '#fef9c3', color: '#ca8a04' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626' },
    CANCELLED: { bg: '#f1f5f9', color: '#64748b' },
    CANCELLATION_PENDING: { bg: '#fdf4ff', color: '#9333ea' },
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Same palette used across the leave pages, so balances look consistent everywhere
const balanceStyle = {
  ANNUAL: { color: '#4F46E5', soft: '#EEF0FF', icon: '🌴' },
  SICK: { color: '#0D9488', soft: '#ECFDF9', icon: '🤒' },
  CASUAL: { color: '#D97706', soft: '#FFF7ED', icon: '☀️' },
  PATERNITY: { color: '#8B5CF6', soft: '#F5F3FF', icon: '👨‍🍼' },
  MATERNITY: { color: '#DB2777', soft: '#FDF2F8', icon: '🤱' },
  UNPAID: { color: '#64748B', soft: '#F1F5F9', icon: '📋' },
};

function MiniRing({ pct, color }) {
  const size = 40;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `conic-gradient(${color} ${pct * 3.6}deg, #EEF0F5 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: size - 8, height: size - 8, borderRadius: '50%',
        background: 'white', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '9px', fontWeight: 800, color,
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useSelector((state) => state.auth);

  const [attendance, setAttendance] = useState(null);
  const [todayAtt, setTodayAtt] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, leaveRes, balRes, notifRes, unreadRes] = await Promise.allSettled([
        getMyAttendance(0, 35), // fetch enough records to cover a full 30-day attendance window
        getMyLeaves(0, 5),
        getLeaveBalance(),
        getMyNotifications(0, 5),
        getUnreadCount(),
      ]);

      if (attRes.status === 'fulfilled') {
        const records = attRes.value.data?.data?.content || [];
        setAttendance(records);
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const todayRecord = records.find(r => r.date === today);
        setTodayAtt(todayRecord || null);
      }
      if (leaveRes.status === 'fulfilled') {
        setLeaves(leaveRes.value.data?.data?.content || []);
      }
      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data?.data?.content || []);
      }
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAll(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn();
      toast.success('Checked in successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await checkOut();
      toast.success('Checked out successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const presentDays = attendance?.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length || 0;
  const annualBalance = balance.find(b => b.leaveType === 'ANNUAL');
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Welcome back, {user?.name}! Here&apos;s your overview for today.
        </p>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Stats Row */}
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Present Days"
              value={presentDays}
              sub="This month"
              color="#3b82f6" icon="📅"
            />
            <StatCard
              label="Leave Balance"
              value={annualBalance ? `${annualBalance.remaining} days` : '—'}
              sub="Annual remaining"
              color="#16a34a" icon="🌴"
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeaves}
              sub="Awaiting approval"
              color="#f59e0b" icon="⏳"
            />
            <StatCard
              label="Notifications"
              value={unreadCount}
              sub="Unread alerts"
              color="#8b5cf6" icon="🔔"
            />
          </div>

          {/* Main Grid */}
          <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Today Attendance */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
                📅 Today&apos;s Attendance
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Check In</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: todayAtt?.checkIn ? '#16a34a' : '#cbd5e1' }}>
                    {todayAtt?.checkIn ? todayAtt.checkIn.substring(0, 5) : '--:--'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Check Out</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: todayAtt?.checkOut ? '#f59e0b' : '#cbd5e1' }}>
                    {todayAtt?.checkOut ? todayAtt.checkOut.substring(0, 5) : '--:--'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {todayAtt?.workHours ? `${todayAtt.workHours}h worked` : 'Not yet'}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              {todayAtt && (
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <Badge status={todayAtt.status} />
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayAtt?.checkIn || checkingIn}
                  style={{
                    flex: 1, padding: '10px',
                    background: todayAtt?.checkIn ? '#f1f5f9' : '#dcfce7',
                    color: todayAtt?.checkIn ? '#94a3b8' : '#16a34a',
                    border: `1px solid ${todayAtt?.checkIn ? '#e2e8f0' : '#bbf7d0'}`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    cursor: todayAtt?.checkIn ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {checkingIn ? '⏳' : todayAtt?.checkIn ? '✓ Checked In' : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!todayAtt?.checkIn || !!todayAtt?.checkOut || checkingOut}
                  style={{
                    flex: 1, padding: '10px',
                    background: todayAtt?.checkOut ? '#f1f5f9' : (!todayAtt?.checkIn ? '#f1f5f9' : '#fff7ed'),
                    color: (todayAtt?.checkOut || !todayAtt?.checkIn) ? '#94a3b8' : '#f59e0b',
                    border: `1px solid ${(todayAtt?.checkOut || !todayAtt?.checkIn) ? '#e2e8f0' : '#fed7aa'}`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    cursor: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {checkingOut ? '⏳' : todayAtt?.checkOut ? '✓ Checked Out' : 'Check Out'}
                </button>
              </div>
            </div>

            {/* Leave Balance — redesigned: icon chips + gradient rounded bars instead of plain bars */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
                🌿 Leave Balance
              </h3>
              {balance.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>
                  No leave balance data found
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {balance.map((b, i) => {
                    const c = balanceStyle[b.leaveType] || balanceStyle.UNPAID;
                    const pct = b.totalAllotted > 0 ? Math.min(100, (b.remaining / b.totalAllotted) * 100) : 0;
                    return (
                      <div key={i} style={{
                        background: c.soft, borderRadius: '14px', padding: '12px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        border: `1px solid ${c.color}22`,
                      }}>
                        <MiniRing pct={pct} color={c.color} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: c.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{c.icon}</span>{b.leaveType}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', fontFamily: "'Quicksand', sans-serif" }}>
                            {b.remaining}<span style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}> /{b.totalAllotted}d</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Recent Leave Requests */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>📋 Recent Leave Requests</h3>
              </div>
              {leaves.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>
                  No leave requests found
                </div>
              ) : (
                leaves.slice(0, 4).map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: i < leaves.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{l.leaveType} Leave</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{l.startDate} – {l.endDate} · {l.totalDays} day(s)</div>
                    </div>
                    <Badge status={l.status} />
                  </div>
                ))
              )}
            </div>

            {/* Recent Notifications */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>🔔 Recent Notifications</h3>
                {unreadCount > 0 && (
                  <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>
                  No notifications found
                </div>
              ) : (
                notifications.slice(0, 4).map((n, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: n.isRead ? '#cbd5e1' : '#3b82f6',
                      flexShrink: 0, marginTop: '5px',
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{n.message?.substring(0, 60)}...</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                        {new Date(n.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}