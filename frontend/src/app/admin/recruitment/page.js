'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    CLOSED: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    SHORTLISTED: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
    INTERVIEW_SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    INTERVIEWED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400',
    OFFER_SENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    OFFER_ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    OFFER_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
  };
  const style = map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${style}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const EMPTY_JOB = {
  title: '', department: '', location: '',
  employmentType: 'FULL_TIME', description: '',
  requirements: '', experienceRequired: '',
  salaryRange: '', applicationDeadline: '',
};

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [submitting, setSubmitting] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(null);
  const [closingJobId, setClosingJobId] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recruitment/jobs/all');
      setJobs(res.data?.data?.content || res.data?.data || []);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const fetchApplications = async (jobId) => {
    setLoadingApps(true);
    try {
      const res = await api.get(`/api/recruitment/jobs/${jobId}/applications`);
      setApplications(res.data?.data?.content || res.data?.data || []);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/recruitment/jobs', jobForm);
      toast.success('Job posted successfully!');
      setShowJobForm(false);
      setJobForm(EMPTY_JOB);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseJob = async (e, jobId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to close this job opening?')) return;

    setClosingJobId(jobId);
    try {
      await api.put(`/api/recruitment/jobs/${jobId}/close`);
      toast.success('Job posting closed!');

      setJobs((prevJobs) =>
        prevJobs.map((j) => (j.id === jobId ? { ...j, status: 'CLOSED' } : j))
      );
      if (selectedJob?.id === jobId) {
        setSelectedJob((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close job posting');
    } finally {
      setClosingJobId(null);
    }
  };

  const handleUpdateApplication = async (appId, status) => {
    if (!status) {
      toast.error('Select a status');
      return;
    }

    setUpdatingApp(appId);

    try {
      await api.put(`/api/recruitment/applications/${appId}`, { status });

      if (status === 'SHORTLISTED') {
        toast.success('Candidate approved successfully!');
      } else if (status === 'REJECTED') {
        toast.success('Candidate rejected.');
      } else {
        toast.success('Application updated!');
      }

      if (selectedJob?.id) {
        fetchApplications(selectedJob.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };

  return (
    <div className="w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
            Recruitment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage job postings and candidate applications
          </p>
        </div>
        <button
          onClick={() => setShowJobForm(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all"
        >
          + Post Job
        </button>
      </div>

      <div className={`grid gap-5 ${selectedJob ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>

        {/* Jobs List */}
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${selectedJob ? 'lg:col-span-2' : ''}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Job Postings ({jobs.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-14 text-center">
              <div className="text-4xl mb-3">💼</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">No jobs posted yet</div>
              <button
                onClick={() => setShowJobForm(true)}
                className="px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                + Post First Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const isClosed = job.status === 'CLOSED';
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-4 cursor-pointer transition-colors ${isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 dark:border-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {job.title}
                      </div>
                      <Badge status={job.status} />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      📍 {job.location} · {job.department} · {job.employmentType}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      💰 {job.salaryRange} · Exp: {job.experienceRequired}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Deadline: {job.applicationDeadline}
                      </div>

                      {!isClosed && (
                        <button
                          type="button"
                          onClick={(e) => handleCloseJob(e, job.id)}
                          disabled={closingJobId === job.id}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {closingJobId === job.id ? 'Closing...' : 'Close Job'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Applications Panel */}
        {selectedJob && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                  {selectedJob.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {applications.length} application(s) received
                </p>
              </div>

              {selectedJob.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={(e) => handleCloseJob(e, selectedJob.id)}
                  disabled={closingJobId === selectedJob.id}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {closingJobId === selectedJob.id ? 'Closing...' : '🚫 Close Job'}
                </button>
              )}
            </div>

            {loadingApps ? (
              <div className="p-10 text-center text-slate-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-14 text-center">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">No applications yet</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Applications will appear here when candidates apply
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <div key={app.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9.5 h-9.5 rounded-full bg-gradient-to-br from-slate-800 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {app.candidateName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                            {app.candidateName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                            {app.candidateEmail}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {app.candidatePhone}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {app.experienceYears ?? 0}{" "}
                            {(app.experienceYears ?? 0) === 1 ? "year" : "years"}{" "}
                            {app.experienceMonths ?? 0}{" "}
                            {(app.experienceMonths ?? 0) === 1 ? "month" : "months"}{" "}
                            experience
                          </div>
                        </div>
                      </div>
                      <Badge status={app.status} />
                    </div>

                    {app.resumeUrl && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          📄 Resume:
                        </span>
                        <a
                          href={
                            app.resumeUrl.startsWith('http')
                              ? app.resumeUrl
                              : `http://localhost:8080${app.resumeUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          View Resume →
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      👤 Referred By:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {app.referredByName || 'Direct Application'}
                      </strong>
                    </div>

                    {app.status === 'APPLIED' && (
                      <div className="flex gap-2.5 mt-2.5 mb-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateApplication(app.id, 'SHORTLISTED')}
                          disabled={updatingApp === app.id}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateApplication(app.id, 'REJECTED')}
                          disabled={updatingApp === app.id}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}

                    {app.interviewDate && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        📅 Interview: {app.interviewDate} · {app.interviewMode}
                        {app.interviewScore && ` · Score: ${app.interviewScore}/100`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Post New Job</h2>
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                {[
                  { label: 'Job Title', name: 'title', required: true, placeholder: 'e.g. Java Developer' },
                  { label: 'Department', name: 'department', required: true, placeholder: 'e.g. Engineering' },
                  { label: 'Location', name: 'location', placeholder: 'e.g. Hyderabad' },
                  { label: 'Salary Range', name: 'salaryRange', placeholder: 'e.g. 6-10 LPA' },
                  { label: 'Experience Required', name: 'experienceRequired', placeholder: 'e.g. 2-4 years' },
                  { label: 'Application Deadline', name: 'applicationDeadline', type: 'date' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={jobForm[f.name]}
                      onChange={(e) => setJobForm({ ...jobForm, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employment Type
                </label>
                <select
                  value={jobForm.employmentType}
                  onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Job description..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requirements
                </label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="Job requirements..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {submitting ? '⏳ Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}