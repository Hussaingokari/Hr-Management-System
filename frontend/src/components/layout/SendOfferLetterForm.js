'use client';

import { useState } from 'react';
import { useInterview } from '@/lib/InterviewForm';
import { Mail, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SendOfferLetterForm() {
  const { sendOfferLetter } = useInterview();

  const [offerData, setOfferData] = useState({
    candidateName: '',
    recipientEmail: '',
    jobTitle: '',
    salary: '',
    joiningDate: '',
    reportingTo: '',
    acceptanceDeadline: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowSuccess(false);
    setError(null);

    if (!offerData.candidateName.trim()) {
      setError('Please enter candidate name');
      return;
    }
    if (!offerData.recipientEmail.trim()) {
      setError('Please enter email address');
      return;
    }
    if (!offerData.jobTitle.trim()) {
      setError('Please enter job title');
      return;
    }
    if (!offerData.salary.trim()) {
      setError('Please enter salary');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOfferLetter(offerData);
      setSuccess(response?.message || 'Offer letter sent successfully');
      setShowSuccess(true);
      setOfferData({
        candidateName: '',
        recipientEmail: '',
        jobTitle: '',
        salary: '',
        joiningDate: '',
        reportingTo: '',
        acceptanceDeadline: '',
      });
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to send offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOfferData({
      candidateName: '',
      recipientEmail: '',
      jobTitle: '',
      salary: '',
      joiningDate: '',
      reportingTo: '',
      acceptanceDeadline: '',
    });
    setShowSuccess(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={24} className="text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900 ">Send Offer Letter</h2>
          </div>
          <p className="text-sm text-gray-600 ">Send employment offer letter to selected candidate</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Candidate Name</label>
            <input
              type="text"
              name="candidateName"
              value={offerData.candidateName}
              onChange={handleChange}
              placeholder="Enter candidate name"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              name="recipientEmail"
              value={offerData.recipientEmail}
              onChange={handleChange}
              placeholder="Enter email"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={offerData.jobTitle}
              onChange={handleChange}
              placeholder="e.g., Senior Operations Executive"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Salary</label>
            <input
              type="text"
              name="salary"
              value={offerData.salary}
              onChange={handleChange}
              placeholder="e.g., Rs. 3,50,000 Per Annum"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Joining Date</label>
            <input
              type="date"
              name="joiningDate"
              min={today}
              value={offerData.joiningDate}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Reporting To</label>
            <input
              type="text"
              name="reportingTo"
              value={offerData.reportingTo}
              onChange={handleChange}
              placeholder="e.g., HR Manager"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Acceptance Deadline</label>
            <input
              type="date"
              name="acceptanceDeadline"
              min={today}
              value={offerData.acceptanceDeadline}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-300 rounded-lg"><p className="text-sm text-red-800 flex items-center gap-1"><AlertTriangle size={14} /> {error}</p></div>}
          {showSuccess && success && <div className="p-3 bg-green-100 border border-green-300 rounded-lg"><p className="text-sm text-green-800 flex items-center gap-1"><CheckCircle size={14} /> {success}</p></div>}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-300 ">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={14} />
                  SEND OFFER LETTER
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}