"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

function JobDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        api.get(`/api/recruitment/jobs/${id}`)
            .then((res) => {
                setJob(res.data.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setError("Unable to load job details");
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="p-8">
                <p>Loading job details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="p-8">
                <p>Job not found.</p>
            </div>
        );
    }

    return (
        <div className="p-8">

            {/* Back Button */}
            <button
                onClick={() => router.push("/employee/jobs")}
                className="mb-6 text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
                ← Back to Jobs
            </button>

            {/* Job Details Card */}
            <div className="bg-white dark:bg-[#151d2d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/80 p-8 max-w-4xl">

                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                    {job.title}
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {job.department}
                </p>

                {/* Job Information */}
                <div className="grid grid-cols-2 gap-6 mb-8 text-slate-700 dark:text-slate-300">

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Location</p>
                        <p>{job.location || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Employment Type</p>
                        <p>{job.employmentType || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Experience Required</p>
                        <p>{job.experienceRequired || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Salary</p>
                        <p>{job.salaryRange || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Application Deadline</p>
                        <p>{job.applicationDeadline || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">Status</p>
                        <p>{job.status}</p>
                    </div>

                </div>

                <hr className="my-6 border-slate-100 dark:border-slate-800" />

                {/* Description */}
                <div className="mb-6">

                    <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                        Job Description
                    </h2>

                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {job.description || "No description provided."}
                    </p>

                </div>

                {/* Requirements */}
                <div className="mb-6">

                    <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                        Requirements
                    </h2>

                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {job.requirements || "No requirements provided."}
                    </p>

                </div>

                {/* Apply Button */}
                <button
                    onClick={() => router.push(`/employee/jobs/details/refer?id=${id}`)}
                    className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-sm dark:shadow-none"
                >
                    Refer a Person
                </button>

            </div>

        </div>
    );
}

export default function JobDetails() {
    return (
        <Suspense fallback={<div className="p-8">Loading job details...</div>}>
            <JobDetailsContent />
        </Suspense>
    );
}
