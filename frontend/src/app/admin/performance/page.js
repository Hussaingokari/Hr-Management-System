'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function StarRating({ value }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: '14px', color: s <= Math.round(value) ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>{value}/5</span>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    DRAFT:        { bg: '#f1f5f9', color: '#64748b' },
    SUBMITTED:    { bg: '#eff6ff', color: '#3b82f6' },
    ACKNOWLEDGED: { bg: '#dcfce7', color: '#16a34a' },
    IN_PROGRESS:  { bg: '#fff7ed', color: '#f59e0b' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  employeeId: '',
  reviewPeriod: 'Q2 2026',
  reviewDate: new Date().toISOString().split('T')[0],
  technicalSkills: 3,
  communication: 3,
  teamwork: 3,
  productivity: 3,
  leadership: 3,
  strengths: '',
  improvements: '',
  goals: '',
};

export default function PerformancePage() {
  const [reviews, setReviews]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, empRes] = await Promise.allSettled([
        api.get(`/api/performance?page=${page}`),
        getAllEmployees(0, 100),
      ]);
      if (revRes.status === 'fulfilled') {
        setReviews(revRes.value.data?.data?.content || []);
        setTotalPages(revRes.value.data?.data?.totalPages || 1);
      }
      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data?.data?.content || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAll(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/performance', {
        ...form,
        employeeId: parseInt(form.employeeId),
        technicalSkills: parseInt(form.technicalSkills),
        communication: parseInt(form.communication),
        teamwork: parseInt(form.teamwork),
        productivity: parseInt(form.productivity),
        leadership: parseInt(form.leadership),
      });
      toast.success('Performance review created!');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingChange = (name, val) => setForm(prev => ({ ...prev, [name]: val }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>Performance Reviews</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Create and manage employee performance reviews</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          + Create Review
        </button>
      </div>

      {/* Reviews Table */}
      <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="admin-data-table" style={{ minWidth: '760px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['Employee', 'Review Period', 'Overall Rating', 'Status', 'Review Date'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No reviews yet</div>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              + Create First Review
            </button>
          </div>
        ) : (
          reviews.map((r, i) => (
            <div key={r.id}
              onClick={() => setSelected(selected?.id === r.id ? null : r)}
              style={{ cursor: 'pointer' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                padding: '14px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center',
                background: selected?.id === r.id ? '#eff6ff' : 'white',
              }}
                onMouseEnter={e => { if (selected?.id !== r.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (selected?.id !== r.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                    {r.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{r.employeeName}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.employeeCode}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{r.reviewPeriod}</div>
                <StarRating value={r.overallRating}/>
                <Badge status={r.status}/>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{r.reviewDate}</div>
              </div>

              {/* Expanded Detail */}
              {selected?.id === r.id && (
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: 'Technical', value: r.technicalSkills },
                      { label: 'Communication', value: r.communication },
                      { label: 'Teamwork', value: r.teamwork },
                      { label: 'Productivity', value: r.productivity },
                      { label: 'Leadership', value: r.leadership },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f' }}>{s.value}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>/ 5</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {[
                      { label: '💪 Strengths', value: r.strengths },
                      { label: '📈 Improvements', value: r.improvements },
                      { label: '🎯 Goals', value: r.goals },
                    ].map(d => d.value && (
                      <div key={d.label} style={{ background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>{d.label}</div>
                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{d.value}</div>
                      </div>
                    ))}
                  </div>

                  {r.employeeComments && (
                    <div style={{ marginTop: '12px', background: '#eff6ff', borderRadius: '8px', padding: '12px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>💬 Employee Comments</div>
                      <div style={{ fontSize: '13px', color: '#374151' }}>{r.employeeComments}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        </div>
        {/* Pagination controls */}
        {!loading && reviews.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Page {page + 1} of {totalPages || 1}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === 0 ? '#f8fafc' : 'white', color: page === 0 ? '#94a3b8' : '#374151', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: page >= totalPages - 1 ? '#f8fafc' : 'white', color: page >= totalPages - 1 ? '#94a3b8' : '#374151', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Create Performance Review</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Employee + Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                    Employee <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white' }}>
                    <option value="">Select employee...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.employeeCode}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>Review Period</label>
                  <input value={form.reviewPeriod} onChange={e => setForm({ ...form, reviewPeriod: e.target.value })}
                    placeholder="e.g. Q2 2026"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Ratings */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>Ratings (1–5)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <RatingInput label="Technical Skills"   name="technicalSkills" value={form.technicalSkills} onChange={handleRatingChange}/>
                  <RatingInput label="Communication"      name="communication" value={form.communication} onChange={handleRatingChange}/>
                  <RatingInput label="Teamwork"           name="teamwork" value={form.teamwork} onChange={handleRatingChange}/>
                  <RatingInput label="Productivity"       name="productivity" value={form.productivity} onChange={handleRatingChange}/>
                  <RatingInput label="Leadership"         name="leadership" value={form.leadership} onChange={handleRatingChange}/>
                </div>
              </div>

              {/* Text fields */}
              {[
                { label: 'Strengths', name: 'strengths', placeholder: 'Key strengths of the employee...' },
                { label: 'Areas for Improvement', name: 'improvements', placeholder: 'Areas to improve...' },
                { label: 'Goals', name: 'goals', placeholder: 'Goals for next period...' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>{f.label}</label>
                  <textarea value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.placeholder} rows={2}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'white', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? '⏳ Creating...' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingInput({ label, name, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
        {label} ({value}/5)
      </label>
      <input
        type="range" min="1" max="5" value={value || 3}
        onChange={e => onChange(name, e.target.value)}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
        <span>Poor</span><span>Average</span><span>Excellent</span>
      </div>
    </div>
  );
}