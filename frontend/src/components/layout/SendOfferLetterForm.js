'use client';

import { useState } from 'react';
import { useInterview } from '@/lib/InterviewForm';
import { Mail, Loader } from 'lucide-react';

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

  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!file.type.includes('pdf')) {
        setError('Only PDF files are allowed');
        return;
      }

      setPdfFile(file);
      setFileName(file.name);
      setFileSize(Math.round(file.size / 1024));
      setError(null);
    }
  };

  const handleViewPDF = () => {
    if (pdfFile) {
      const fileURL = URL.createObjectURL(pdfFile);
      window.open(fileURL, '_blank');
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setFileName('');
    setFileSize(null);
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

    if (!offerData.joiningDate.trim()) {
      setError('Please enter joining date');
      return;
    }

    if (!offerData.reportingTo.trim()) {
      setError('Please enter reporting person');
      return;
    }

    if (!offerData.acceptanceDeadline.trim()) {
      setError('Please enter acceptance deadline');
      return;
    }

    if (!pdfFile) {
      setError('Please upload a PDF file');
      return;
    }

    setLoading(true);

    try {
      const response = await sendOfferLetter(offerData, pdfFile);

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

      setPdfFile(null);
      setFileName('');
      setFileSize(null);

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

    setPdfFile(null);
    setFileName('');
    setFileSize(null);
    setShowSuccess(false);
    setError(null);
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-4 sm:p-6">

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={24} className="text-blue-500" />

            <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">
              Send Offer Letter
            </h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-slate-400">
            Send employment offer letter to selected candidate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Candidate Name
            </label>

            <input
              type="text"
              name="candidateName"
              value={offerData.candidateName}
              onChange={handleChange}
              placeholder="Enter candidate name"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="recipientEmail"
              value={offerData.recipientEmail}
              onChange={handleChange}
              placeholder="Enter email"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Job Title
            </label>

            <input
              type="text"
              name="jobTitle"
              value={offerData.jobTitle}
              onChange={handleChange}
              placeholder="e.g., Senior Operations Executive"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Salary
            </label>

            <input
              type="text"
              name="salary"
              value={offerData.salary}
              onChange={handleChange}
              placeholder="e.g., Rs. 3,50,000 Per Annum"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Joining Date
            </label>

            <input
              type="date"
              name="joiningDate"
              min={today}
              value={offerData.joiningDate}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Reporting To
            </label>

            <input
              type="text"
              name="reportingTo"
              value={offerData.reportingTo}
              onChange={handleChange}
              placeholder="e.g., HR Manager"
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Acceptance Deadline
            </label>

            <input
              type="date"
              name="acceptanceDeadline"
              min={today}
              value={offerData.acceptanceDeadline}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Attachment Section */}
          <div className="border-t border-gray-300 dark:border-slate-700 pt-4 mt-2">

            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
              Attachment
            </label>

            <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer mb-3">

              <svg
                className="mx-auto h-8 w-8 text-blue-500 mb-2"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-14-12l6 6m0 0l-6 6m6-6H8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">
                Upload PDF file
              </p>

              <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">
                Drag and drop or click to browse
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="pdf-input"
              />

              <label htmlFor="pdf-input" className="cursor-pointer">
                <span className="text-xs text-blue-500 hover:text-blue-400 font-medium">
                  Select file
                </span>
              </label>
            </div>

            {fileName && (
              <div className="bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between">

                <div className="flex items-center gap-3 flex-1">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {fileName}
                    </p>

                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      {fileSize} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleViewPDF}
                  disabled={loading}
                  className="text-xs text-blue-500 hover:text-blue-400 font-medium whitespace-nowrap ml-2 disabled:opacity-60"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-400 font-medium whitespace-nowrap ml-2 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                ❌ {error}
              </p>
            </div>
          )}

          {showSuccess && success && (
            <div className="p-3 bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ {success}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-300 dark:border-slate-700">

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
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