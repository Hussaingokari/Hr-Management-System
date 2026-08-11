'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  MessageSquare,
  FileText,
  Loader2,
  Check,
  CheckCircle,
  MessageCircle,
} from 'lucide-react';

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className={`text-lg ${s <= Math.round(value)
                ? 'text-amber-400'
                : 'text-slate-200 dark:text-slate-700'
              }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
        {value}/5
      </span>
    </div>
  );
}

function Badge({ status }) {
  const styles = {
    DRAFT:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    SUBMITTED:
      'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
    ACKNOWLEDGED:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
    IN_PROGRESS:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
  };
  const style = styles[status] || styles.DRAFT;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${style}`}>
      {status}
    </span>
  );
}

function getCardBorderClass(status) {
  if (status === 'ACKNOWLEDGED')
    return 'border-emerald-200 dark:border-emerald-900/50';
  if (status === 'SUBMITTED')
    return 'border-blue-200 dark:border-blue-900/50';
  return 'border-slate-200 dark:border-slate-800';
}

function getHeaderBgClass(status) {
  if (status === 'ACKNOWLEDGED')
    return 'bg-emerald-50/40 dark:bg-emerald-950/20';
  if (status === 'SUBMITTED')
    return 'bg-blue-50/40 dark:bg-blue-950/20';
  return 'bg-slate-50/80 dark:bg-slate-800/40';
}

export default function EmployeePerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/api/performance/my');
      setReviews(res.data?.data?.content || []);
    } catch {
      toast.error('Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
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

  const pendingCount = reviews.filter((r) => r.status !== 'ACKNOWLEDGED').length;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          Loading performance reviews...
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-3">
          <div className="text-5xl">⭐</div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
            No performance reviews yet
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your manager will create a review for you
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {reviews.map((r) => (
          <div
            key={r.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-xs overflow-hidden ${getCardBorderClass(
              r.status
            )}`}
          >
            {/* Review Header */}
            <div
              className={`p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${getHeaderBgClass(
                r.status
              )}`}
            >
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {r.reviewPeriod}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reviewed by:{' '}
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                    {r.reviewerName}
                  </strong>{' '}
                  · {r.reviewDate}
                </p>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="text-left sm:text-right">
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Overall Rating
                  </span>
                  <StarRating value={r.overallRating} />
                </div>
                <Badge status={r.status} />
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Ratings Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: 'Technical', value: r.technicalSkills, color: '#3b82f6' },
                  { label: 'Communication', value: r.communication, color: '#8b5cf6' },
                  { label: 'Teamwork', value: r.teamwork, color: '#16a34a' },
                  { label: 'Productivity', value: r.productivity, color: '#f59e0b' },
                  { label: 'Leadership', value: r.leadership, color: '#ec4899' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 text-center"
                  >
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {s.label}
                    </div>
                    <div
                      className="text-2xl font-black mb-1"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(s.value / 5) * 100}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {r.strengths && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200/80 dark:border-emerald-900/50">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                      💪 Strengths
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {r.strengths}
                    </p>
                  </div>
                )}

                {r.improvements && (
                  <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200/80 dark:border-amber-900/50">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                      <TrendingUp size={15} /> Improvements
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {r.improvements}
                    </p>
                  </div>
                )}

                {r.goals && (
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200/80 dark:border-blue-900/50">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                      🎯 Goals
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {r.goals}
                    </p>
                  </div>
                )}
              </div>

              {/* Employee Comments (if acknowledged) */}
              {r.employeeComments && (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/50">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={15} /> Your Comments
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {r.employeeComments}
                  </p>
                </div>
              )}

              {/* Acknowledge Action Section */}
              {r.status === 'SUBMITTED' && (
                <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900/50 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400" />{' '}
                      Acknowledge This Review
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Add your comments and acknowledge to complete the review process
                    </p>
                  </div>

                  {selected === r.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add your comments about this review... (e.g. Thank you for the feedback, I will work on improving my communication skills)"
                        rows={4}
                        className="w-full p-3 rounded-xl border border-blue-200 dark:border-blue-900/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm transition"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleAcknowledge(r.id)}
                          disabled={acknowledging}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-white transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {acknowledging ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Acknowledging...
                            </>
                          ) : (
                            <>
                              <Check size={16} /> Acknowledge Review
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelected(null);
                            setComment('');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelected(r.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-white transition flex items-center gap-2"
                    >
                      <MessageCircle size={15} /> Add Comments & Acknowledge
                    </button>
                  )}
                </div>
              )}

              {/* Already acknowledged state */}
              {r.status === 'ACKNOWLEDGED' && (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-3 sm:p-4 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle size={18} className="shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">
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
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          My Performance Reviews
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          View your performance reviews and acknowledge them
        </p>
      </div>

      {renderContent()}
    </div>
  );
}