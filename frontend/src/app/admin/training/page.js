'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    UPCOMING: { bg: '#eff6ff', color: '#3b82f6' },
    ONGOING: { bg: '#fff7ed', color: '#f59e0b' },
    COMPLETED: { bg: '#dcfce7', color: '#16a34a' },
    CANCELLED: { bg: '#fee2e2', color: '#dc2626' },
    ENROLLED: { bg: '#fdf4ff', color: '#9333ea' },
    ONLINE: { bg: '#eff6ff', color: '#3b82f6' },
    OFFLINE: { bg: '#f0fdf4', color: '#16a34a' },
    HYBRID: { bg: '#fff7ed', color: '#f59e0b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>
      {status}
    </span>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: '12px', fontWeight: '600',
  color: '#374151', display: 'block',
  marginBottom: '5px',
};

const EMPTY_FORM = {
  title: '', description: '', category: 'TECHNICAL',
  trainer: '', mode: 'ONLINE', startDate: '',
  endDate: '', durationHours: '', maxParticipants: '',
  venue: '', meetingLink: '',
};

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [completingId, setCompletingId] = useState(null);
  const today = new Date().toISOString().split("T")[0];


  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/trainings');
      setTrainings(res.data?.data?.content || []);
    } catch { toast.error('Failed to load trainings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchTrainings(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchTrainings]);

  const fetchEnrollments = async (trainingId) => {
    setLoadingEnroll(true);
    try {
      const res = await api.get(`/api/trainings/${trainingId}/enrollments`);
      setEnrollments(res.data?.data || []);
    } catch { setEnrollments([]); }
    finally { setLoadingEnroll(false); }
  };

  const handleSelectTraining = (t) => {
    setSelected(selected?.id === t.id ? null : t);
    if (selected?.id !== t.id) fetchEnrollments(t.id);
    setCompletingId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/trainings', {
        ...form,
        durationHours: parseInt(form.durationHours) || 0,
        maxParticipants: parseInt(form.maxParticipants) || 10,
      });
      toast.success('Training created successfully!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchTrainings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create training');
    } finally { setSubmitting(false); }
  };

  const handleComplete = async (enrollmentId) => {
    setCompleting(enrollmentId);
    try {
      await api.put(`/api/trainings/enrollments/${enrollmentId}/complete`, {
        score: parseInt(score) || 0,
        feedback: feedback,
        certificateUrl: `/api/files/certificate-${enrollmentId}.pdf`,
      });
      toast.success('Marked as completed!');
      setCompletingId(null);
      setScore('');
      setFeedback('');
      if (selected) fetchEnrollments(selected.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    } finally { setCompleting(null); }
  };

  const handleFocus = (e) => e.target.style.borderColor = '#3b82f6';
  const handleBlur = (e) => e.target.style.borderColor = '#e2e8f0';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Training Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Create training programs and manage enrollments
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          + Create Training
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.3fr' : '1fr', gap: '20px' }}>

        {/* Training List */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Training Programs ({trainings.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : trainings.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No trainings yet</div>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '8px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                + Create First Training
              </button>
            </div>
          ) : (
            trainings.map(t => (
              <div key={t.id} onClick={() => handleSelectTraining(t)}
                style={{
                  padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  background: selected?.id === t.id ? '#eff6ff' : 'white',
                  borderLeft: selected?.id === t.id ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</div>
                  <Badge status={t.status} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  👨‍🏫 {t.trainer} · <Badge status={t.mode} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  📅 {t.startDate} → {t.endDate} · ⏱ {t.durationHours}h
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  👥 Max: {t.maxParticipants} · 📍 {t.venue || 'No venue'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enrollments Panel */}
        {selected && (
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {selected.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {enrollments.length} enrolled · {selected.category}
              </p>
            </div>

            {selected.description && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selected.description}
              </div>
            )}

            {selected.meetingLink && (
              <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                  🔗 {selected.meetingLink}
                </span>
              </div>
            )}

            <div style={{ padding: '14px 20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Enrollments
              </div>

              {loadingEnroll ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Loading...</div>
              ) : enrollments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                  No enrollments yet
                </div>
              ) : (
                enrollments.map(enr => (
                  <div key={enr.id} style={{ background: 'var(--bg-primary)', borderRadius: '10px', padding: '12px', marginBottom: '8px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>
                          {enr.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{enr.employeeName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Enrolled: {new Date(enr.enrolledAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <Badge status={enr.status} />
                    </div>

                    {enr.score && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Score: <strong style={{ color: '#16a34a' }}>{enr.score}/100</strong>
                        {enr.feedback && ` · "${enr.feedback}"`}
                      </div>
                    )}

                    {enr.status === 'ENROLLED' && (
                      completingId === enr.id ? (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="number"
                            placeholder="Score (0-100)"
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            style={{ flex: 1, minWidth: '120px', padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none' }}
                          />
                          <input
                            placeholder="Feedback..."
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            style={{ flex: 2, minWidth: '140px', padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none' }}
                          />
                          <button onClick={() => handleComplete(enr.id)} disabled={completing === enr.id}
                            style={{ padding: '7px 14px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            {completing === enr.id ? '⏳' : '✓ Complete'}
                          </button>
                          <button onClick={() => setCompletingId(null)}
                            style={{ padding: '7px 12px', background: 'var(--card-border)', color: 'var(--text-secondary)', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setCompletingId(enr.id); setScore(''); setFeedback(''); }}
                          style={{ marginTop: '8px', padding: '5px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          Mark Complete →
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Training Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Create Training Program</h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

                {/* Title - full width */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>
                    Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. React Advanced"
                    required
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Trainer */}
                <div>
                  <label style={labelStyle}>
                    Trainer <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.trainer}
                    onChange={e => setForm(prev => ({ ...prev, trainer: e.target.value }))}
                    placeholder="Trainer name"
                    required
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ ...inputStyle, background: 'var(--card-bg)' }}>
                    {['TECHNICAL', 'SOFT_SKILLS', 'COMPLIANCE', 'LEADERSHIP', 'SAFETY'].map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Mode */}
                <div>
                  <label style={labelStyle}>Mode</label>
                  <select value={form.mode}
                    onChange={e => setForm(prev => ({ ...prev, mode: e.target.value }))}
                    style={{ ...inputStyle, background: 'var(--card-bg)' }}>
                    {['ONLINE', 'OFFLINE', 'HYBRID'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label style={labelStyle}>
                    Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        startDate: e.target.value,
                        endDate:
                          prev.endDate && prev.endDate < e.target.value
                            ? ""
                            : prev.endDate,
                      }))
                    }
                    min={today}
                    required
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label style={labelStyle}>
                    End Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    min={form.startDate || today}
                    required
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label style={labelStyle}>Duration (hours)</label>
                  <input
                    type="number"
                    value={form.durationHours}
                    onChange={e => setForm(prev => ({ ...prev, durationHours: e.target.value }))}
                    placeholder="24"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Max Participants */}
                <div>
                  <label style={labelStyle}>Max Participants</label>
                  <input
                    type="number"
                    value={form.maxParticipants}
                    onChange={e => setForm(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="10"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Venue */}
                <div>
                  <label style={labelStyle}>Venue</label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={e => setForm(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="Conference Room A"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Meeting Link */}
                <div>
                  <label style={labelStyle}>Meeting Link</label>
                  <input
                    type="text"
                    value={form.meetingLink}
                    onChange={e => setForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Training description..."
                  required
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? '⏳ Creating...' : 'Create Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}