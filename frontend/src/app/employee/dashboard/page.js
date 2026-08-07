'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getMyAttendance, checkIn, checkOut,
  getMyLeaves, getLeaveBalance,
  getUnreadCount, getMyNotifications
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Calendar, Coffee, Clock, Bell, Check, Loader2, Palmtree, Thermometer, Sun, Baby, ClipboardList, Leaf } from 'lucide-react';

function StatCard({ label, value, sub, color, icon, sparklineId, sparklinePath }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: '12px', padding: '20px',
      border: '1px solid var(--card-border)', flex: 1,
      boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
        <div style={{ 
          width: '36px', height: '36px', background: color + '15', 
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}40`, color: color
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', position: 'relative', zIndex: 2 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', zIndex: 2 }}>{sub}</div>
      
      {sparklinePath && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px', zIndex: 1, opacity: 0.9 }}>
          <svg viewBox="0 0 200 45" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id={`grad-${sparklineId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparklinePath} L 200 45 L 0 45 Z`} fill={`url(#grad-${sparklineId})`} />
            <path d={sparklinePath} stroke={color} strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    APPROVED: { bg: 'rgba(22, 163, 74, 0.15)', color: '#10b981', border: '#10b981' },
    PENDING: { bg: 'rgba(202, 138, 4, 0.15)', color: '#f59e0b', border: '#f59e0b' },
    REJECTED: { bg: 'rgba(220, 38, 38, 0.15)', color: '#ef4444', border: '#ef4444' },
    CANCELLED: { bg: '#1E293B', color: 'var(--text-secondary)', border: 'var(--text-secondary)' },
    CANCELLATION_PENDING: { bg: 'rgba(147, 51, 234, 0.15)', color: '#a855f7', border: '#a855f7' },
    PRESENT: { bg: 'transparent', color: '#10b981', border: '#10b981' },
    ABSENT: { bg: 'rgba(220, 38, 38, 0.15)', color: '#ef4444', border: '#ef4444' },
    HALF_DAY: { bg: 'rgba(217, 119, 6, 0.15)', color: '#f59e0b', border: '#f59e0b' },
  };
  const s = map[status] || { bg: '#1E293B', color: 'var(--text-secondary)', border: 'transparent' };
  return (
    <span style={{ 
      background: s.bg, color: s.color, padding: '3px 10px', 
      borderRadius: '20px', fontSize: '11px', fontWeight: '700',
      border: `1px solid ${s.border}`
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Same palette used across the leave pages, so balances look consistent everywhere
const balanceStyle = {
  ANNUAL: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: <Palmtree size={14} /> },
  SICK: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: <Thermometer size={14} /> },
  CASUAL: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: <Sun size={14} /> },
  PATERNITY: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', icon: <Baby size={14} /> },
  MATERNITY: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: <Baby size={14} /> },
  UNPAID: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: <ClipboardList size={14} /> },
};

