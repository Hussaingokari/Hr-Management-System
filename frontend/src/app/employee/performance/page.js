'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function StarRating({ value }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: '18px', color: s <= Math.round(value) ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: '600' }}>
        {value}/5
      </span>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    DRAFT: { bg: '#f1f5f9', color: 'var(--text-secondary)' },
    SUBMITTED: { bg: '#eff6ff', color: '#3b82f6' },
    ACKNOWLEDGED: { bg: '#dcfce7', color: '#16a34a' },
    IN_PROGRESS: { bg: '#fff7ed', color: '#f59e0b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {status}
    </span>
  );
}

function getStatusBorderColor(status) {
  if (status === 'ACKNOWLEDGED') return '#bbf7d0';
  if (status === 'SUBMITTED') return '#bfdbfe';
  return '#e2e8f0';
}

function getStatusHeaderBg(status) {
  if (status === 'ACKNOWLEDGED') return '#f0fdf4';
  if (status === 'SUBMITTED') return '#eff6ff';
  return '#f8fafc';
}

export default function EmployeePerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      try {
        const res = await api.get('/api/performance/my');
        if (active) {
          setReviews(res.data?.data?.content || []);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error('Failed to load performance reviews');
          setLoading(false);
        }
      }
    };
    fetchReviews();
    return () => { active = false; };
  }, []);

  const handleAcknowledge = async (reviewId) => {
    if (!comment.trim()) {
      toast.error('Please add your comments before acknowledging');
      return;
    }
    setAcknowledging(true);
    try {
      await api.put(`/api/performance/${reviewId}/acknowledge`, {
        employeeComments: comment,
      });
      toast.success('Review acknowledged successfully!');
      setComment('');
      setSelected(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge');
    } finally {
      setAcknowledging(false);
    }
  };

  const pendingCount = reviews.filter(r => r.status !== 'ACKNOWLEDGED').length;

  const renderContent = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>;
    }
    if (reviews.length === 0) {
      return (
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '80px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No performance reviews yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Your manager will create a review for you
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map((r) => (
          <div key={r.id} style={{
            background: 'var(--card-bg)', borderRadius: '14px',
            border: `2px solid ${getStatusBorderColor(r.status)}`,
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            {/* Review Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: getStatusHeaderBg(r.status),
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {r.reviewPeriod}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Reviewed by: <strong style={{ color: '#374151' }}>{r.reviewerName}</strong> · {r.reviewDate}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Overall Rating</div>
                  <StarRating value={r.overallRating} />
                </div>
                <Badge status={r.status} />
              </div>
            </div>

            {/* Ratings Grid */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Technical', value: r.technicalSkills, color: '#3b82f6' },
                  { label: 'Communication', value: r.communication, color: '#8b5cf6' },
                  { label: 'Teamwork', value: r.teamwork, color: '#16a34a' },
                  { label: 'Productivity', value: r.productivity, color: '#f59e0b' },
                  { label: 'Leadership', value: r.leadership, color: '#ec4899' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-primary)', borderRadius: '10px', padding: '12px', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: s.color, marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ height: '4px', background: 'var(--card-border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.value / 5) * 100}%`, background: s.color, borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: '💪 Strengths', value: r.strengths, color: '#16a34a', bg: '#f0fdf4' },
                  { label: '📈 Improvements', value: r.improvements, color: '#f59e0b', bg: '#fff7ed' },
                  { label: '🎯 Goals', value: r.goals, color: '#3b82f6', bg: '#eff6ff' },
                ].map(d => d.value && (
                  <div key={d.label} style={{ background: d.bg, borderRadius: '10px', padding: '14px', border: `1px solid ${d.color}30` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: d.color, marginBottom: '8px' }}>{d.label}</div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {/* Employee Comments (if acknowledged) */}
              {r.employeeComments && (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', marginBottom: '6px' }}>
                    💬 Your Comments
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                    {r.employeeComments}
                  </div>
                </div>
              )}

              {/* Acknowledge Section */}
              {r.status === 'SUBMITTED' && (
                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a5f', marginBottom: '4px' }}>
                    📝 Acknowledge This Review
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Add your comments and acknowledge to complete the review process
                  </div>

                  {selected === r.id ? (
                    <>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add your comments about this review... (e.g. Thank you for the feedback, I will work on improving my communication skills)"
                        rows={4}
                        style={{
                          width: '100%', padding: '12px',
                          border: '1.5px solid #bfdbfe', borderRadius: '10px',
                          fontSize: '13px', outline: 'none', resize: 'vertical',
                          boxSizing: 'border-box', fontFamily: 'inherit',
                          marginBottom: '12px', background: 'var(--card-bg)',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          disabled={acknowledging}
                          style={{
                            flex: 1, padding: '12px', background: '#1e3a5f',
                            color: 'white', border: 'none', borderRadius: '10px',
                            fontSize: '14px', fontWeight: '700',
                            cursor: acknowledging ? 'not-allowed' : 'pointer',
                            opacity: acknowledging ? 0.7 : 1,
                          }}
                        >
                          {acknowledging ? '⏳ Acknowledging...' : '✓ Acknowledge Review'}
                        </button>
                        <button
                          onClick={() => { setSelected(null); setComment(''); }}
                          style={{ padding: '12px 20px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelected(r.id)}
                      style={{
                        padding: '10px 24px', background: '#1e3a5f',
                        color: 'white', border: 'none', borderRadius: '10px',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      ✍️ Add Comments & Acknowledge
                    </button>
                  )}
                </div>
              )}

              {/* Already acknowledged message */}
              {r.status === 'ACKNOWLEDGED' && (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                    You have acknowledged this review
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          My Performance Reviews
          {pendingCount > 0 && (
            <span style={{ background: '#f59e0b', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>
              {pendingCount} pending
            </span>
          )}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          View your performance reviews and acknowledge them
        </p>
      </div>

      {renderContent()}
    </div>
  );
}