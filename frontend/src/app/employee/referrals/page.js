"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function MyReferrals() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleViewResume = async (e, resumeUrl) => {
        e.preventDefault();
        try {
            const url = resumeUrl.startsWith('http') ? new URL(resumeUrl).pathname : resumeUrl;
            const res = await api.get(url, { responseType: 'blob' });
            const contentType = res.headers['content-type'] || 'application/pdf';
            const blob = new Blob([res.data], { type: contentType });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (err) {
            console.error(err);
            alert('Failed to open resume');
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
            setLoading(false);
        }
    };

    // =========================
    // LOAD REFERRALS
    // =========================
    useEffect(() => {
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
                Loading referrals...
            </div>
        );
    }

    return (
        <div>

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                My Referrals
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mb-8">
                Track the candidates you have referred.
            </p>

            {/* ========================= */}
            {/* NO REFERRALS */}
            {/* ========================= */}

            {referrals.length === 0 ? (

                <div className="bg-white dark:bg-[#151d2d] rounded-xl shadow p-6 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-800/80">
                    You have not referred any candidates yet.
                </div>

            ) : (

                <div className="space-y-4">

                    {referrals.map((referral) => {

                        const statusStyle =
                            getStatusStyle(referral.status);

                        return (

                            <div
                                key={referral.id}
                                className="bg-white dark:bg-[#151d2d] rounded-xl shadow p-6 border border-gray-100 dark:border-slate-800/80"
                            >

                                {/* ========================= */}
                                {/* NAME + STATUS */}
                                {/* ========================= */}

                                <div className="flex justify-between items-start mb-4">

                                    <div>

                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {referral.candidateName}
                                        </h3>

                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Job: {referral.jobTitle}
                                        </p>

                                    </div>

                                    <span
                                        style={{
                                            ...statusStyle,
                                            padding: "5px 12px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        {getStatusText(referral.status)}
                                    </span>

                                </div>

                                {/* ========================= */}
                                {/* CANDIDATE DETAILS */}
                                {/* ========================= */}

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">

                                    <p>
                                        <strong className="dark:text-slate-400">Email:</strong>{" "}
                                        {referral.candidateEmail}
                                    </p>

                                    <p>
                                        <strong className="dark:text-slate-400">Phone:</strong>{" "}
                                        {referral.candidatePhone}
                                    </p>

                                    <p>
                                        <strong className="dark:text-slate-400">Experience:</strong>{" "}
                                        {referral.experienceYears ?? 0}{" "}
                                        {(referral.experienceYears ?? 0) === 1
                                            ? "year"
                                            : "years"}{" "}
                                        {referral.experienceMonths ?? 0}{" "}
                                        {(referral.experienceMonths ?? 0) === 1
                                            ? "month"
                                            : "months"}
                                    </p>

                                </div>

                                {/* ========================= */}
                                {/* RESUME */}
                                {/* ========================= */}

                                {referral.resumeUrl && (

                                    <div className="mt-3">

                                        <a
                                            href="#"
                                            onClick={(e) => handleViewResume(e, referral.resumeUrl)}
                                            className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline"
                                        >
                                            📄 View Resume →
                                        </a>

                                    </div>

                                )}

                                {/* ========================= */}
                                {/* STATUS MESSAGE */}
                                {/* ========================= */}

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">

                                    {/* PENDING */}

                                    {referral.status === "APPLIED" && (

                                        <p className="text-sm text-yellow-600">
                                            ⏳ Your referral is waiting for HR review.
                                        </p>

                                    )}

                                    {/* APPROVED */}

                                    {referral.status === "SHORTLISTED" && (

                                        <p className="text-sm text-green-600 font-semibold">
                                            ✓ HR has approved this candidate.
                                        </p>

                                    )}

                                    {/* REJECTED */}

                                    {referral.status === "REJECTED" && (

                                        <p className="text-sm text-red-600 font-semibold">
                                            ✕ HR has rejected this candidate.
                                        </p>

                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

        </div>
    );
}