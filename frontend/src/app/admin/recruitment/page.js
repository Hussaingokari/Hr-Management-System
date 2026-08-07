'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const STATUSES = [
  'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED',
  'INTERVIEWED', 'OFFER_SENT', 'OFFER_ACCEPTED',
  'OFFER_REJECTED', 'REJECTED',
];

function Badge({ status }) {
  const map = {
    OPEN:               { bg: '#dcfce7', color: '#16a34a' },
    CLOSED:             { bg: '#fee2e2', color: '#dc2626' },
    DRAFT:              { bg: '#f1f5f9', color: 'var(--text-secondary)' },
    APPLIED:            { bg: '#eff6ff', color: '#3b82f6' },
    SHORTLISTED:        { bg: '#fdf4ff', color: '#9333ea' },
    INTERVIEW_SCHEDULED:{ bg: '#fff7ed', color: '#f59e0b' },
    INTERVIEWED:        { bg: '#fef9c3', color: '#ca8a04' },
    OFFER_SENT:         { bg: '#f0fdf4', color: '#16a34a' },
    OFFER_ACCEPTED:     { bg: '#dcfce7', color: '#16a34a' },
    OFFER_REJECTED:     { bg: '#fee2e2', color: '#dc2626' },
    REJECTED:           { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
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
  const [jobs, setJobs]                   = useState([]);
  const [selectedJob, setSelectedJob]     = useState(null);
  const [applications, setApplications]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingApps, setLoadingApps]     = useState(false);
  const [showJobForm, setShowJobForm]     = useState(false);
  const [jobForm, setJobForm]             = useState(EMPTY_JOB);
  const [submitting, setSubmitting]       = useState(false);
  const [updatingApp, setUpdatingApp]     = useState(null);
  const [selectedApp, setSelectedApp]     = useState(null);
  const [newStatus, setNewStatus]         = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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

  const handleUpdateApplication = async (appId) => {
    if (!newStatus) { toast.error('Select a status'); return; }
    setUpdatingApp(appId);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'INTERVIEW_SCHEDULED') {
        payload.interviewDate  = interviewDate;
        payload.interviewMode  = 'VIDEO';
        payload.interviewerId  = 2;
      }
      if (newStatus === 'INTERVIEWED') {
        payload.interviewScore = parseInt(interviewScore) || 0;
        payload.interviewNotes = interviewNotes;
      }
      if (newStatus === 'REJECTED') {
        payload.rejectionReason = rejectionReason;
      }
      await api.put(`/api/recruitment/applications/${appId}`, payload);
      toast.success('Application updated!');
      setSelectedApp(null);
      setNewStatus('');
      fetchApplications(selectedJob.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdatingApp(null); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Recruitment
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage job postings and candidate applications
          </p>
        </div>
        <button
          onClick={() => setShowJobForm(true)}
          style={{
            padding: '10px 20px', background: '#1e3a5f',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          }}
        >+ Post Job</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1.5fr' : '1fr', gap: '20px' }}>

        {/* Jobs List */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: '12px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
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
                style={{ padding: '8px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                + Post First Job
              </button>
            </div>
          ) : (
            jobs.map((job, i) => (
              <div key={job.id}
                onClick={() => handleSelectJob(job)}
                style={{
                  padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: selectedJob?.id === job.id ? '#eff6ff' : 'white',
                  borderLeft: selectedJob?.id === job.id ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (selectedJob?.id !== job.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{job.title}</div>
                  <Badge status={job.status}/>
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

        {/* Applications */}
        {selectedJob && (
          <div style={{
            background: 'var(--card-bg)', borderRadius: '12px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
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
              applications.map((app, i) => (
                <div key={app.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
                      }}>
                        {app.candidateName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {app.candidateName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {app.candidateEmail} · {app.candidatePhone}
                        </div>
                      </div>
                    </div>
                    <Badge status={app.status}/>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    🏢 {app.currentCompany} · {app.currentDesignation} · {app.experienceYears} yrs exp
                  </div>

                  {app.interviewDate && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      📅 Interview: {app.interviewDate} · {app.interviewMode}
                      {app.interviewScore && ` · Score: ${app.interviewScore}/100`}
                    </div>
                  )}

                  {/* Update Status */}
                  {selectedApp === app.id ? (
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <select
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)', marginBottom: '8px' }}
                        >
                          <option value="">Select new status...</option>
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>

                        {newStatus === 'INTERVIEW_SCHEDULED' && (
                          <input type="date" value={interviewDate}
                            onChange={e => setInterviewDate(e.target.value)}
                            placeholder="Interview Date"
                            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                          />
                        )}

                        {newStatus === 'INTERVIEWED' && (
                          <>
                            <input type="number" value={interviewScore}
                              onChange={e => setInterviewScore(e.target.value)}
                              placeholder="Score (0-100)"
                              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                            />
                            <input value={interviewNotes}
                              onChange={e => setInterviewNotes(e.target.value)}
                              placeholder="Interview notes..."
                              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </>
                        )}

                        {newStatus === 'REJECTED' && (
                          <input value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Rejection reason..."
                            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateApplication(app.id)}
                          disabled={updatingApp === app.id}
                          style={{ flex: 1, padding: '8px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {updatingApp === app.id ? '⏳' : 'Update'}
                        </button>
                        <button
                          onClick={() => { setSelectedApp(null); setNewStatus(''); }}
                          style={{ padding: '8px 14px', background: 'var(--card-border)', color: 'var(--text-secondary)', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedApp(app.id)}
                      style={{
                        marginTop: '8px', padding: '6px 14px',
                        background: '#eff6ff', color: '#3b82f6',
                        border: '1px solid #bfdbfe', borderRadius: '6px',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      Update Status →
                    </button>
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '560px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Post New Job</h2>
              <button onClick={() => setShowJobForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
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
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                      {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={jobForm[f.name]}
                      onChange={e => setJobForm({ ...jobForm, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.required}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Employment Type
                </label>
                <select value={jobForm.employmentType}
                  onChange={e => setJobForm({ ...jobForm, employmentType: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--card-bg)' }}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea value={jobForm.description}
                  onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Job description..." required rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Requirements
                </label>
                <textarea value={jobForm.requirements}
                  onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="Job requirements..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowJobForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--card-bg)', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
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