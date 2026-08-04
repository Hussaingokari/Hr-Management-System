'use client';

import { useState } from 'react';
import { useInterview } from '@/lib/InterviewForm';
import { Mail, Loader } from 'lucide-react';

export default function SendInterviewForm() {
  const { sendOnlineInterview, sendOfflineInterview } = useInterview();

  // ONLINE INTERVIEW STATE
  const [onlineData, setOnlineData] = useState({
    candidateName: '',
    recipientEmail: '',
    jobTitle: '',
    interviewDate: '',
    interviewTime: '',
    platform: '',
    meetingLink: '',
    meetingId: '',
    passcode: '',
  });
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState(null);
  const [onlineSuccess, setOnlineSuccess] = useState(null);
  const [showOnlineSuccess, setShowOnlineSuccess] = useState(false);

  // OFFLINE INTERVIEW STATE
  const [offlineData, setOfflineData] = useState({
    candidateName: '',
    recipientEmail: '',
    jobTitle: '',
    interviewDate: '',
    interviewTime: '',
    venueAddress: '',
    cityLocation: '',
  });
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [offlineError, setOfflineError] = useState(null);
  const [offlineSuccess, setOfflineSuccess] = useState(null);
  const [showOfflineSuccess, setShowOfflineSuccess] = useState(false);

  const handleOnlineChange = (e) => {
    const { name, value } = e.target;
    setOnlineData(prev => ({ ...prev, [name]: value }));
  };

  const handleOfflineChange = (e) => {
    const { name, value } = e.target;
    setOfflineData(prev => ({ ...prev, [name]: value }));
  };

  // Field labels used for validation error messages
  const ONLINE_FIELD_LABELS = {
    candidateName: 'Candidate Name',
    recipientEmail: 'Email Address',
    jobTitle: 'Job Title',
    interviewDate: 'Interview Date',
    interviewTime: 'Interview Time',
    platform: 'Platform',
    meetingLink: 'Meeting Link',
    meetingId: 'Meeting ID',
    passcode: 'Passcode',
  };

  const OFFLINE_FIELD_LABELS = {
    candidateName: 'Candidate Name',
    recipientEmail: 'Email Address',
    jobTitle: 'Job Title',
    interviewDate: 'Interview Date',
    interviewTime: 'Interview Time',
    venueAddress: 'Venue Address',
    cityLocation: 'City / Location',
  };

  const getMissingFields = (data, labels) =>
    Object.keys(labels).filter((key) => !String(data[key] ?? '').trim());

  const handleSendOnlineInterview = async (e) => {
    e.preventDefault();
    setShowOnlineSuccess(false);
    setOnlineError(null);

    const missing = getMissingFields(onlineData, ONLINE_FIELD_LABELS);
    if (missing.length > 0) {
      const missingLabels = missing.map((key) => ONLINE_FIELD_LABELS[key]);
      setOnlineError(`Please fill in all fields. Missing: ${missingLabels.join(', ')}`);
      return;
    }

    setOnlineLoading(true);
    try {
      const response = await sendOnlineInterview(onlineData);
      if (response?.success) {
        setOnlineSuccess(response.message);
        setShowOnlineSuccess(true);
        setOnlineData({
          candidateName: '',
          recipientEmail: '',
          jobTitle: '',
          interviewDate: '',
          interviewTime: '',
          platform: '',
          meetingLink: '',
          meetingId: '',
          passcode: '',
        });
        setTimeout(() => setShowOnlineSuccess(false), 5000);
      }
    } catch (err) {
      setOnlineError(err.message || 'Failed to send email');
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleSendOfflineInterview = async (e) => {
    e.preventDefault();
    setShowOfflineSuccess(false);
    setOfflineError(null);

    const missing = getMissingFields(offlineData, OFFLINE_FIELD_LABELS);
    if (missing.length > 0) {
      const missingLabels = missing.map((key) => OFFLINE_FIELD_LABELS[key]);
      setOfflineError(`Please fill in all fields. Missing: ${missingLabels.join(', ')}`);
      return;
    }

    setOfflineLoading(true);
    try {
      const response = await sendOfflineInterview(offlineData);
      if (response?.success) {
        setOfflineSuccess(response.message);
        setShowOfflineSuccess(true);
        setOfflineData({
          candidateName: '',
          recipientEmail: '',
          jobTitle: '',
          interviewDate: '',
          interviewTime: '',
          venueAddress: '',
          cityLocation: '',
        });
        setTimeout(() => setShowOfflineSuccess(false), 5000);
      }
    } catch (err) {
      setOfflineError(err.message || 'Failed to send email');
    } finally {
      setOfflineLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ONLINE INTERVIEW */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={24} className="text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900 ">Online Interview</h2>
          </div>
          <p className="text-sm text-gray-600 ">Send online interview invitation via email</p>
        </div>

        <form onSubmit={handleSendOnlineInterview} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Candidate Name</label>
            <input
              type="text"
              name="candidateName"
              value={onlineData.candidateName}
              onChange={handleOnlineChange}
              placeholder="Enter candidate name"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              name="recipientEmail"
              value={onlineData.recipientEmail}
              onChange={handleOnlineChange}
              placeholder="Enter email"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={onlineData.jobTitle}
              onChange={handleOnlineChange}
              placeholder="e.g., Operations Executive"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Interview Date</label>
            <input
              type="date"
              name="interviewDate"
              value={onlineData.interviewDate}
              onChange={handleOnlineChange}
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Interview Time</label>
            <input
              type="time"
              name="interviewTime"
              value={onlineData.interviewTime}
              onChange={handleOnlineChange}
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Platform</label>
            <input
              type="text"
              name="platform"
              value={onlineData.platform}
              onChange={handleOnlineChange}
              placeholder="e.g., Microsoft Teams"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Meeting Link</label>
            <input
              type="url"
              name="meetingLink"
              value={onlineData.meetingLink}
              onChange={handleOnlineChange}
              placeholder="https://teams.microsoft.com/..."
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Meeting ID</label>
            <input
              type="text"
              name="meetingId"
              value={onlineData.meetingId}
              onChange={handleOnlineChange}
              placeholder="Meeting ID"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Passcode</label>
            <input
              type="text"
              name="passcode"
              value={onlineData.passcode}
              onChange={handleOnlineChange}
              placeholder="Passcode"
              disabled={onlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          {onlineError && <div className="p-3 bg-red-100 border border-red-300 rounded-lg"><p className="text-sm text-red-800">❌ {onlineError}</p></div>}
          {showOnlineSuccess && onlineSuccess && <div className="p-3 bg-green-100 border border-green-300 rounded-lg"><p className="text-sm text-green-800">✓ {onlineSuccess}</p></div>}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-300 ">
            <button type="button" onClick={() => setOnlineData({ candidateName: '', recipientEmail: '', jobTitle: '', interviewDate: '', interviewTime: '', platform: '', meetingLink: '', meetingId: '', passcode: '' })} disabled={onlineLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">CANCEL</button>
            <button type="submit" disabled={onlineLoading} className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-70 flex items-center gap-2">{onlineLoading ? (<><Loader size={14} className="animate-spin" />Sending...</>) : (<><Mail size={14} />SEND ONLINE</>)}</button>
          </div>
        </form>
      </div>

      {/* OFFLINE INTERVIEW */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={24} className="text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900 ">Offline Interview</h2>
          </div>
          <p className="text-sm text-gray-600 ">Send offline interview invitation via email</p>
        </div>

        <form onSubmit={handleSendOfflineInterview} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Candidate Name</label>
            <input
              type="text"
              name="candidateName"
              value={offlineData.candidateName}
              onChange={handleOfflineChange}
              placeholder="Enter candidate name"
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              name="recipientEmail"
              value={offlineData.recipientEmail}
              onChange={handleOfflineChange}
              placeholder="Enter email"
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={offlineData.jobTitle}
              onChange={handleOfflineChange}
              placeholder="e.g., Data Entry Executive"
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Interview Date</label>
            <input
              type="date"
              name="interviewDate"
              value={offlineData.interviewDate}
              onChange={handleOfflineChange}
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Interview Time</label>
            <input
              type="time"
              name="interviewTime"
              value={offlineData.interviewTime}
              onChange={handleOfflineChange}
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Venue Address</label>
            <textarea
              name="venueAddress"
              value={offlineData.venueAddress}
              onChange={handleOfflineChange}
              placeholder="Enter full venue address"
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">City / Location</label>
            <input
              type="text"
              name="cityLocation"
              value={offlineData.cityLocation}
              onChange={handleOfflineChange}
              placeholder="e.g., Tirupati"
              disabled={offlineLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          {offlineError && <div className="p-3 bg-red-100 border border-red-300 rounded-lg"><p className="text-sm text-red-800">❌ {offlineError}</p></div>}
          {showOfflineSuccess && offlineSuccess && <div className="p-3 bg-green-100 border border-green-300 rounded-lg"><p className="text-sm text-green-800">✓ {offlineSuccess}</p></div>}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-300 ">
            <button type="button" onClick={() => setOfflineData({ candidateName: '', recipientEmail: '', jobTitle: '', interviewDate: '', interviewTime: '', venueAddress: '', cityLocation: '' })} disabled={offlineLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">CANCEL</button>
            <button type="submit" disabled={offlineLoading} className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-70 flex items-center gap-2">{offlineLoading ? (<><Loader size={14} className="animate-spin" />Sending...</>) : (<><Mail size={14} />SEND OFFLINE</>)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
