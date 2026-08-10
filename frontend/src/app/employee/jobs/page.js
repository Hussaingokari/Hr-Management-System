"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function JobOpenings() {
    const [jobs, setJobs] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReferrals, setLoadingReferrals] = useState(true);

    const router = useRouter();

    // =========================
    // GET JOBS
    // =========================
    const fetchJobs = async () => {
        try {
            const res = await api.get("/api/recruitment/jobs");

            setJobs(
                res.data?.data?.content ||
                res.data?.data ||
                []
            );
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // GET MY REFERRALS
    // =========================
    const fetchMyReferrals = async () => {
        try {
            const res = await api.get("/api/recruitment/my-referrals");

            setReferrals(
                res.data?.data?.content ||
                res.data?.data ||
                []
            );
        } catch (error) {
            console.error("Error fetching referrals:", error);
        } finally {
            setLoadingReferrals(false);
        }
    };

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        fetchJobs();
        fetchMyReferrals();
    }, []);

    // =========================
    // STATUS TEXT
    // =========================
    const getStatusText = (status) => {
        if (status === "APPLIED") {
            return "Pending";
        }

        if (status === "SHORTLISTED") {
            return "Approved";
        }

        if (status === "REJECTED") {
            return "Rejected";
        }

        return status || "Pending";
    };

    // =========================
    // STATUS STYLE
    // =========================
    const getStatusStyle = (status) => {
        if (status === "SHORTLISTED") {
            return {
                background: "#dcfce7",
                color: "#15803d",
            };
        }

        if (status === "REJECTED") {
            return {
                background: "#fee2e2",
                color: "#dc2626",
            };
        }

        return {
            background: "#fef3c7",
            color: "#d97706",
        };
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="p-6 text-gray-500">
                Loading job openings...
            </div>
        );
    }

    return (
        <div className="p-6">

            {/* ========================= */}
            {/* JOB OPENINGS */}
            {/* ========================= */}

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Job Openings
            </h1>

            <p className="text-gray-500 mb-8">
                View all job openings posted by HR.
            </p>

            <div className="space-y-4">

                {jobs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                        No job openings available.
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="bg-white rounded-xl shadow p-6 border border-gray-100"
                        >

                            {/* JOB TITLE */}

                            <h2 className="text-xl font-bold text-slate-900 mb-3">
                                {job.title}
                            </h2>

                            {/* JOB DETAILS */}

                            <p className="text-gray-600 mb-1">
                                Department: {job.department}
                            </p>

                            <p className="text-gray-600 mb-1">
                                Location: {job.location}
                            </p>

                            <p className="text-gray-600 mb-1">
                                Employment Type: {job.employmentType}
                            </p>

                            <p className="text-gray-600 mb-1">
                                Experience: {job.experienceRequired}
                            </p>

                            <p className="text-gray-600 mb-4">
                                Salary: {job.salaryRange}
                            </p>

                            {/* VIEW DETAILS */}

                            <button
                                onClick={() =>
                                    router.push(`/employee/jobs/details?id=${job.id}`)
                                }
                                className="text-blue-600 hover:underline font-semibold"
                            >
                                View Details →
                            </button>

                        </div>
                    ))
                )}

            </div>

        </div>
    );
}