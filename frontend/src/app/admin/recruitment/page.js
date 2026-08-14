'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const STATUSES = [
  'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED',
  'INTERVIEWED', 'OFFER_SENT', 'OFFER_ACCEPTED',
  'OFFER_REJECTED', 'REJECTED',
];

// ---------------------------------------------------------------------------
// THEME VARIABLES: Emerald Teal & Charcoal
// ---------------------------------------------------------------------------
function ThemeVars() {
  return (
    <style jsx global>{`
      :root {
        --bg-page: #f4f6f8;
        --bg-card: #ffffff;
        --bg-card-header: #f8fafc;
        --bg-hover: #f1f5f9;
        --bg-selected: #f0fdf4;
        --border-color: #e2e8f0;
        --border-color-light: #f1f5f9;
        --border-color-strong: #cbd5e1;
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-muted: #94a3b8;
        
        /* Accent Colors */
        --accent-primary: #0d9488;       /* Teal 600 */
        --accent-primary-hover: #0f766e; /* Teal 700 */
        --accent-blue: #10b981;          /* Emerald 500 */
        --accent-blue-bg: #ecfdf5;
        
        --btn-secondary-bg: #f1f5f9;
        --btn-secondary-text: #334155;
        --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);

        --badge-open-bg: #dcfce7;       --badge-open-text: #15803d;
        --badge-closed-bg: #ffe4e6;     --badge-closed-text: #e11d48;
        --badge-draft-bg: #f1f5f9;      --badge-draft-text: #64748b;
        --badge-applied-bg: #e0f2fe;    --badge-applied-text: #0284c7;
        --badge-shortlisted-bg: #fae8ff;--badge-shortlisted-text: #a21caf;
        --badge-interview-bg: #fef3c7;  --badge-interview-text: #b45309;
        --badge-interviewed-bg: #fef9c3;--badge-interviewed-text: #a16207;
        --badge-offer-bg: #d1fae5;      --badge-offer-text: #047857;
        --badge-accepted-bg: #dcfce7;   --badge-accepted-text: #15803d;
        --badge-rejected-bg: #ffe4e6;   --badge-rejected-text: #e11d48;
      }

      .dark {
        --bg-page: #090d16;
        --bg-card: #111827;
        --bg-card-header: #1f2937;
        --bg-hover: #1f2937;
        --bg-selected: #064e3b;
        --border-color: #1f2937;
        --border-color-light: #162032;
        --border-color-strong: #374151;
        --text-primary: #f9fafb;
        --text-secondary: #9ca3af;
        --text-muted: #6b7280;
        
        /* Accent Colors Dark */
        --accent-primary: #14b8a6;       /* Teal 500 */
        --accent-primary-hover: #2dd4bf; /* Teal 400 */
        --accent-blue: #34d399;          /* Emerald 400 */
        --accent-blue-bg: #064e3b;
        
        --btn-secondary-bg: #1f2937;
        --btn-secondary-text: #e5e7eb;
        --shadow-card: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);

        --badge-open-bg: #064e3b;       --badge-open-text: #6ee7b7;
        --badge-closed-bg: #881337;     --badge-closed-text: #fda4af;
        --badge-draft-bg: #1f2937;      --badge-draft-text: #9ca3af;
        --badge-applied-bg: #075985;    --badge-applied-text: #7dd3fc;
        --badge-shortlisted-bg: #701a75;--badge-shortlisted-text: #f0abfc;
        --badge-interview-bg: #78350f;  --badge-interview-text: #fde68a;
        --badge-interviewed-bg: #713f12;--badge-interviewed-text: #fef08a;
        --badge-offer-bg: #065f46;      --badge-offer-text: #6ee7b7;
        --badge-accepted-bg: #064e3b;   --badge-accepted-text: #6ee7b7;
        --badge-rejected-bg: #881337;   --badge-rejected-text: #fda4af;
      }
    `}</style>
  );
}

