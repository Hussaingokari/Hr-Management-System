'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  BookOpen,
  User,
  Calendar,
  Clock,
  Users,
  MapPin,
  Link as LinkIcon,
  Inbox,
  Loader2,
  X,
  Plus,
  CheckCircle2,
} from 'lucide-react';

function Badge({ status }) {
  const map = {
    UPCOMING: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ONGOING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    ENROLLED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    ONLINE: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    OFFLINE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    HYBRID: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  const styleClass = map[status] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styleClass} inline-block`}>
      {status}
    </span>
  );
}

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

  const today = new Date().toISOString().split('T')[0];

  const getDynamicStatus = (t) => {
    if (t.status === 'CANCELLED') return 'CANCELLED';
    if (!t.startDate || !t.endDate) return t.status || 'UPCOMING';

    if (today < t.startDate) return 'UPCOMING';
    if (today >= t.startDate && today <= t.endDate) return 'ONGOING';
    if (today > t.endDate) return 'COMPLETED';

    return t.status || 'UPCOMING';
  };

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/trainings');
      setTrainings(res.data?.data?.content || []);
    } catch {
      toast.error('Failed to load trainings');
    } finally {
      setLoading(false);
    }
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
    } catch {
      setEnrollments([]);
    } finally {
      setLoadingEnroll(false);
    }
  };

  const handleSelectTraining = (t) => {
    if (selected?.id === t.id) {
      setSelected(null);
    } else {
      setSelected(t);
      fetchEnrollments(t.id);
    }
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTraining = async (trainingId) => {
    if (!confirm('Are you sure you want to cancel this training program?')) return;
    try {
      await api.put(`/api/trainings/${trainingId}/status`, { status: 'CANCELLED' });
      toast.success('Training cancelled successfully');
      setSelected(null);
      fetchTrainings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel training');
    }
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
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Training Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create training programs and manage employee enrollments.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <Plus size={16} />
          <span>Create Training</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Training List */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${selected ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Training Programs ({trainings.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              Loading programs...
            </div>
          ) : trainings.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen size={20} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">No trainings created yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">Get started by creating your first training program.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <Plus size={14} /> Create First Training
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {trainings.map((t) => {
                const currentStatus = getDynamicStatus(t);
                const isSelected = selected?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTraining(t)}
                    className={`p-4 cursor-pointer transition-all border-l-4 ${isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{t.title}</h4>
                      <Badge status={currentStatus} />
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-3">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{t.trainer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge status={t.mode} />
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                        <span>{t.startDate} → {t.endDate}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <Clock size={13} className="text-slate-400 dark:text-slate-500" />
                        <span>{t.durationHours}h</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Users size={13} className="text-slate-400 dark:text-slate-500" />
                        <span>Max: {t.maxParticipants}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <MapPin size={13} className="text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{t.venue || 'No venue'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Program & Enrollments Panel */}
        {selected && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-all">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Training Details</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {enrollments.length} Enrolled • <span className="font-medium text-slate-700 dark:text-slate-300">{selected.category}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCancelTraining(selected.id)}
                  className="px-2.5 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-md text-xs font-semibold transition"
                >
                  Cancel Program
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Description */}
            {selected.description && (
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selected.description}
              </div>
            )}

            {/* Link */}
            {selected.meetingLink && (
              <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <LinkIcon size={14} className="shrink-0" />
                <a href={selected.meetingLink} target="_blank" rel="noreferrer" className="underline hover:opacity-80 truncate">
                  {selected.meetingLink}
                </a>
              </div>
            )}

            {/* Enrollments List */}
            <div className="p-5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Enrolled Employees</h4>

              {loadingEnroll ? (
                <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={16} /> Loading enrollments...
                </div>
              ) : enrollments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <Inbox size={24} className="mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                  No enrollments registered for this training yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                            {enr.employeeName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{enr.employeeName}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge status={enr.status} />
                      </div>

                      {enr.score && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Score: {enr.score}/100</span>
                          {enr.feedback && <span className="text-slate-400 dark:text-slate-500">| &ldquo;{enr.feedback}&rdquo;</span>}
                        </div>
                      )}

                      {enr.status === 'ENROLLED' && (
                        <div>
                          {completingId === enr.id ? (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Score (0-100)"
                                  value={score}
                                  onChange={(e) => setScore(e.target.value)}
                                  className="w-1/3 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback notes..."
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  className="w-2/3 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setCompletingId(null)}
                                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleComplete(enr.id)}
                                  disabled={completing === enr.id}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition flex items-center gap-1 font-medium"
                                >
                                  {completing === enr.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                  <span>Submit</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCompletingId(enr.id); setScore(''); setFeedback(''); }}
                              className="mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              Mark as Completed →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Program</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced React Patterns"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trainer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Trainer Name"
                    value={form.trainer}
                    onChange={(e) => setForm((prev) => ({ ...prev, trainer: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  >
                    {['TECHNICAL', 'SOFT_SKILLS', 'COMPLIANCE', 'LEADERSHIP', 'SAFETY'].map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  >
                    {['ONLINE', 'OFFLINE', 'HYBRID'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (hrs)</label>
                  <input
                    type="number"
                    placeholder="24"
                    value={form.durationHours}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationHours: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={form.maxParticipants}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxParticipants: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                        endDate: prev.endDate && prev.endDate < e.target.value ? '' : prev.endDate,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={form.startDate || today}
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    placeholder="Conference Room A"
                    value={form.venue}
                    onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Link</label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/..."
                    value={form.meetingLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide program overview and objectives..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-1/2 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}