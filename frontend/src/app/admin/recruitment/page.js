'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    OPEN: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    CLOSED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
    APPLIED: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
    SHORTLISTED: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' },
    INTERVIEW_SCHEDULED: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
    INTERVIEWED: { bg: 'rgba(234, 179, 8, 0.15)', color: '#fde047' },
    OFFER_SENT: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    OFFER_ACCEPTED: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
    OFFER_REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
  };
  const s = map[status] || { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
      whiteSpace: 'nowrap',
    }}>
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
  const [togglingJob, setTogglingJob] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recruitment/jobs/all');
      const jobData = res.data?.data?.content || res.data?.data || res.data || [];
      setJobs(Array.isArray(jobData) ? jobData : []);
    } catch (err) {
      console.error('Fetch Jobs Error:', err);
      toast.error(err.response?.data?.message || 'Failed to load jobs');
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
      const appData = res.data?.data?.content || res.data?.data || res.data || [];
      setApplications(Array.isArray(appData) ? appData : []);
    } catch (err) {
      console.error('Fetch Applications Error:', err);
      toast.error(err.response?.data?.message || 'Failed to load applications');
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
      toast.success(newJobStatus === 'OPEN' ? 'Job reopened!' : 'Job closed!');

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newJobStatus } : j))
      );

      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, status: newJobStatus });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingJob(null);
    }
  };

  const handleUpdateApplication = async (appId, statusOverride = null) => {
    const status = statusOverride || newStatus;
    if (!status) return toast.error('Select a status');

    setUpdatingApp(appId);
    try {
      const payload = { status };
      if (status === 'INTERVIEW_SCHEDULED') {
        payload.interviewDate = interviewDate;
        payload.interviewMode = 'VIDEO';
        payload.interviewerId = 2;
      }
      if (status === 'INTERVIEWED') {
        payload.interviewScore = parseInt(interviewScore, 10) || 0;
        payload.interviewNotes = interviewNotes;
      }
      if (status === 'REJECTED') payload.rejectionReason = rejectionReason;

      await api.put(`/api/recruitment/applications/${appId}`, payload);
      toast.success('Application updated!');

      setNewStatus('');
      setInterviewDate('');
      setInterviewScore('');
      setInterviewNotes('');
      setRejectionReason('');

      if (selectedJob) fetchApplications(selectedJob.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      {/* Header with high contrast readable text */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--foreground, #f8fafc)', marginBottom: '4px' }}>
            Recruitment
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground, #94a3b8)' }}>
            Manage job postings and candidate applications
          </p>
        </div>
        <button
          onClick={() => setShowJobForm(true)}
          style={{
            padding: '10px 20px', background: '#2563eb',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
          }}
        >
          + Post Job
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1.5fr' : '1fr', gap: '20px' }}>
        {/* Left Column: Job List */}
        <div style={{
          background: 'var(--card-bg, #1e293b)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #334155)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #334155)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground, #f8fafc)' }}>
              Job Postings ({jobs.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground, #f8fafc)', marginBottom: '8px' }}>No jobs posted yet</div>
              <button onClick={() => setShowJobForm(true)}
                style={{ padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                + Post First Job
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id}
                onClick={() => handleSelectJob(job)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color, #334155)',
                  cursor: 'pointer',
                  background: selectedJob?.id === job.id ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  borderLeft: selectedJob?.id === job.id ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground, #f8fafc)' }}>{job.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge status={job.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJobStatus(job);
                      }}
                      disabled={togglingJob === job.id}
                      style={{
                        padding: '4px 10px',
                        background: job.status === 'OPEN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: job.status === 'OPEN' ? '#f87171' : '#4ade80',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: togglingJob === job.id ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {togglingJob === job.id ? '...' : job.status === 'OPEN' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground, #cbd5e1)', marginBottom: '4px' }}>
                  📍 {job.location} · {job.department} · {job.employmentType}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground, #94a3b8)' }}>
                  💰 {job.salaryRange} · Exp: {job.experienceRequired}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground, #94a3b8)', marginTop: '4px' }}>
                  Deadline: {job.applicationDeadline}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Applications */}
        {selectedJob && (
          <div style={{
            background: 'var(--card-bg, #1e293b)', borderRadius: '12px',
            border: '1px solid var(--border-color, #334155)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #334155)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground, #f8fafc)', marginBottom: '2px' }}>
                    {selectedJob.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {applications.length} application(s) received
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge status={selectedJob.status} />
                </div>
              </div>
            </div>

            {loadingApps ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading applications...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground, #f8fafc)' }}>No applications yet</div>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #334155)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
                      }}>
                        {app.candidateName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground, #f8fafc)' }}>
                          {app.candidateName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {app.candidateEmail} · {app.candidatePhone}
                        </div>
                      </div>
                    </div>
                    <Badge status={app.status} />
                  </div>

                  {app.status === 'APPLIED' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleUpdateApplication(app.id, 'SHORTLISTED')}
                        disabled={updatingApp === app.id}
                        style={{
                          flex: 1, padding: '8px',
                          background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleUpdateApplication(app.id, 'REJECTED')}
                        disabled={updatingApp === app.id}
                        style={{
                          flex: 1, padding: '8px',
                          background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showJobForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--card-bg, #1e293b)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '560px', maxHeight: '90vh',
            overflowY: 'auto', border: '1px solid var(--border-color, #334155)',
            color: 'var(--foreground, #f8fafc)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Post New Job</h2>
              <button onClick={() => setShowJobForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {[
                  { label: 'Job Title', name: 'title', required: true, placeholder: 'e.g. Java Developer' },
                  { label: 'Department', name: 'department', required: true, placeholder: 'e.g. Engineering' },
                  { label: 'Location', name: 'location', placeholder: 'e.g. Hyderabad' },
                  { label: 'Salary Range', name: 'salaryRange', placeholder: 'e.g. 6-10 LPA' },
                  { label: 'Experience Required', name: 'experienceRequired', placeholder: 'e.g. 2-4 years' },
                  { label: 'Application Deadline', name: 'applicationDeadline', type: 'date' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                      {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={jobForm[f.name]}
                      onChange={e => setJobForm({ ...jobForm, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{
                        width: '100%', padding: '9px 12px',
                        background: 'rgba(0,0,0,0.2)', color: 'inherit',
                        border: '1px solid var(--border-color, #475569)',
                        borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                  Employment Type
                </label>
                <select value={jobForm.employmentType}
                  onChange={e => setJobForm({ ...jobForm, employmentType: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'var(--card-bg, #1e293b)', color: 'inherit',
                    border: '1px solid var(--border-color, #475569)',
                    borderRadius: '8px', fontSize: '13px', outline: 'none'
                  }}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea value={jobForm.description}
                  onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Job description..." required rows={3}
                  style={{
                    width: '100%', padding: '9px 12px',
                    background: 'rgba(0,0,0,0.2)', color: 'inherit',
                    border: '1px solid var(--border-color, #475569)',
                    borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowJobForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
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