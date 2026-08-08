'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyAttendance, checkIn, checkOut, startBreak, endBreak } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Pause, Loader2, Check, ArrowRight, Play, ArrowLeft, CheckCircle, Zap, XCircle, BarChart2, Calendar, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';

function StatCard({ label, value, sub, color, bg, icon, sparklineId, sparklinePath }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${color}10, var(--card-bg))`, 
      borderRadius: '14px', padding: '20px',
      border: `1px solid ${color}25`, flex: 1,
      boxShadow: `0 4px 20px -2px ${color}15`, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.3px' }}>{label}</span>
        <div style={{ 
          width: '36px', height: '36px', background: `${color}15`, 
          borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}40`, color: color,
          boxShadow: `inset 0 0 10px ${color}10`
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', position: 'relative', zIndex: 2 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', zIndex: 2 }}>{sub}</div>
      
      {sparklinePath && (
        <div style={{ 
          position: 'absolute', bottom: '20px', right: '20px', width: '45%', height: '35px', zIndex: 1, opacity: 0.9,
          maskImage: 'linear-gradient(to right, transparent 0%, black 25%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%)'
        }}>
          <svg viewBox="0 0 200 45" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id={`grad-${sparklineId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparklinePath} L 200 45 L 0 45 Z`} fill={`url(#grad-${sparklineId})`} />
            <path d={sparklinePath} stroke={color} strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    PRESENT: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '#10b981' },
    ABSENT: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '#ef4444' },
    HALF_DAY: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '#f59e0b' },
    LATE: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '#8b5cf6' },
  };
  const s = map[status] || { bg: '#1E293B', color: 'var(--text-secondary)', border: 'transparent' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
      border: `1px solid ${s.border}`
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function formatDuration(mins) {
  if (mins == null) return '--';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m} min` : `${m} min`;
}

export default function AttendancePage() {
  const { user } = useSelector(state => state.auth);
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [togglingBreak, setTogglingBreak] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance(page, 10);
      const data = res.data?.data;
      const content = data?.content || [];
      setRecords(content);
      setTotalPages(data?.totalPages || 0);
      
      const today = new Date().toISOString().split('T')[0];
      if (page === 0) {
        const todayRecord = content.find(r => r.date === today);
        setTodayAtt(todayRecord || null);
      } else {
        const todayRes = await getMyAttendance(0, 5);
        const todayContent = todayRes.data?.data?.content || [];
        const todayRecord = todayContent.find(r => r.date === today);
        setTodayAtt(todayRecord || null);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAttendance(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn();
      toast.success('Checked in successfully!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await checkOut(remarks);
      toast.success('Checked out successfully!');
      setShowRemarks(false);
      setRemarks('');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
      console.error(err);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleToggleBreak = async () => {
    setTogglingBreak(true);
    try {
      if (todayAtt?.onBreak) {
        await endBreak();
        toast.success('Break ended — welcome back!');
      } else {
        await startBreak();
        toast.success('Break started');
      }
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update break');
      console.error(err);
    } finally {
      setTogglingBreak(false);
    }
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const halfDayCount = records.filter(r => r.status === 'HALF_DAY').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;

  const canBreak = !!todayAtt?.checkIn && !todayAtt?.checkOut;
  const onBreak = !!todayAtt?.onBreak;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', margin: '-24px', borderRadius: '16px' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Attendance
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Track your daily attendance and work hours
        </p>
      </div>

      {loading && page === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', marginBottom: '16px' }} />
          Loading...
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Present Days"
              value={presentCount}
              sub="This period"
              color="#14b8a6"
              icon={<Calendar size={20} />}
              sparklineId="present"
              sparklinePath="M 0 35 Q 20 20, 50 30 T 100 25 T 150 20 T 200 15"
            />
            <StatCard
              label="Half Days"
              value={halfDayCount}
              sub="This period"
              color="#f59e0b"
              icon={<Zap size={20} />}
              sparklineId="half"
              sparklinePath="M 0 40 Q 30 30, 70 35 T 130 25 T 200 20"
            />
            <StatCard
              label="Absent Days"
              value={absentCount}
              sub="This period"
              color="#ef4444"
              icon={<XCircle size={20} />}
              sparklineId="absent"
              sparklinePath="M 0 30 Q 25 15, 60 25 T 120 15 T 180 20 T 200 10"
            />
            <StatCard
              label="Total Records"
              value={records.length}
              sub="Fetched"
              color="#3b82f6"
              icon={<BarChart2 size={20} />}
              sparklineId="records"
              sparklinePath="M 0 25 Q 40 10, 80 20 T 150 15 T 200 5"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Today's Card matches Dashboard Aesthetic */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} style={{ marginRight: '6px', color: '#10b981' }} /> Today&apos;s Attendance
                </h3>
                {onBreak && (
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #f59e0b' }}>
                    <Pause size={11} style={{ display: 'inline', marginRight: '4px' }} /> ON BREAK
                  </span>
                )}
                {todayAtt?.status && !onBreak && (
                  <Badge status={todayAtt.status} />
                )}
              </div>

              <div style={{ padding: '24px 20px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
                
                <div style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Check In</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: todayAtt?.checkIn ? '#10b981' : 'var(--text-secondary)' }}>
                    {todayAtt?.checkIn ? todayAtt.checkIn.substring(0, 5) : '--:--'}
                  </div>
                </div>

                <div style={{ width: '1px', height: '60px', background: 'var(--card-border)' }} />

                <div style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Check Out</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: todayAtt?.checkOut ? '#f59e0b' : 'var(--text-secondary)' }}>
                    {todayAtt?.checkOut ? todayAtt.checkOut.substring(0, 5) : '--:--'}
                  </div>
                </div>

                <div style={{ width: '1px', height: '60px', background: 'var(--card-border)' }} />
                
                <div style={{ flex: 1, minWidth: '150px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Work Hours</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: todayAtt?.workHours ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {todayAtt?.workHours ? `${todayAtt.workHours}h` : '--'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Break: {formatDuration(todayAtt?.totalBreakMinutes ?? 0)}</div>
                </div>

              </div>

              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !!todayAtt?.checkIn || checkingIn}
                  style={{
                    flex: 1, padding: '12px 24px',
                    background: todayAtt?.checkIn ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: todayAtt?.checkIn ? '#10b981' : '#10b981',
                    border: '1px solid #10b981', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '700',
                    cursor: todayAtt?.checkIn ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: todayAtt?.checkIn ? 0.7 : 1
                  }}
                >
                  {checkingIn ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} /> : <Check size={16} style={{ display: 'inline', marginRight: '6px' }} />}
                  {todayAtt?.checkIn ? 'Checked In' : 'Check In'}
                </button>

                <button
                  onClick={handleToggleBreak}
                  disabled={loading || !canBreak || togglingBreak}
                  style={{
                    flex: 1, padding: '12px 24px',
                    background: onBreak ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: !canBreak ? 'var(--text-secondary)' : onBreak ? '#f59e0b' : '#3b82f6',
                    border: `1px solid ${!canBreak ? 'var(--card-border)' : onBreak ? '#f59e0b' : '#3b82f6'}`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                    cursor: !canBreak ? 'not-allowed' : 'pointer',
                  }}
                >
                  {togglingBreak ? <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} /> : onBreak ? <Play size={14} style={{ display: 'inline', marginRight: '6px' }} /> : <Pause size={14} style={{ display: 'inline', marginRight: '6px' }} />}
                  {onBreak ? 'Resume work' : 'Take a break'}
                </button>

                {!showRemarks ? (
                  <button
                    onClick={() => {
                      if (!todayAtt?.checkIn || todayAtt?.checkOut) return;
                      setShowRemarks(true);
                    }}
                    disabled={loading || !todayAtt?.checkIn || !!todayAtt?.checkOut || checkingOut}
                    style={{
                      flex: 1, padding: '12px 24px',
                      background: 'transparent',
                      color: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'var(--text-secondary)' : '#f59e0b',
                      border: `1px solid ${(!todayAtt?.checkIn || todayAtt?.checkOut) ? 'var(--card-border)' : '#f59e0b'}`,
                      borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                      cursor: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ArrowLeft size={16} style={{ display: 'inline', marginRight: '6px' }} /> 
                    {todayAtt?.checkOut ? 'Checked Out' : 'Check Out'}
                  </button>
                ) : (
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Remarks (optional)"
                      style={{
                        padding: '10px 14px', flex: 1,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px', color: 'var(--text-primary)',
                        fontSize: '13px', outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      style={{
                        padding: '10px 18px', background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b', border: '1px solid #f59e0b',
                        borderRadius: '8px', fontSize: '13px',
                        fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      {checkingOut ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowRemarks(false)}
                      style={{
                        padding: '10px 14px',
                        background: 'transparent', color: 'var(--text-secondary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div style={{
            background: 'var(--card-bg)', borderRadius: '12px',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Attendance History</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{records.length} records this period</span>
            </div>

            {records.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No attendance records found
              </div>
            ) : (
              <div className="table-responsive">
                <div style={{ minWidth: '840px' }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.3fr',
                    padding: '12px 20px', background: 'var(--bg-primary)',
                    borderBottom: '1px solid var(--card-border)',
                  }}>
                    {['Date', 'Check In', 'Check Out', 'Break', 'Work Hours', 'Status', 'Remarks'].map(h => (
                      <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Table Rows */}
                  {records.map((r, i) => (
                    <div key={r.id || r.date || i} style={{
                      display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.3fr',
                      padding: '16px 20px', borderBottom: '1px solid var(--card-border)',
                      alignItems: 'center', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        {r.checkIn ? r.checkIn.substring(0, 5) : '--'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                        {r.checkOut ? r.checkOut.substring(0, 5) : '--'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatDuration(r.totalBreakMinutes)}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {r.workHours ? `${r.workHours}h` : '--'}
                      </div>
                      <div><Badge status={r.status} /></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {r.remarks || '--'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--card-border)' }}>
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      style={{ padding: '6px 14px', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', background: 'var(--bg-primary)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      ← Prev
                    </button>
                    <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      style={{ padding: '6px 14px', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--text-primary)', background: 'var(--bg-primary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}