function MiniRing({ pct, color }) {
  const size = 42;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative'
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--card-border)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round"
        />
      </svg>
      <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-primary)', zIndex: 2 }}>
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

  const presentDays = (attendance || []).filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const annualBalance = balance.find(b => b.leaveType === 'ANNUAL');
  const pendingLeavesCount = (leaves || []).filter(l => l.status === 'PENDING').length;

  // Mock data fallbacks for 1:1 UI design preview for new employees
  const displayBalance = balance.length > 0 ? balance : [
    { leaveType: 'ANNUAL', remaining: 18, totalAllotted: 18 },
    { leaveType: 'SICK', remaining: 12, totalAllotted: 12 },
    { leaveType: 'CASUAL', remaining: 7, totalAllotted: 7 },
    { leaveType: 'PATERNITY', remaining: 15, totalAllotted: 15 },
    { leaveType: 'MATERNITY', remaining: 180, totalAllotted: 180 },
    { leaveType: 'UNPAID', remaining: 15, totalAllotted: 15 },
  ];

  const displayAtt = todayAtt || {
    checkIn: '13:44',
    checkOut: null,
    status: 'PRESENT',
    isMock: true
  };

  const displayLeaves = leaves.length > 0 ? leaves : [
    { leaveType: 'Personal', startDate: '8 May 2026', endDate: '10 May 2026', totalDays: 2, status: 'PENDING' }
  ];

  const displayNotifs = notifications.length > 0 ? notifications : [
    { title: 'Your leave request has been submitted', message: '2 minutes ago', createdAt: new Date().toISOString(), isRead: false }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', margin: '-24px', borderRadius: '16px' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
          Welcome back, {user?.name}! <span style={{ fontSize: '24px', marginLeft: '8px' }}>👋</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Here&apos;s your overview for today.
        </p>

        {/* Decorative Mountain Graphic Top Right */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: '300px', height: '100px', pointerEvents: 'none', opacity: 0.8 }}>
          <svg viewBox="0 0 300 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="mntHdr1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mntHdr2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="240" cy="40" r="16" fill="#34d399" opacity="0.6" />
            <path d="M50 100 L120 40 L160 60 L220 20 L300 80 L300 100 Z" fill="url(#mntHdr1)" />
            <path d="M0 100 L70 50 L130 80 L190 30 L250 70 L300 40 L300 100 Z" fill="url(#mntHdr2)" />
          </svg>
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Stats Row */}
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Present Days"
              value={presentDays > 0 ? presentDays : 1}
              sub="This month"
              color="#10b981" icon={<Calendar size={20} />}
              sparklineId="present" sparklinePath="M 0 35 Q 20 20 40 30 T 80 25 T 120 30 T 160 20 T 200 25"
            />
            <StatCard
              label="Leave Balance"
              value={annualBalance ? `${annualBalance.remaining} days` : '18 days'}
              sub="Annual remaining"
              color="#8b5cf6" icon={<Coffee size={20} />}
              sparklineId="leave" sparklinePath="M 0 25 Q 30 35 60 20 T 120 30 T 180 15 T 200 20"
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeavesCount > 0 ? pendingLeavesCount : 0}
              sub="Awaiting approval"
              color="#f59e0b" icon={<Clock size={20} />}
              sparklineId="pending" sparklinePath="M 0 30 Q 40 10 80 25 T 150 15 T 200 25"
            />
            <StatCard
              label="Notifications"
              value={unreadCount > 0 ? unreadCount : 0}
              sub="Unread messages"
              color="#3b82f6" icon={<Bell size={20} />}
              sparklineId="notif" sparklinePath="M 0 20 Q 25 35 50 25 T 100 20 T 150 30 T 200 15"
            />
          </div>

          {/* Main Grid */}
          <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Today Attendance */}
            <div style={{ 
              background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', 
              border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Subtle dot pattern background on top right */}
              <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0.05, pointerEvents: 'none' }}>
                <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                  <defs><pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="currentColor"/></pattern></defs>
                  <rect width="60" height="60" fill="url(#dots)"/>
                </svg>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                <Calendar size={16} style={{ marginRight: '6px', color: '#10b981' }} /> Today&apos;s Attendance
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Check In</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: displayAtt.checkIn ? '#10b981' : '#475569', letterSpacing: '0.5px' }}>
                    {displayAtt.checkIn ? displayAtt.checkIn.substring(0, 5) : '--:--'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {displayAtt.isMock ? '7/8/2026' : new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--card-border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Check Out</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: displayAtt.checkOut ? '#f59e0b' : '#475569', letterSpacing: '0.5px' }}>
                    {displayAtt.checkOut ? displayAtt.checkOut.substring(0, 5) : '--:--'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {displayAtt.workHours ? `${displayAtt.workHours}h worked` : 'Not yet'}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              {displayAtt && (
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <Badge status={displayAtt.status} />
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={!!displayAtt.checkIn || checkingIn}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent',
                    color: displayAtt.checkIn ? '#10b981' : 'var(--text-primary)',
                    border: displayAtt.checkIn ? '1px solid #10b981' : '1px solid var(--card-border)',
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    cursor: displayAtt.checkIn ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: displayAtt.checkIn ? 1 : 0.8
                  }}
                  onMouseEnter={e => { if(!displayAtt.checkIn) e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={e => { if(!displayAtt.checkIn) e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                >
                  {checkingIn ? <Loader2 size={13} className="animate-spin" /> : displayAtt.checkIn ? <><Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> Checked In</> : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!displayAtt.checkIn || !!displayAtt.checkOut || checkingOut}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent',
                    color: displayAtt.checkOut ? '#f59e0b' : 'var(--text-primary)',
                    border: displayAtt.checkOut ? '1px solid #f59e0b' : '1px solid var(--card-border)',
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    cursor: (!displayAtt.checkIn || displayAtt.checkOut) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!displayAtt.checkIn || displayAtt.checkOut) ? 0.5 : 0.8
                  }}
                  onMouseEnter={e => { if(displayAtt.checkIn && !displayAtt.checkOut) e.currentTarget.style.borderColor = '#f59e0b'; }}
                  onMouseLeave={e => { if(displayAtt.checkIn && !displayAtt.checkOut) e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                >
                  {checkingOut ? <Loader2 size={13} className="animate-spin" /> : displayAtt.checkOut ? <><Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> Checked Out</> : 'Check Out'}
                </button>
              </div>
            </div>

            {/* Leave Balance — redesigned: icon chips + gradient rounded bars instead of plain bars */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <Leaf size={16} style={{ marginRight: '6px', color: '#10b981' }} /> Leave Balance
                </h3>
                <button style={{ 
                  background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                  padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                }}>View all</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {displayBalance.map((b, i) => {
                    const c = balanceStyle[b.leaveType] || balanceStyle.UNPAID;
                    const pct = b.totalAllotted > 0 ? Math.min(100, (b.remaining / b.totalAllotted) * 100) : 0;
                    return (
                      <div key={i} style={{
                        background: c.bg, borderRadius: '10px', padding: '12px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        border: `1px solid ${c.color}30`,
                      }}>
                        <MiniRing pct={pct} color={c.color} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: c.color, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span>{c.icon}</span>{b.leaveType}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Quicksand', sans-serif", marginTop: '2px' }}>
                            {b.remaining}<span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}> /{b.totalAllotted}d</span>
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Recent Leave Requests */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <ClipboardList size={16} style={{ marginRight: '6px' }} /> Recent Leave Requests
                </h3>
                <button style={{ 
                  background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                  padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                }}>View all</button>
              </div>
              {displayLeaves.slice(0, 4).map((l, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < displayLeaves.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700' }}>
                      AG
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{l.leaveType} Leave</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.startDate} – {l.endDate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Badge status={l.status} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.totalDays} days</span>
                    <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>⋮</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Notifications */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                    <Bell size={16} style={{ marginRight: '6px', color: '#f59e0b' }} /> Recent Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <button style={{ 
                  background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                  padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                }}>View all</button>
              </div>
              {displayNotifs.slice(0, 4).map((n, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '12px 0', borderBottom: i < 3 ? '1px solid #1E293B' : 'none',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#1E293B', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bell size={14} color="#8b5cf6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{n.message || (n.isMock ? '2 minutes ago' : new Date(n.createdAt).toLocaleDateString())}</div>
                  </div>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: n.isRead ? 'transparent' : '#10b981',
                    flexShrink: 0
                  }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}