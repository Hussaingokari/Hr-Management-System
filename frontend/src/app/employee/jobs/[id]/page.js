"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JobDetails() {
    const params = useParams();
    const router = useRouter();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!params.id) return;

        fetch(`http://localhost:8080/api/recruitment/jobs/${params.id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to fetch job details");
                }

                return res.json();
            })
            .then((data) => {
                setJob(data.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setError("Unable to load job details");
                setLoading(false);
            });
    }, [params.id]);

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
                onClick={() => router.back()}
                className="mb-6 text-blue-600 hover:underline"
            >
                ← Back to Jobs
            </button>

            {/* Job Details Card */}
            <div className="bg-white rounded-xl shadow p-8 max-w-4xl">

                <h1 className="text-3xl font-bold mb-2">
                    {job.title}
                </h1>

                <p className="text-gray-500 mb-6">
                    {job.department}
                </p>

                {/* Job Information */}
                <div className="grid grid-cols-2 gap-6 mb-8">

                    <div>
                        <p className="font-semibold">Location</p>
                        <p>{job.location || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold">Employment Type</p>
                        <p>{job.employmentType || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold">Experience Required</p>
                        <p>{job.experienceRequired || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold">Salary</p>
                        <p>{job.salaryRange || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold">Application Deadline</p>
                        <p>{job.applicationDeadline || "Not specified"}</p>
                    </div>

                    <div>
                        <p className="font-semibold">Status</p>
                        <p>{job.status}</p>
                    </div>

                </div>

                <hr className="my-6" />

                {/* Description */}
                <div className="mb-6">

                    <h2 className="text-xl font-bold mb-2">
                        Job Description
                    </h2>

                    <p className="text-gray-700 whitespace-pre-line">
                        {job.description || "No description provided."}
                    </p>

                </div>

                {/* Requirements */}
                <div className="mb-6">

                    <h2 className="text-xl font-bold mb-2">
                        Requirements
                    </h2>

                    <p className="text-gray-700 whitespace-pre-line">
                        {job.requirements || "No requirements provided."}
                    </p>

                </div>

                {/* Apply Button */}
                <button
                    onClick={() => router.push(`/employee/jobs/${params.id}/refer`)}
                    className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600"
                >
                    Refer a Person
                </button>

            </div>

        </div>
    );
}