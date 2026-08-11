'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Star, Award, TrendingUp, Target, MessageSquare, Loader2 } from 'lucide-react';

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${s <= Math.round(value) ? 'text-amber-500' : 'text-slate-200 dark:text-slate-700'
            }`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{value}/5</span>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    ACKNOWLEDGED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  };
  const colorClass = map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${colorClass}`}>
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
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
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
    const timer = setTimeout(() => {
      fetchAll();
    }, 0);
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

  const handleRatingChange = (name, val) => setForm((prev) => ({ ...prev, [name]: val }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Reviews</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage employee performance reviews</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          + Create Review
        </button>
      </div>

      {/* Reviews Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Table Header */}
            <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div>Employee</div>
              <div>Review Period</div>
              <div>Overall Rating</div>
              <div>Status</div>
              <div>Review Date</div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-20 text-center">
                <div className="flex justify-center mb-4 text-amber-500">
                  <Star size={48} strokeWidth={1.5} />
                </div>
                <div className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">No reviews yet</div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  + Create First Review
                </button>
              </div>
            ) : (
              reviews.map((r) => {
                const isSelected = selected?.id === r.id;
                return (
                  <div key={r.id}>
                    <div
                      onClick={() => setSelected(isSelected ? null : r)}
                      className={`grid grid-cols-5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 items-center cursor-pointer transition ${isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      {/* Employee Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {r.employeeName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.employeeName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{r.employeeCode}</div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 dark:text-slate-300">{r.reviewPeriod}</div>
                      <StarRating value={r.overallRating} />
                      <div><Badge status={r.status} /></div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{r.reviewDate}</div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isSelected && (
                      <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-4">
                        {/* Rating Breakdown Grid */}
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { label: 'Technical', value: r.technicalSkills },
                            { label: 'Communication', value: r.communication },
                            { label: 'Teamwork', value: r.teamwork },
                            { label: 'Productivity', value: r.productivity },
                            { label: 'Leadership', value: r.leadership },
                          ].map((s) => (
                            <div
                              key={s.label}
                              className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 text-center shadow-xs"
                            >
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
                              <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{s.value}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">/ 5</div>
                            </div>
                          ))}
                        </div>

                        {/* Qualitative Feedback Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { label: <><Award size={14} className="inline mr-1 text-emerald-500" /> Strengths</>, value: r.strengths },
                            { label: <><TrendingUp size={14} className="inline mr-1 text-amber-500" /> Improvements</>, value: r.improvements },
                            { label: <><Target size={14} className="inline mr-1 text-blue-500" /> Goals</>, value: r.goals },
                          ].map(
                            (d, index) =>
                              d.value && (
                                <div
                                  key={index}
                                  className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-xs"
                                >
                                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{d.label}</div>
                                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{d.value}</div>
                                </div>
                              )
                          )}
                        </div>

                        {/* Employee Comments */}
                        {r.employeeComments && (
                          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3">
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                              <MessageSquare size={12} /> Employee Comments
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300">{r.employeeComments}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && reviews.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page {page + 1} of {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Performance Review</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Employee + Period Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} — {e.employeeCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Review Period
                  </label>
                  <input
                    value={form.reviewPeriod}
                    onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })}
                    placeholder="e.g. Q2 2026"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Rating Inputs */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Ratings (1–5)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RatingInput label="Technical Skills" name="technicalSkills" value={form.technicalSkills} onChange={handleRatingChange} />
                  <RatingInput label="Communication" name="communication" value={form.communication} onChange={handleRatingChange} />
                  <RatingInput label="Teamwork" name="teamwork" value={form.teamwork} onChange={handleRatingChange} />
                  <RatingInput label="Productivity" name="productivity" value={form.productivity} onChange={handleRatingChange} />
                  <RatingInput label="Leadership" name="leadership" value={form.leadership} onChange={handleRatingChange} />
                </div>
              </div>

              {/* Feedback Inputs */}
              {[
                { label: 'Strengths', name: 'strengths', placeholder: 'Key strengths of the employee...' },
                { label: 'Areas for Improvement', name: 'improvements', placeholder: 'Areas to improve...' },
                { label: 'Goals', name: 'goals', placeholder: 'Goals for next period...' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                  <textarea
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              ))}

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Review'
                  )}
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
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} ({value}/5)
      </label>
      <input
        type="range"
        min="1"
        max="5"
        value={value || 3}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>Poor</span>
        <span>Average</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}