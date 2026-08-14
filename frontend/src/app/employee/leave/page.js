'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Leaf,
  Check,
  Clock,
  X,
  Undo2,
  Circle,
  Palmtree,
  Thermometer,
  Sun,
  Baby,
  ClipboardList,
  Sparkles,
  Lightbulb,
  Loader2,
  Calendar,
  FileText
} from 'lucide-react';


function StatCard({
  label,
  value,
  sub,
  color,
  bg,
  icon,
  sparklineId,
  sparklinePath
}) {
  return (
    <div
      style={{
        background: `linear-gradient(145deg, ${color}10, var(--card-bg))`,
        borderRadius: '14px',
        padding: '20px',
        border: `1px solid ${color}25`,
        flex: 1,
        boxShadow: `0 4px 20px -2px ${color}15`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}
        >
          {label}
        </span>

        <div
          style={{
            width: '36px',
            height: '36px',
            background: `${color}15`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}40`,
            color: color,
            boxShadow: `inset 0 0 10px ${color}10`
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 2
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {sub}
      </div>

      {sparklinePath && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '45%',
            height: '35px',
            zIndex: 1,
            opacity: 0.9,
            maskImage:
              'linear-gradient(to right, transparent 0%, black 25%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 25%)'
          }}
        >
          <svg
            viewBox="0 0 200 45"
            preserveAspectRatio="none"
            style={{
              width: '100%',
              height: '100%'
            }}
          >
            <defs>
              <linearGradient
                id={`grad-${sparklineId}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={color}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={color}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <path
              d={`${sparklinePath} L 200 45 L 0 45 Z`}
              fill={`url(#grad-${sparklineId})`}
            />

            <path
              d={sparklinePath}
              stroke={color}
              strokeWidth="2"
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}


function StatusPill({ status }) {
  const map = {
    APPROVED: {
      bg: 'rgba(16, 185, 129, 0.15)',
      color: '#10b981',
      icon: <Check size={12} strokeWidth={3} />
    },

    PENDING: {
      bg: 'rgba(245, 158, 11, 0.15)',
      color: '#f59e0b',
      icon: <Clock size={12} strokeWidth={3} />
    },

    REJECTED: {
      bg: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      icon: <X size={12} strokeWidth={3} />
    },

    CANCELLATION_PENDING: {
      bg: 'rgba(139, 92, 246, 0.15)',
      color: '#8b5cf6',
      icon: <Undo2 size={12} strokeWidth={3} />
    },

    CANCELLED: {
      bg: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-secondary)',
      icon: <Circle size={8} fill="currentColor" />
    }
  };

  const s = map[status] || map.PENDING;

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '11.5px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        border: `1px solid ${s.color}`
      }}
    >
      <span>{s.icon}</span>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}


const LEAVE_TYPES = [
  {
    value: 'SICK',
    label: 'Sick',
    icon: <Thermometer size={18} />
  },
  {
    value: 'CASUAL',
    label: 'Casual',
    icon: <Sun size={18} />
  },
  {
    value: 'PATERNITY',
    label: 'Paternity',
    icon: <Baby size={18} />
  },
  {
    value: 'MATERNITY',
    label: 'Maternity',
    icon: <Baby size={18} />
  },
  {
    value: 'UNPAID',
    label: 'Unpaid',
    icon: <ClipboardList size={18} />
  }
];

const balanceStyle = {
  ANNUAL: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    icon: <Palmtree size={14} />
  },

  SICK: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    icon: <Thermometer size={14} />
  },

  CASUAL: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: <Sun size={14} />
  },

  PATERNITY: {
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    icon: <Baby size={14} />
  },

  MATERNITY: {
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    icon: <Baby size={14} />
  },

  UNPAID: {
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    icon: <ClipboardList size={14} />
  }
};


/*
 * Progress ring
 *
 * Normal leave:
 *     0%, 25%, 50%, etc.
 *
 * Unpaid leave:
 *     Shows ∞ in the center because there is no limit.
 */
function MiniRing({ pct, color, unlimited = false }) {
  const size = 42;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safePct = Math.max(0, Math.min(100, pct));

  const dashoffset =
    circumference - (safePct / 100) * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative'
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          position: 'absolute'
        }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--card-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Normal leave progress */}
        {!unlimited && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div
        style={{
          fontSize: unlimited ? '21px' : '9px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          zIndex: 2,
          lineHeight: 1
        }}
      >
        {unlimited ? '∞' : `${Math.round(safePct)}%`}
      </div>
    </div>
  );
}


