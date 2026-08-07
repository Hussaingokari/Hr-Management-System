"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import api from "@/lib/axios";
import { Mail } from "lucide-react";

function formatDisplayDate(yyyyMmDd) {
    if (!yyyyMmDd) return "[Date]";
    const [year, month, day] = yyyyMmDd.split("-");
    if (!year || !month || !day) return "[Date]";
    return `${day}/${month}/${year}`;
}

export default function SendDocumentRequestForm() {
    const { token, user } = useSelector((state) => state.auth);

    const [candidateName, setCandidateName] = useState("");
    const [email, setEmail] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [interviewDate, setInterviewDate] = useState("");
    const [submissionDeadline, setSubmissionDeadline] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null);

    const today = new Date().toISOString().split('T')[0];

    const resetForm = () => {
        setCandidateName("");
        setEmail("");
        setJobTitle("");
        setInterviewDate("");
        setSubmissionDeadline("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);

        if (!/^[A-Za-z\s]+$/.test(candidateName)) {
            setBanner({ type: "error", message: "Candidate name should only contain letters and spaces." });
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            setBanner({ type: "error", message: "Please enter a valid email address." });
            return;
        }
        if (/^\d+$/.test(jobTitle) || !/[a-zA-Z]/.test(jobTitle)) {
            setBanner({ type: "error", message: "Job Role must contain letters." });
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post("/api/document-request/send", {
                candidateName,
                email,
                jobTitle,
                interviewDate: interviewDate || null,
                submissionDeadline: submissionDeadline || null,
                adminId: user?.id,
                adminName: user?.name,
            });

            setBanner({ type: "success", message: response.data.message || "Document request email sent successfully." });
            resetForm();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Could not reach the server. Please try again.";
            setBanner({ type: "error", message: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-8" style={{ colorScheme: 'light' }}>
            <div className="flex items-center gap-3 mb-1">
                <Mail className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-900 ">Send Document Request</h2>
            </div>
            <p className="text-gray-500 mb-6">Send onboarding document request email to the candidate.</p>

            {banner && (
                <div
                    className={`mb-5 rounded-lg px-4 py-3 text-sm ${banner.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-800"
                        }`}
                >
                    {banner.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Candidate Name
                    </label>
                    <input
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Enter Candidate Name"
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email Address"
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Job Role
                    </label>
                    <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Enter Job Role"
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Interview Date
                    </label>
                    <input
                        type="date"
                        required
                        max={today}
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Submission Deadline
                    </label>
                    <input
                        type="date"
                        required
                        min={today}
                        value={submissionDeadline}
                        onChange={(e) => setSubmissionDeadline(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Email Preview
                    </label>
                    <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed">
                        <p>Dear {candidateName || "Candidate"},</p>
                        <br />
                        <p>Greetings from SAITEJA INFOTECH PVT LTD.</p>
                        <br />
                        <p>
                            We would like to thank you for attending the interview held on{" "}
                            <strong>{formatDisplayDate(interviewDate)}</strong> for the position of{" "}
                            <strong>{jobTitle || "[Job Title]"}</strong>. Following the interview, we
                            request you to submit the necessary documents for verification and further
                            processing of your application.
                        </p>
                        <br />
                        <p>
                            <strong>Documents Required:</strong>
                        </p>
                        <ol className="list-decimal ml-5">
                            <li>Updated Resume / CV</li>
                            <li>Educational Certificates (10th, 12th, Graduation, etc.)</li>
                            <li>Experience / Relieving Letters from previous employers (if applicable)</li>
                            <li>Government-issued ID proof (Aadhar, Passport, Driving License, etc.)</li>
                            <li>Any other certificates relevant to the position</li>
                        </ol>
                        <br />
                        <p>
                            <strong>Submission Guidelines:</strong>
                        </p>
                        <ul className="list-disc ml-5">
                            <li>Kindly send scanned copies of all documents in PDF format to hr@saitejainfotechprivatelimited.com.</li>
                            <li>Ensure that all documents are clear and legible.</li>
                            <li>
                                Please submit the documents by{" "}
                                <strong>{formatDisplayDate(submissionDeadline)}</strong>.
                            </li>
                        </ul>
                        <br />
                        <p>Yours faithfully,</p>
                        <p>Human Resources Department</p>
                        <p>SAITEJA INFOTECH PVT LTD</p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
                >
                    {submitting ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}