"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

function ReferPersonContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");
    const [experienceYears, setExperienceYears] = useState('');
    const [experienceMonths, setExperienceMonths] = useState('');

    const [form, setForm] = useState({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
    });

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            setResume(null);
            return;
        }

        setResume(file);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!id) {
            setError("Job ID is missing.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // --------------------------------
            // STEP 1: Upload Resume
            // --------------------------------
            if (!resume) {
                setError("Please select a resume.");
                setLoading(false);
                return;
            }

            const fileData = new FormData();
            fileData.append("file", resume);

            const uploadResponse = await api.post(
                "/api/files/upload",
                fileData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const resumeUrl = uploadResponse.data.data.url;

            console.log("Resume uploaded:", resumeUrl);

            // --------------------------------
            // STEP 2: Submit Referral
            // --------------------------------

            // Temporary employee ID.
            // We will replace this with the logged-in
            // employee ID after confirming the referral works.
            const employeeId = 3;

            const referralResponse = await api.post(
                `/api/recruitment/jobs/${id}/refer?employeeId=${employeeId}`,
                {
                    candidateName: form.candidateName,
                    candidateEmail: form.candidateEmail,
                    candidatePhone: form.candidatePhone,
                    resumeUrl: resumeUrl,
                    experienceYears: parseInt(experienceYears) || 0,
                    experienceMonths: parseInt(experienceMonths) || 0,
                }
            );

            console.log("Referral response:", referralResponse.data);

            setSuccess("Candidate referred successfully!");

            setTimeout(() => {
                router.push(`/employee/jobs/details?id=${id}`);
            }, 1500);

        } catch (err) {
            console.error("Referral error:", err);
            console.error("Backend response body:", JSON.stringify(err.response?.data, null, 2));
            console.error("Backend response status:", err.response?.status);

            setError(
                err.response?.data?.message ||
                "Failed to submit referral."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-slate-50 dark:bg-transparent">

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="mb-6 text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
                ← Back to Job
            </button>

            {/* Referral Card */}
            <div className="bg-white dark:bg-[#151d2d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-8 max-w-2xl">

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Refer a Person
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Refer someone for this job opening.
                </p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg mb-5">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    {/* Candidate Name */}
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Candidate Name</label>

                        <input
                            type="text"
                            name="candidateName"
                            value={form.candidateName}
                            onChange={(e) => {
                                const value = e.target.value;

                                // Allow only letters and spaces
                                if (/^[A-Za-z ]*$/.test(value)) {
                                    handleChange(e);
                                }
                            }}
                            required
                            placeholder="candidate name"
                            className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Candidate Email */}
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">
                            Candidate Email
                        </label>

                        <input
                            type="email"
                            name="candidateEmail"
                            value={form.candidateEmail}
                            onChange={handleChange}
                            required
                            placeholder="Enter candidate email"
                            className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Candidate Phone */}
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Candidate Phone</label>

                        <input
                            type="tel"
                            name="candidatePhone"
                            value={form.candidatePhone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");

                                if (value.length <= 10) {
                                    handleChange({
                                        target: {
                                            name: "candidatePhone",
                                            value: value,
                                        },
                                    });
                                }
                            }}
                            required
                            maxLength={10}
                            placeholder="Enter candidate phone"
                            className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/*expierence*/}
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">
                            Experience
                        </label>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={experienceYears}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setExperienceYears(value);
                                    }}
                                    placeholder="Years"
                                    required
                                    className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Years</p>
                            </div>

                            <div className="flex-1">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={experienceMonths}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, "");

                                        if (value !== "" && Number(value) > 11) {
                                            value = "11";
                                        }

                                        setExperienceMonths(value);
                                    }}
                                    placeholder="Months"
                                    required
                                    className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Months</p>
                            </div>
                        </div>
                    </div>

                    {/* Resume */}
                    <div>
                        <label className="block font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Resume</label>

                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            required
                            className="w-full bg-white dark:bg-[#0f1522] border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                        />

                        {resume && (
                            <p className="text-sm text-gray-500 mt-2">
                                Selected: {resume.name}
                            </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                            Allowed: PDF, DOC, DOCX
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Submit Referral"}
                    </button>

                </form>
            </div>
        </div>
    );
}

export default function ReferPerson() {
    return (
        <Suspense fallback={<div className="min-h-screen p-8 bg-slate-50">Loading referral form...</div>}>
            <ReferPersonContent />
        </Suspense>
    );
}