export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    leaveType: 'SICK',
    startDate: '',
    endDate: '',
    reason: ''
  });


  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [leaveRes, balRes] = await Promise.allSettled([
        api.get(`/api/leaves/my?page=${page}&size=8`),
        api.get('/api/leaves/balance')
      ]);

      if (leaveRes.status === 'fulfilled') {
        const data = leaveRes.value.data?.data;

        setLeaves(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
    } catch (err) {
      toast.error(
        "Couldn't load your leave data — try refreshing"
      );

      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);


  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);

    return () => clearTimeout(timer);
  }, [fetchAll]);


  const handleApply = async (e) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      toast.error('Pick a start and end date');
      return;
    }

    if (form.startDate < today) {
      toast.error('Start date can’t be in the past');
      return;
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      toast.error('End date needs to be after the start date');
      return;
    }

    if (!form.reason || !form.reason.trim()) {
      toast.error('Please provide a reason for your leave');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/leaves/apply', {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason
      });

      toast.success('Leave request sent!');

      setShowForm(false);

      setForm({
        leaveType: 'SICK',
        startDate: '',
        endDate: '',
        reason: ''
      });

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not submit — try again'
      );
    } finally {
      setSubmitting(false);
    }
  };


  const handleCancel = async (id) => {
    setCancelling(id);

    try {
      await api.put(
        `/api/leaves/${id}/cancel`,
        {
          reason: 'Cancelled by employee'
        }
      );

      toast.success('Cancellation processed');

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not cancel — try again'
      );
    } finally {
      setCancelling(null);
    }
  };


  const pendingLeavesCount =
    leaves.filter(
      l => l.status === 'PENDING'
    ).length;

  const approvedLeavesCount =
    leaves.filter(
      l => l.status === 'APPROVED'
    ).length;

  const annualBalance =
    balance.find(
      b => b.leaveType === 'ANNUAL'
    )?.remaining || 0;


  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '24px',
        margin: '-24px',
        borderRadius: '16px'
      }}
    >

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&display=swap');

        .lm-date-input {
          color-scheme: dark;
        }

        .lm-date-input::-webkit-calendar-picker-indicator {
          opacity: 1;
          cursor: pointer;
        }

        .lm-reason-textarea,
        .lm-reason-textarea::placeholder {
          color: var(--text-primary) !important;
          background: var(--bg-primary) !important;
          -webkit-text-fill-color: var(--text-primary) !important;
        }

        .lm-reason-textarea::placeholder {
          color: var(--text-secondary) !important;
          -webkit-text-fill-color: var(--text-secondary) !important;
        }

        .lm-type-card:hover {
          transform: translateY(-2px);
        }
      `}</style>


      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}
          >
            Leave Management
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}
          >
            Apply for leave, track your requests, and monitor your balance
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '12px 22px',
            background: 'var(--primary)',
            color: 'var(--text-primary)', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Sparkles size={16} />
          Apply for Leave
        </button>
      </div>


      {loading && page === 0 ? (

        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-secondary)'
          }}
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{
              margin: '0 auto',
              marginBottom: '16px'
            }}
          />

          Loading...
        </div>

      ) : (

        <>
          {/* Stats Row */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}
          >

            <StatCard
              label="Annual Balance"
              value={`${annualBalance} days`}
              sub="Remaining"
              color="#8b5cf6"
              icon={<Palmtree size={20} />}
              sparklineId="annual"
              sparklinePath="M 0 40 Q 30 30, 70 35 T 130 25 T 200 20"
            />

            <StatCard
              label="Pending Approvals"
              value={pendingLeavesCount}
              sub="Awaiting action"
              color="#f59e0b"
              icon={<Clock size={20} />}
              sparklineId="pending"
              sparklinePath="M 0 30 Q 25 15, 60 25 T 120 15 T 180 20 T 200 10"
            />

            <StatCard
              label="Approved Requests"
              value={approvedLeavesCount}
              sub="This period"
              color="#10b981"
              icon={<Check size={20} />}
              sparklineId="approved"
              sparklinePath="M 0 35 Q 20 20, 50 30 T 100 25 T 150 20 T 200 15"
            />

            <StatCard
              label="Total Requests"
              value={leaves.length}
              sub="Fetched"
              color="#3b82f6"
              icon={<FileText size={20} />}
              sparklineId="requests"
              sparklinePath="M 0 25 Q 40 10, 80 20 T 150 15 T 200 5"
            />

          </div>


          {/* Balance Cards */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}
          >

            {balance.length === 0 ? (

              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                No balance data available
              </div>

            ) : (

              balance.map((b, i) => {

                const c =
                  balanceStyle[b.leaveType] ||
                  balanceStyle.UNPAID;

                /*
                 * Detect unlimited unpaid leave.
                 */
                const isUnpaid =
                  b.leaveType === 'UNPAID';

                /*
                 * Normal leave:
                 *   remaining / totalAllotted
                 *
                 * Unpaid leave:
                 *   unlimited, so no percentage is calculated.
                 */
                const pct = isUnpaid
                  ? 0
                  : b.totalAllotted > 0
                    ? (b.remaining / b.totalAllotted) * 100
                    : 0;


                return (

                  <div
                    key={i}
                    className="lm-type-card"
                    style={{
                      background: 'var(--card-bg)',
                      borderRadius: '12px',
                      padding: '16px',
                      border:
                        '1px solid var(--card-border)',
                      transition: 'transform 0.15s',
                      boxShadow: 'var(--card-shadow)'
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >

                      {/* Progress / Infinity Ring */}

                      <MiniRing
                        pct={pct}
                        color={c.color}
                        unlimited={isUnpaid}
                      />


                      <div
                        style={{
                          textAlign: 'right'
                        }}
                      >

                        {/* Leave type */}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            color: c.color,
                            marginBottom: '2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {c.icon}
                          {b.leaveType}
                        </div>


                        {/* Balance */}

                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: 'var(--text-primary)'
                          }}
                        >

                          {isUnpaid ? (

                            <>
                              {Number(b.used || 0)}

                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color:
                                    'var(--text-secondary)'
                                }}
                              >
                                {' '}
                                / ∞
                              </span>
                            </>

                          ) : (

                            <>
                              {b.remaining}

                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color:
                                    'var(--text-secondary)'
                                }}
                              >
                                {' '}
                                / {b.totalAllotted}d
                              </span>
                            </>

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                );
              })

            )}

          </div>


          {/* Apply Modal */}

          {showForm && (

            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '20px',
                backdropFilter: 'blur(4px)'
              }}
            >

              <div
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '22px',
                  padding: '28px',
                  width: '100%',
                  maxWidth: '500px',
                  boxShadow:
                    '0 24px 70px rgba(0,0,0,0.5)',
                  border:
                    '1px solid var(--card-border)'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}
                >

                  <h2
                    style={{
                      fontSize: '19px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles
                      size={19}
                      color="#6366f1"
                    />

                    Apply for Leave
                  </h2>

                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      background:
                        'var(--bg-primary)',
                      border:
                        '1px solid var(--card-border)',
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      color:
                        'var(--text-secondary)'
                    }}
                  >
                    ✕
                  </button>

                </div>


                <form onSubmit={handleApply}>

                  {/* Leave Type */}

                  <div
                    style={{
                      marginBottom: '18px'
                    }}
                  >

                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color:
                          'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '8px',
                        textTransform:
                          'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Leave Type
                    </label>


                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(3, 1fr)',
                        gap: '8px'
                      }}
                    >

                      {LEAVE_TYPES.map(t => {

                        const active =
                          form.leaveType ===
                          t.value;

                        return (

                          <button
                            type="button"
                            key={t.value}
                            onClick={() =>
                              setForm({
                                ...form,
                                leaveType:
                                  t.value
                              })
                            }
                            style={{
                              padding: '10px 6px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              border: active
                                ? '1.5px solid var(--primary)'
                                : '1px solid var(--card-border)',
                              background: active
                                ? 'rgba(99, 102, 241, 0.1)'
                                : 'var(--bg-primary)',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: active
                                ? 'var(--primary)'
                                : 'var(--text-secondary)',
                              display: 'flex',
                              flexDirection:
                                'column',
                              alignItems:
                                'center',
                              gap: '6px'
                            }}
                          >

                            <span
                              style={{
                                fontSize: '18px'
                              }}
                            >
                              {t.icon}
                            </span>

                            {t.label}

                          </button>

                        );
                      })}

                    </div>

                  </div>


                  {/* Dates */}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '12px',
                      marginBottom: '18px'
                    }}
                  >

                    <div>

                      <label
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            'var(--text-secondary)',
                          display: 'block',
                          marginBottom: '8px',
                          textTransform:
                            'uppercase',
                          letterSpacing:
                            '0.5px'
                        }}
                      >
                        From
                      </label>

                      <input
                        type="date"
                        className="lm-date-input"
                        value={form.startDate}
                        min={today}
                        onChange={e => {

                          const newStart =
                            e.target.value;

                          setForm(prev => ({
                            ...prev,
                            startDate:
                              newStart,
                            endDate:
                              prev.endDate &&
                                prev.endDate <
                                newStart
                                ? ''
                                : prev.endDate
                          }));

                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          border:
                            '1px solid var(--card-border)',
                          background:
                            'var(--bg-primary)',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing:
                            'border-box',
                          color:
                            'var(--text-primary)'
                        }}
                      />

                    </div>


                    <div>

                      <label
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            'var(--text-secondary)',
                          display: 'block',
                          marginBottom: '8px',
                          textTransform:
                            'uppercase',
                          letterSpacing:
                            '0.5px'
                        }}
                      >
                        To
                      </label>

                      <input
                        type="date"
                        className="lm-date-input"
                        value={form.endDate}
                        min={
                          form.startDate ||
                          today
                        }
                        onChange={e =>
                          setForm({
                            ...form,
                            endDate:
                              e.target.value
                          })
                        }
                        required
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          border:
                            '1px solid var(--card-border)',
                          background:
                            'var(--bg-primary)',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing:
                            'border-box',
                          color:
                            'var(--text-primary)'
                        }}
                      />

                    </div>

                  </div>


                  {/* Reason */}

                  <div
                    style={{
                      marginBottom: '22px'
                    }}
                  >

                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color:
                          'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '8px',
                        textTransform:
                          'uppercase',
                        letterSpacing:
                          '0.5px'
                      }}
                    >
                      Reason
                    </label>

                    <textarea
                      className="lm-reason-textarea"
                      value={form.reason}
                      onChange={e =>
                        setForm({
                          ...form,
                          reason:
                            e.target.value
                        })
                      }
                      placeholder="e.g. Family function out of town"
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        border:
                          '1px solid var(--card-border)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing:
                          'border-box',
                        fontFamily: 'inherit'
                      }}
                    />

                  </div>


                  {/* Info */}

                  <div
                    style={{
                      background:
                        'rgba(99, 102, 241, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '18px',
                      fontSize: '11px',
                      color:
                        'var(--primary)',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}
                  >
                    <Lightbulb size={16} />

                    Your request will be reviewed by
                    Admin or HR.
                  </div>


                  {/* Buttons */}

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px'
                    }}
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setShowForm(false)
                      }
                      style={{
                        flex: 1,
                        padding: '13px',
                        background:
                          'var(--bg-primary)',
                        color:
                          'var(--text-primary)',
                        border:
                          '1px solid var(--card-border)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: '13px',
                        background:
                          'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: submitting
                          ? 'not-allowed'
                          : 'pointer',
                        opacity: submitting
                          ? 0.7
                          : 1
                      }}
                    >
                      {submitting
                        ? 'Sending...'
                        : 'Submit Request'}
                    </button>

                  </div>

                </form>

              </div>

            </div>

          )}


          {/* Leave History */}

          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border:
                '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
              overflow: 'hidden'
            }}
          >

            <div
              style={{
                padding: '16px 20px',
                borderBottom:
                  '1px solid var(--card-border)',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center'
              }}
            >

              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color:
                    'var(--text-primary)'
                }}
              >
                Leave Requests
              </h3>

              <span
                style={{
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)'
                }}
              >
                {leaves.length} records
              </span>

            </div>


            <div className="table-responsive">

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1.4fr 1fr 1fr 0.6fr 1.4fr 1.3fr 1fr',
                  padding: '12px 20px',
                  background:
                    'var(--bg-primary)',
                  borderBottom:
                    '1px solid var(--card-border)'
                }}
              >

                {[
                  'Type',
                  'From',
                  'To',
                  'Days',
                  'Status',
                  'Reviewed by',
                  'Action'
                ].map(h => (

                  <div
                    key={h}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color:
                        'var(--text-secondary)',
                      textTransform:
                        'uppercase',
                      letterSpacing:
                        '0.5px'
                    }}
                  >
                    {h}
                  </div>

                ))}

              </div>


              {leaves.length === 0 ? (

                <div
                  style={{
                    padding: '60px',
                    textAlign: 'center'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'center',
                      marginBottom: '10px',
                      color: '#10b981'
                    }}
                  >
                    <Palmtree
                      size={42}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color:
                        'var(--text-primary)',
                      marginBottom: '4px'
                    }}
                  >
                    No requests yet
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color:
                        'var(--text-secondary)',
                      marginBottom: '16px'
                    }}
                  >
                    Apply for your first leave whenever
                    you need a break
                  </div>

                  <button
                    onClick={() =>
                      setShowForm(true)
                    }
                    style={{
                      padding: '10px 20px',
                      background:
                        'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles
                      size={16}
                      style={{
                        display: 'inline',
                        marginRight: '4px'
                      }}
                    />

                    Apply for Leave
                  </button>

                </div>

              ) : (

                <>

                  {leaves.map((l, i) => {

                    const typeMeta =
                      balanceStyle[l.leaveType] ||
                      balanceStyle.UNPAID;

                    const canCancel =
                      ['PENDING', 'APPROVED']
                        .includes(l.status);

                    return (

                      <div
                        key={l.id || i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '1.4fr 1fr 1fr 0.6fr 1.4fr 1.3fr 1fr',
                          padding: '16px 20px',
                          borderBottom:
                            '1px solid var(--card-border)',
                          alignItems: 'center',
                          transition:
                            'background 0.2s'
                        }}
                        onMouseEnter={e =>
                          e.currentTarget.style.background =
                          'rgba(255,255,255,0.02)'
                        }
                        onMouseLeave={e =>
                          e.currentTarget.style.background =
                          'transparent'
                        }
                      >

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color:
                              'var(--text-primary)'
                          }}
                        >

                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background:
                                typeMeta.bg,
                              color:
                                typeMeta.color,
                              display: 'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center'
                            }}
                          >
                            {typeMeta.icon}
                          </div>

                          {l.leaveType}

                        </div>


                        <div
                          style={{
                            fontSize: '13px',
                            color:
                              'var(--text-secondary)'
                          }}
                        >
                          {l.startDate}
                        </div>


                        <div
                          style={{
                            fontSize: '13px',
                            color:
                              'var(--text-secondary)'
                          }}
                        >
                          {l.endDate}
                        </div>


                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color:
                              'var(--text-primary)'
                          }}
                        >
                          {l.totalDays}
                        </div>


                        <div>
                          <StatusPill
                            status={l.status}
                          />
                        </div>


                        <div
                          style={{
                            fontSize: '12px',
                            color:
                              'var(--text-secondary)'
                          }}
                        >
                          {l.reviewedByName || '—'}
                        </div>


                        <div>

                          {canCancel && (

                            <button
                              onClick={() =>
                                handleCancel(l.id)
                              }
                              disabled={
                                cancelling ===
                                l.id
                              }
                              style={{
                                padding:
                                  '6px 12px',
                                background:
                                  'transparent',
                                color:
                                  l.status ===
                                    'APPROVED'
                                    ? '#8b5cf6'
                                    : '#ef4444',
                                border:
                                  `1px solid ${l.status ===
                                    'APPROVED'
                                    ? '#8b5cf6'
                                    : '#ef4444'
                                  }`,
                                borderRadius:
                                  '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor:
                                  'pointer'
                              }}
                            >

                              {cancelling ===
                                l.id ? (

                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                  style={{
                                    display:
                                      'inline'
                                  }}
                                />

                              ) : (

                                l.status ===
                                  'APPROVED'
                                  ? 'Request Cancel'
                                  : 'Cancel'

                              )}

                            </button>

                          )}

                        </div>

                      </div>

                    );
                  })}


                  {/* Pagination */}

                  {totalPages > 1 && (

                    <div
                      style={{
                        padding: '14px 20px',
                        display: 'flex',
                        justifyContent:
                          'center',
                        gap: '8px',
                        borderTop:
                          '1px solid var(--card-border)'
                      }}
                    >

                      <button
                        onClick={() =>
                          setPage(p =>
                            Math.max(0, p - 1)
                          )
                        }
                        disabled={page === 0}
                        style={{
                          padding: '6px 14px',
                          border:
                            '1px solid var(--card-border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            page === 0
                              ? 'var(--text-secondary)'
                              : 'var(--text-primary)',
                          background:
                            'var(--bg-primary)',
                          cursor:
                            page === 0
                              ? 'not-allowed'
                              : 'pointer'
                        }}
                      >
                        ← Prev
                      </button>


                      <span
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          color:
                            'var(--text-secondary)'
                        }}
                      >
                        Page {page + 1} of {totalPages}
                      </span>


                      <button
                        onClick={() =>
                          setPage(p =>
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
                          padding: '6px 14px',
                          border:
                            '1px solid var(--card-border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color:
                            page >=
                              totalPages - 1
                              ? 'var(--text-secondary)'
                              : 'var(--text-primary)',
                          background:
                            'var(--bg-primary)',
                          cursor:
                            page >=
                              totalPages - 1
                              ? 'not-allowed'
                              : 'pointer'
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

        </>

      )}

    </div>
  );
}