function Badge({ status }) {
  const map = {
    OPEN: { bg: 'var(--badge-open-bg)', color: 'var(--badge-open-text)' },
    CLOSED: { bg: 'var(--badge-closed-bg)', color: 'var(--badge-closed-text)' },
    DRAFT: { bg: 'var(--badge-draft-bg)', color: 'var(--badge-draft-text)' },
    APPLIED: { bg: 'var(--badge-applied-bg)', color: 'var(--badge-applied-text)' },
    SHORTLISTED: { bg: 'var(--badge-shortlisted-bg)', color: 'var(--badge-shortlisted-text)' },
    INTERVIEW_SCHEDULED: { bg: 'var(--badge-interview-bg)', color: 'var(--badge-interview-text)' },
    INTERVIEWED: { bg: 'var(--badge-interviewed-bg)', color: 'var(--badge-interviewed-text)' },
    OFFER_SENT: { bg: 'var(--badge-offer-bg)', color: 'var(--badge-offer-text)' },
    OFFER_ACCEPTED: { bg: 'var(--badge-accepted-bg)', color: 'var(--badge-accepted-text)' },
    OFFER_REJECTED: { bg: 'var(--badge-rejected-bg)', color: 'var(--badge-rejected-text)' },
    REJECTED: { bg: 'var(--badge-rejected-bg)', color: 'var(--badge-rejected-text)' },
  };
  const s = map[status] || { bg: 'var(--badge-draft-bg)', color: 'var(--badge-draft-text)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: '12px',
      fontSize: '11px', fontWeight: '700',
      letterSpacing: '0.3px',
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

  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleViewResume = async (e, resumeUrl) => {
    e.preventDefault();
    try {
      const url = resumeUrl.startsWith('http') ? new URL(resumeUrl).pathname : resumeUrl;
      const res = await api.get(url, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error('Failed to open resume');
      console.error(err);
    }
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recruitment/jobs/all');
      setJobs(res.data?.data?.content || res.data?.data || []);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchJobs(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const fetchApplications = async (jobId) => {
    setLoadingApps(true);
    try {
      const res = await api.get(`/api/recruitment/jobs/${jobId}/applications`);
      setApplications(res.data?.data?.content || res.data?.data || []);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoadingApps(false); }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setSelectedApp(null);
    fetchApplications(job.id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
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
    } finally { setSubmitting(false); }
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
        setSelectedJob((prev) => ({ ...prev, status: newJobStatus }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setTogglingJob(null);
    }
  };

  const handleUpdateApplication = async (appId, statusOverride = null) => {
    const status = statusOverride || newStatus;

    if (!status) {
      toast.error('Select a status');
      return;
    }

    setUpdatingApp(appId);

    try {
      const payload = { status };

      if (status === 'INTERVIEW_SCHEDULED') {
        payload.interviewDate = interviewDate;
        payload.interviewMode = 'VIDEO';
        payload.interviewerId = 2;
      }

      if (status === 'INTERVIEWED') {
        payload.interviewScore = parseInt(interviewScore) || 0;
        payload.interviewNotes = interviewNotes;
      }

      if (status === 'REJECTED') {
        payload.rejectionReason = rejectionReason;
      }

      await api.put(`/api/recruitment/applications/${appId}`, payload);

      if (status === 'SHORTLISTED') {
        toast.success('Candidate approved successfully!');
      } else if (status === 'REJECTED') {
        toast.success('Candidate rejected.');
      } else {
        toast.success('Application updated!');
      }

      setSelectedApp(null);
      setNewStatus('');
      setInterviewDate('');
      setInterviewScore('');
      setInterviewNotes('');
      setRejectionReason('');

      fetchApplications(selectedJob.id);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingApp(null);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '12px' }}>
      <ThemeVars />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Recruitment
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage job postings and candidate applications
          </p>
        </div>
        <button
          onClick={() => setShowJobForm(true)}
          style={{
            padding: '10px 20px', background: 'var(--accent-primary)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            transition: 'all 0.2s',
          }}
        >
          + Post Job
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1.5fr' : '1fr', gap: '20px' }}>

        {/* Jobs List */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-header)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Job Postings ({jobs.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No jobs posted yet</div>
              <button onClick={() => setShowJobForm(true)}
                style={{ padding: '8px 18px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                + Post First Job
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id}
                onClick={() => handleSelectJob(job)}
                style={{
                  padding: '16px 20px', borderBottom: '1px solid var(--border-color-light)',
                  cursor: 'pointer',
                  background: selectedJob?.id === job.id ? 'var(--bg-selected)' : 'var(--bg-card)',
                  borderLeft: selectedJob?.id === job.id ? '4px solid var(--accent-primary)' : '4px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{job.title}</div>

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
                        fontSize: '11px',
                        fontWeight: '600',
                        border: '1px solid var(--border-color-strong)',
                        borderRadius: '6px',
                        background: 'var(--btn-secondary-bg)',
                        color: 'var(--btn-secondary-text)',
                        cursor: 'pointer',
                        opacity: togglingJob === job.id ? 0.5 : 1
                      }}
                    >
                      {togglingJob === job.id ? '...' : job.status === 'OPEN' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  📍 {job.location} · {job.department} · {job.employmentType}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  💰 {job.salaryRange} · Exp: {job.experienceRequired}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Deadline: {job.applicationDeadline}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Applications Panel */}
        {selectedJob && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: '14px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card-header)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {selectedJob.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {applications.length} application(s) received
              </p>
            </div>

            {loadingApps ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading applications...</div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No applications yet</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Applications will appear here when candidates apply
                </div>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-blue))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
                      }}>
                        {app.candidateName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {app.candidateName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          {app.candidateEmail}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {app.candidatePhone}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {app.experienceYears ?? 0} {(app.experienceYears ?? 0) === 1 ? "year" : "years"} {app.experienceMonths ?? 0} {(app.experienceMonths ?? 0) === 1 ? "month" : "months"} experience
                        </div>
                      </div>
                    </div>
                    <Badge status={app.status} />
                  </div>

                  {/* Resume */}
                  {app.resumeUrl && (
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📄 Resume:</span>
                      <a
                        href="#"
                        onClick={(e) => handleViewResume(e, app.resumeUrl)}
                        style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '700', textDecoration: 'none' }}
                      >
                        View Resume →
                      </a>
                    </div>
                  )}

                  {/* Referred By */}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    👤 Referred By: <strong style={{ color: 'var(--text-primary)' }}>{app.referredByName || 'Direct Application'}</strong>
                  </div>

                  {/* Approve / Reject */}
                  {app.status === 'APPLIED' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '12px' }}>
                      <button
                        onClick={() => handleUpdateApplication(app.id, 'SHORTLISTED')}
                        disabled={updatingApp === app.id}
                        style={{ flex: 1, padding: '7px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleUpdateApplication(app.id, 'REJECTED')}
                        disabled={updatingApp === app.id}
                        style={{ flex: 1, padding: '7px 12px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
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

      {/* POST JOB MODAL */}
      {showJobForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Post a New Job</h2>
              <button
                onClick={() => setShowJobForm(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >✕</button>
            </div>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Job Title *</label>
                <input
                  type="text" required name="title" value={jobForm.title} onChange={handleInputChange}
                  placeholder="e.g. Senior Frontend Developer"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Department *</label>
                  <input
                    type="text" required name="department" value={jobForm.department} onChange={handleInputChange}
                    placeholder="Engineering"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Location *</label>
                  <input
                    type="text" required name="location" value={jobForm.location} onChange={handleInputChange}
                    placeholder="Remote / Tirupati"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Employment Type</label>
                  <select
                    name="employmentType" value={jobForm.employmentType} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Salary Range</label>
                  <input
                    type="text" name="salaryRange" value={jobForm.salaryRange} onChange={handleInputChange}
                    placeholder="2-6 lpa"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Experience Required</label>
                  <input
                    type="text" name="experienceRequired" value={jobForm.experienceRequired} onChange={handleInputChange}
                    placeholder="e.g. 3+ years"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Application Deadline</label>
                  <input
                    type="date" name="applicationDeadline" value={jobForm.applicationDeadline} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                <textarea
                  rows="3" name="description" value={jobForm.description} onChange={handleInputChange}
                  placeholder="Job overview and details..."
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Requirements</label>
                <textarea
                  rows="3" name="requirements" value={jobForm.requirements} onChange={handleInputChange}
                  placeholder="Required skills and qualifications..."
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card-header)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button" onClick={() => setShowJobForm(false)}
                  style={{ padding: '10px 18px', background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Posting...' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}