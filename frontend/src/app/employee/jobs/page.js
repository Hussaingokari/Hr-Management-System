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
            <div className="p-6 text-gray-500 dark:text-gray-400">
                Loading job openings...
            </div>
        );
    }

    return (
        <div className="p-6">

            {/* ========================= */}
            {/* JOB OPENINGS */}
            {/* ========================= */}

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Job Openings
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mb-8">
                View all job openings posted by HR.
            </p>

            <div className="space-y-4">

                {jobs.length === 0 ? (
                    <div className="bg-white dark:bg-[#151d2d] rounded-xl shadow p-6 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-800/80">
                        No job openings available.
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="bg-white dark:bg-[#151d2d] rounded-xl shadow p-6 border border-gray-100 dark:border-slate-800/80 transition-all hover:border-emerald-500/30 dark:hover:border-emerald-500/30"
                        >

                            {/* JOB TITLE */}

                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">
                                {job.title}
                            </h2>

                            {/* JOB DETAILS */}

                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                                <span className="font-medium dark:text-slate-300">Department:</span> {job.department}
                            </p>

                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                                <span className="font-medium dark:text-slate-300">Location:</span> {job.location}
                            </p>

                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                                <span className="font-medium dark:text-slate-300">Employment Type:</span> {job.employmentType}
                            </p>

                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                                <span className="font-medium dark:text-slate-300">Experience:</span> {job.experienceRequired}
                            </p>

                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                <span className="font-medium dark:text-slate-300">Salary:</span> {job.salaryRange}
                            </p>

                            {/* VIEW DETAILS */}

                            <button
                                onClick={() =>
                                    router.push(`/employee/jobs/details?id=${job.id}`)
                                }
                                className="text-[#10b981] dark:text-[#ccf000] hover:underline font-semibold"
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