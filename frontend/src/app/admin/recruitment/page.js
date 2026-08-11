'use client';
 
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
 
const STATUS_CLASSES = {
  OPEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  CLOSED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  APPLIED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  SHORTLISTED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  INTERVIEW_SCHEDULED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  INTERVIEWED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
  OFFER_SENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  OFFER_ACCEPTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  OFFER_REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};
 
function Badge({ status }) {
  const colorClass = STATUS_CLASSES[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${colorClass}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
 
const EMPTY_JOB = {
  title: '',
  department: '',
  location: '',
  employmentType: 'FULL_TIME',
  description: '',
  requirements: '',
  experienceRequired: '',
  salaryRange: '',
  applicationDeadline: '',
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
  const [togglingJob, setTogglingJob] = useState(null);
 
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
 
  const handleToggleJobStatus = async (job) => {
    const newJobStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingJob(job.id);
 
    try {
      await api.put(`/api/recruitment/jobs/${job.id}`, { status: newJobStatus });
      toast.success(newJobStatus === 'OPEN' ? 'Job reopened successfully!' : 'Job closed successfully!');
 
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newJobStatus } : j))
      );
 
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, status: newJobStatus });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setTogglingJob(null);
    }
  };
 
  const handleUpdateApplication = async (appId, status) => {
    setUpdatingApp(appId);
    try {
      await api.put(`/api/recruitment/applications/${appId}`, { status });
      toast.success(status === 'SHORTLISTED' ? 'Candidate approved!' : 'Candidate rejected.');
      fetchApplications(selectedJob.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };
 
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Recruitment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage job postings and candidate applications</p>
        </div>
        <button
          onClick={() => setShowJobForm(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          + Post Job
        </button>
      </div>
 
      {/* Main Content Layout */}
      <div className={`grid gap-6 ${selectedJob ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
 
        {/* Job List */}
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${selectedJob ? 'lg:col-span-2' : ''}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Job Postings ({jobs.length})</h3>
          </div>
 
          {loading ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl block mb-2">💼</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No jobs posted yet</p>
              <button
                onClick={() => setShowJobForm(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                + Post First Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-4 cursor-pointer transition border-l-4 ${isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{job.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge status={job.status} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleJobStatus(job);
                          }}
                          disabled={togglingJob === job.id}
                          className="text-xs px-2 py-1 rounded font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                        >
                          {togglingJob === job.id ? '...' : job.status === 'OPEN' ? 'Close' : 'Reopen'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      📍 {job.location} · {job.department} · {job.employmentType}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      💰 {job.salaryRange} · Exp: {job.experienceRequired}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
 
        {/* Right Column: Applications Details */}
        {selectedJob && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{applications.length} application(s) received</p>
              </div>
              <Badge status={selectedJob.status} />
            </div>
 
            {loadingApps ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <span className="text-4xl block mb-2">📭</span>
                <p>No applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => {
                  // Resolve referrer name across potential API field structures
                  const referrerName =
                    app.referredByName ||
                    app.referrerName ||
                    app.referredByEmployeeName ||
                    (typeof app.referredBy === 'object' ? app.referredBy?.name : app.referredBy);
 
                  return (
                    <div key={app.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-blue-600 text-white font-bold text-sm flex items-center justify-center">
                            {app.candidateName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{app.candidateName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{app.candidateEmail}</p>
 
                            {/* Referred By Section */}
                            {referrerName && (
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                <span>👤 Referred by:</span>
                                <span className="font-semibold">{referrerName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge status={app.status} />
                      </div>
 
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl.startsWith('http') ? app.resumeUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${app.resumeUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          📄 View Resume →
                        </a>
                      )}
 
                      {app.status === 'APPLIED' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleUpdateApplication(app.id, 'SHORTLISTED')}
                            disabled={updatingApp === app.id}
                            className="flex-1 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleUpdateApplication(app.id, 'REJECTED')}
                            disabled={updatingApp === app.id}
                            className="flex-1 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Post Job Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Post New Job</h3>
              <button onClick={() => setShowJobForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
 
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Job Title *"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Department *"
                  required
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  className="p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
 
              <textarea
                placeholder="Description *"
                required
                rows={3}
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                className="p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
              />
 
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 