'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, Bell, PartyPopper, XCircle, Loader2, Check, X, Calendar, UserPlus, Banknote, Briefcase } from 'lucide-react';

function generateSparkline(value, id) {
  if (!value || value === 0) return "M 0 40 L 200 40";
  const seed = (id || '').length + (typeof value === 'number' ? value : 10);
  const p1y = 35 - (seed % 10);
  const p2y = 15 + ((seed * 2) % 15);
  const p3y = 30 - ((seed * 3) % 15);
  const p4y = 10 + ((seed * 5) % 10);
  return `M 0 40 Q 25 ${p1y} 50 ${p2y} T 100 ${p3y} T 150 ${p4y} T 200 15`;
}

function StatCard({ label, value, sub, color, bg, icon, sparklineId }) {
  const sparklinePath = generateSparkline(value, sparklineId);
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
    APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    PENDING: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
    CANCELLED: { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' },
    CANCELED: { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' },
    CANCELLATION_PENDING: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
    ACTIVE: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    INACTIVE: { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' },
    PRESENT: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    ABSENT: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
    HALF_DAY: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    LATE: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
  };
  const s = map[status] || { bg: '#1E293B', color: 'var(--text-secondary)' };
  
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
      border: `1px solid ${s.color}`
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const [empRes, leaveRes, attRes] = await Promise.allSettled([
        api.get('/api/employees?size=1000'),
        api.get('/api/leaves/pending?size=1000'),
        api.get(`/api/attendance/date/${todayStr}?size=1000`)
      ]);

      if (empRes.status === 'fulfilled') {
        const d = empRes.value.data?.data;
        if (Array.isArray(d)) setEmployees(d);
        else if (d?.content) setEmployees(d.content);
      }
      if (leaveRes.status === 'fulfilled') {
        const d = leaveRes.value.data?.data;
        if (Array.isArray(d)) setPendingLeaves(d);
        else if (d?.content) setPendingLeaves(d.content);
      }
      if (attRes.status === 'fulfilled') {
        const d = attRes.value.data?.data;
        if (Array.isArray(d)) setTodayAttendance(d);
        else if (d?.content) setTodayAttendance(d.content);
        else setTodayAttendance([]);
      }

    } catch (err) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLeaveAction = async (id, status) => {
    setActioning(id + status);
    try {
      await api.put(`/api/leaves/${id}/action`, { action: status, remarks: `Automatically ${status.toLowerCase()} from dashboard` });
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update leave');
    } finally {
      setActioning(null);
    }
  };

  const activeEmployees = employees.filter(e => e.active);
  const presentToday = todayAttendance.filter(a => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
  const unreadCount = 0; // Placeholder

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', margin: '-24px', borderRadius: '16px' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&display=swap');
      `}</style>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Welcome back, Admin 👋
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Here&apos;s your system overview.
        </p>

        {/* Decorative Mountain Graphic Top Right */}
        <div style={{ 
          position: 'absolute', top: -30, right: 0, height: '140px', 
          pointerEvents: 'none', display: 'flex',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
        }}>
          <img
            src="/up.png"
            alt="Header Landscape"
            style={{
              height: '100%',
              width: 'auto',
              borderTopRightRadius: '16px',
              opacity: 0.9,
              display: 'block',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', marginBottom: '16px' }} />
          Loading...
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Total Employees"
              value={employees.length}
              sub={`${activeEmployees.length} active`}
              color="#3b82f6" icon={<Users size={20} />}
              sparklineId="emp"
            />
            <StatCard
              label="Present Today"
              value={presentToday}
              sub={`of ${todayAttendance.length} checked in`}
              color="#14b8a6" icon={<Calendar size={20} />}
              sparklineId="present"
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeaves.filter(l => l.status === 'PENDING').length}
              sub="Awaiting approval"
              color="#f59e0b" icon={<Clock size={20} />}
              sparklineId="pending"
            />
            <StatCard
              label="Notifications"
              value={unreadCount}
              sub="Unread messages"
              color="#8b5cf6" icon={<Bell size={20} />}
              sparklineId="notif"
            />
          </div>

          {/* Main Grid */}
          <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Leave Approvals & Requests Section */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ marginRight: '6px' }} /> Leave Requests
                </h3>
                <button
                  onClick={() => router.push('/admin/leave')}
                  style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View All →
                </button>
              </div>

              {pendingLeaves.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#8b5cf6' }}><PartyPopper size={32} strokeWidth={1.5} /></div>
                  No leave requests found
                </div>
              ) : (
                pendingLeaves.map((l, i) => {
                  const isCancelled = ['CANCELLED', 'CANCELED', 'CANCELLATION_PENDING'].includes(l.status);

                  return (
                    <div key={l.id || i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {l.employeeName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {l.leaveType} · {l.startDate} to {l.endDate} · {l.totalDays} day(s)
                          </div>
                        </div>
                        <Badge status={l.status} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                        &quot;{l.reason}&quot;
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isCancelled ? (
                          /* Display explicit status if employee cancelled their leave */
                          <div
                            style={{
                              padding: '6px 14px',
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--card-border)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <XCircle size={14} /> Leave was cancelled by the employee
                          </div>
                        ) : l.status !== 'PENDING' ? (
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            Actioned ({l.status})
                          </div>
                        ) : (
                          <>
                            {/* Approve Button */}
                            <button
                              onClick={() => handleLeaveAction(l.id, 'APPROVED')}
                              disabled={actioning === l.id + 'APPROVED'}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid #10b981',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: actioning === l.id + 'APPROVED' ? 'not-allowed' : 'pointer',
                                opacity: actioning === l.id + 'APPROVED' ? 0.7 : 1,
                                transition: 'background-color 0.2s',
                              }}
                            >
                              {actioning === l.id + 'APPROVED' ? <><Loader2 size={12} className="animate-spin" style={{ display: 'inline', marginRight: '4px' }} /> Processing...</> : <><Check size={12} style={{ display: 'inline', marginRight: '4px' }} /> Approve</>}
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleLeaveAction(l.id, 'REJECTED')}
                              disabled={actioning === l.id + 'REJECTED'}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: actioning === l.id + 'REJECTED' ? 'not-allowed' : 'pointer',
                                opacity: actioning === l.id + 'REJECTED' ? 0.7 : 1,
                                transition: 'background-color 0.2s',
                              }}
                            >
                              {actioning === l.id + 'REJECTED' ? <><Loader2 size={12} className="animate-spin" style={{ display: 'inline', marginRight: '4px' }} /> Processing...</> : <><X size={12} style={{ display: 'inline', marginRight: '4px' }} /> Reject</>}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Today's Attendance */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <Calendar size={16} style={{ marginRight: '6px', color: '#10b981' }} /> Today&apos;s Attendance
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/admin/attendance')}
                  style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View All →
                </button>
              </div>

              {todayAttendance.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#10b981' }}><Calendar size={32} strokeWidth={1.5} /></div>
                  No attendance records for today
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {todayAttendance.map((a, i) => (
                    <div key={a.id || a.employeeId || i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 20px', borderBottom: '1px solid var(--card-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px',
                          background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', color: '#3b82f6',
                        }}>
                          {(a.employeeName || '').split(' ').map(n => n[0] || '').join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {a.employeeName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            In: {a.checkIn?.substring(0, 5) || '--'} · Out: {a.checkOut?.substring(0, 5) || '--'}
                          </div>
                        </div>
                      </div>
                      <Badge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Employees Table */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <Users size={16} style={{ marginRight: '6px', color: '#3b82f6' }} /> Employees
              </h3>
              <button
                onClick={() => router.push('/admin/employees')}
                style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All →
              </button>
            </div>

            <div className="table-responsive">
              <div className="admin-employees-table" style={{ minWidth: '680px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr', padding: '12px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--card-border)' }}>
                  {['Emp ID', 'Name', 'Department', 'Designation', 'Role', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {employees.slice(0, 6).map((e, i) => (
                  <div key={e.id || e.employeeId || i} style={{
                    display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr',
                    padding: '16px 20px', borderBottom: '1px solid var(--card-border)', alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {e.employeeId || e.employeeCode || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', color: '#3b82f6', flexShrink: 0,
                      }}>
                        {e.firstName?.[0]}{e.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {e.firstName} {e.lastName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{e.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{e.department || '—'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{e.designation || '—'}</div>
                    <div>
                      <span style={{
                        background: e.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.15)' : e.role === 'HR' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: e.role === 'ADMIN' ? '#3b82f6' : e.role === 'HR' ? '#8b5cf6' : 'var(--text-secondary)',
                        border: `1px solid ${e.role === 'ADMIN' ? '#3b82f6' : e.role === 'HR' ? '#8b5cf6' : 'var(--card-border)'}`,
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      }}>
                        {e.role}
                      </span>
                    </div>
                    <div>
                      <Badge status={e.active ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
            {[
              { label: 'Add Employee', icon: <UserPlus size={20} />, color: '#3b82f6', route: '/admin/employees' },
              { label: 'Leave Approvals', icon: <CheckCircle size={20} />, color: '#10b981', route: '/admin/leave' },
              { label: 'Generate Payroll', icon: <Banknote size={20} />, color: '#f59e0b', route: '/admin/payroll' },
              { label: 'Recruitment', icon: <Briefcase size={20} />, color: '#8b5cf6', route: '/admin/recruitment' },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => router.push(a.route)}
                style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: '12px', padding: '16px',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '12px',
                  boxShadow: 'var(--card-shadow)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--card-bg)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onFocus={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={e => {
                  e.currentTarget.style.background = 'var(--card-bg)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  background: a.color + '15',
                  borderRadius: '10px',
                  border: `1px solid ${a.color}40`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                  color: a.color
                }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}