'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  getAllEmployees,
  getAttendanceByDate,
} from '@/lib/adminApi';
import { getUnreadCount } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, Bell, PartyPopper, XCircle, Loader2, Check, X, Calendar, UserPlus, Banknote, Briefcase } from 'lucide-react';

function StatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: '12px', padding: '20px',
      border: '1px solid var(--card-border)', flex: 1,
      boxShadow: 'var(--card-shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
        <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '900', color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    APPROVED: { bg: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' },
    PENDING: { bg: 'rgba(202, 138, 4, 0.15)', color: '#ca8a04' },
    REJECTED: { bg: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' },
    CANCELLED: { bg: '#1E293B', color: 'var(--text-secondary)' },
    CANCELED: { bg: '#1E293B', color: 'var(--text-secondary)' },
    CANCELLATION_PENDING: { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea' },
    ACTIVE: { bg: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' },
    INACTIVE: { bg: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#1E293B', color: 'var(--text-secondary)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminDashboard() {
  const { user } = useSelector(s => s.auth);
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const [empRes, leaveRes, attRes, unreadRes] = await Promise.allSettled([
        getAllEmployees(0, 100),
        api.get('/api/leaves/pending?page=0&size=10'),
        getAttendanceByDate(today),
        getUnreadCount(),
      ]);

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data?.data?.content || []);
      }
      if (leaveRes.status === 'fulfilled') {
        setPendingLeaves(leaveRes.value.data?.data?.content || leaveRes.value.data?.data || []);
      }
      if (attRes.status === 'fulfilled') {
        setTodayAttendance(attRes.value.data?.data?.content || attRes.value.data?.data || []);
      }
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (err) {
      toast.error('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Single-stage: either Admin or HR can approve/reject directly — first click wins
  const handleLeaveAction = async (id, action) => {
    setActioning(id + action);
    try {
      await api.put(`/api/leaves/${id}/action`, {
        action,
        remarks: action === 'APPROVED' ? 'Approved' : 'Rejected',
      });
      toast.success(action === 'APPROVED' ? 'Leave approved!' : 'Leave rejected');
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? 'Someone already actioned this one' : msg);
      fetchAll();
    } finally {
      setActioning(null);
    }
  };

  const activeEmployees = employees.filter(e => e.active);
  const presentToday = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', margin: '-24px', borderRadius: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Welcome back, {user?.name}! Here&apos;s your system overview.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Total Employees"
              value={employees.length}
              sub={`${activeEmployees.length} active`}
              color="#1e3a5f" bg="#eff6ff" icon={<Users size={22} color="#1e3a5f" />}
            />
            <StatCard
              label="Present Today"
              value={presentToday}
              sub={`of ${todayAttendance.length} checked in`}
              color="#16a34a" bg="#dcfce7" icon={<CheckCircle size={22} color="#16a34a" />}
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeaves.filter(l => l.status === 'PENDING').length}
              sub="Awaiting approval"
              color="#f59e0b" bg="#fff7ed" icon={<Clock size={22} color="#f59e0b" />}
            />
            <StatCard
              label="Notifications"
              value={unreadCount}
              sub="Unread messages"
              color="#3b82f6" bg="#dbeafe" icon={<Bell size={22} color="#3b82f6" />}
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><PartyPopper size={32} strokeWidth={1.5} /></div>
                  No leave requests found
                </div>
              ) : (
                pendingLeaves.map((l, i) => {
                  const isCancelled = ['CANCELLED', 'CANCELED', 'CANCELLATION_PENDING'].includes(l.status);

                  return (
                    <div key={l.id || i} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
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
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--text-secondary)',
                              border: '1px solid #cbd5e1',
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
                        ) : (
                          <>
                            {/* Approve Button */}
                            <button
                              onClick={() => handleLeaveAction(l.id, 'APPROVED')}
                              disabled={actioning === l.id + 'APPROVED'}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
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
                                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
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
                    <Calendar size={16} style={{ marginRight: '6px' }} /> Today&apos;s Attendance
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Calendar size={32} strokeWidth={1.5} /></div>
                  No attendance records for today
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {todayAttendance.map((a, i) => (
                    <div key={a.id || a.employeeId || i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
                    }}>
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
                <Users size={16} style={{ marginRight: '6px' }} /> Employees
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
                <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr', padding: '10px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }}>
                  {['Emp ID', 'Name', 'Department', 'Designation', 'Role', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {employees.slice(0, 6).map((e, i) => (
                  <div key={e.id || e.employeeId || i} style={{
                    display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr',
                    padding: '12px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center',
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {e.employeeId || e.employeeCode || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', flexShrink: 0,
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
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{e.department || '—'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{e.designation || '—'}</div>
                    <div>
                      <span style={{
                        background: e.role === 'ADMIN' ? '#dbeafe' : e.role === 'HR' ? 'rgba(147, 51, 234, 0.15)' : '#1E293B',
                        color: e.role === 'ADMIN' ? '#1d4ed8' : e.role === 'HR' ? '#9333ea' : '#1E293B',
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
              { label: 'Add Employee', icon: <UserPlus size={20} />, color: '#1e3a5f', route: '/admin/employees' },
              { label: 'Leave Approvals', icon: <CheckCircle size={20} />, color: '#16a34a', route: '/admin/leave' },
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
                  e.currentTarget.style.background = '#1E293B';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onFocus={e => {
                  e.currentTarget.style.background = '#1E293B';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  background: a.color + '15',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', flexShrink: 0,
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