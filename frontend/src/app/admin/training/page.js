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

// Local YYYY-MM-DD "today" — used as the floor for the Start Date field so
// the calendar itself blocks any date before today from being picked.
const todayStr = new Date().toLocaleDateString('en-CA');

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

  // Get local YYYY-MM-DD date
  const today = new Date().toLocaleDateString('en-CA');

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
    fetchTrainings();
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
    const duration = parseInt(form.durationHours, 10) || 0;
    const maxP = parseInt(form.maxParticipants, 10) || 0;
    if (duration < 0 || maxP < 0) {
      toast.error('Duration and Max Participants cannot be negative');
      return;
    }
    if (form.mode !== 'ONLINE' && !form.venue.trim()) {
      toast.error('Venue is required for offline/hybrid trainings');
      return;
    }
    if (form.mode !== 'OFFLINE' && !form.meetingLink.trim()) {
      toast.error('Meeting link is required for online/hybrid trainings');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/trainings', {
        ...form,
        durationHours: duration,
        maxParticipants: maxP,
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
        score: parseInt(score, 10) || 0,
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
            {/* Panel Header */}
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
                  No employees enrolled yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e) => (
                    <div key={e.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{e.employeeName}</p>
                          <p className="text-[11px] text-slate-400">Enrolled: {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <Badge status={e.completed ? 'COMPLETED' : e.status} />
                      </div>

                      {e.completed ? (
                        <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-md space-y-1 mt-1">
                          <div className="flex justify-between font-semibold">
                            <span>Score: {e.score}/100</span>
                            <span className="text-[10px] opacity-80">{e.completedAt ? new Date(e.completedAt).toLocaleDateString() : ''}</span>
                          </div>
                          {e.feedback && <p className="text-[11px] opacity-90">Feedback: {e.feedback}</p>}
                        </div>
                      ) : (
                        <div>
                          {completingId === e.id ? (
                            <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Score (0-100)"
                                  value={score}
                                  onChange={(evt) => setScore(evt.target.value)}
                                  className="w-1/3 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800"
                                />
                                <input
                                  type="text"
                                  placeholder="Feedback"
                                  value={feedback}
                                  onChange={(evt) => setFeedback(evt.target.value)}
                                  className="w-2/3 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setCompletingId(null)}
                                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  disabled={completing === e.id}
                                  onClick={() => handleComplete(e.id)}
                                  className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded flex items-center gap-1"
                                >
                                  {completing === e.id && <Loader2 size={12} className="animate-spin" />} Save & Complete
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCompletingId(e.id)}
                              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <CheckCircle2 size={14} /> Mark as Complete
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

      {/* Modal - Create Training */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Training Program</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Advanced Java Microservices"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Course details and outline..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="SOFT_SKILLS">SOFT_SKILLS</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mode *</label>
                  <select
                    required
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Trainer *</label>
                  <input
                    type="text"
                    required
                    value={form.trainer}
                    onChange={(e) => setForm({ ...form, trainer: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Instructor Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.durationHours}
                    onChange={(e) => {
                      const v = e.target.value;
                      // Block negative values outright; allow empty string
                      // while the user is still typing.
                      if (v !== '' && Number(v) < 0) return;
                      setForm({ ...form, durationHours: v });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={form.startDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm({ ...form, startDate: v && v < todayStr ? todayStr : v });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Participants *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.maxParticipants}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== '' && Number(v) < 0) return;
                      setForm({ ...form, maxParticipants: v });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Venue (if offline) {form.mode !== 'ONLINE' && '*'}
                  </label>
                  <input
                    type="text"
                    required={form.mode !== 'ONLINE'}
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Conference Room A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Link (if online) {form.mode !== 'OFFLINE' && '*'}
                </label>
                <input
                  type="url"
                  required={form.mode !== 'OFFLINE'}
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />} Create Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}