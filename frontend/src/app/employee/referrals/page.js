"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function MyReferrals() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div className="p-6 text-gray-500">
                Loading referrals...
            </div>
        );
    }

    return (
        <div>

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                My Referrals
            </h1>

            <p className="text-gray-500 mb-8">
                Track the candidates you have referred.
            </p>

            {/* ========================= */}
            {/* NO REFERRALS */}
            {/* ========================= */}

            {referrals.length === 0 ? (

                <div className="bg-white rounded-xl shadow p-6 text-gray-500">
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
                                className="bg-white rounded-xl shadow p-6 border border-gray-100"
                            >

                                {/* ========================= */}
                                {/* NAME + STATUS */}
                                {/* ========================= */}

                                <div className="flex justify-between items-start mb-4">

                                    <div>

                                        <h3 className="text-lg font-bold text-slate-900">
                                            {referral.candidateName}
                                        </h3>

                                        <p className="text-sm text-gray-500">
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

                                <div className="space-y-2 text-sm text-gray-600">

                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {referral.candidateEmail}
                                    </p>

                                    <p>
                                        <strong>Phone:</strong>{" "}
                                        {referral.candidatePhone}
                                    </p>

                                    <p>
                                        <strong>Experience:</strong>{" "}
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
                                            href={
                                                referral.resumeUrl.startsWith("http")
                                                    ? referral.resumeUrl
                                                    : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${referral.resumeUrl}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 font-semibold text-sm hover:underline"
                                        >
                                            📄 View Resume →
                                        </a>

                                    </div>

                                )}

                                {/* ========================= */}
                                {/* STATUS MESSAGE */}
                                {/* ========================= */}

                                <div className="mt-4 pt-4 border-t border-gray-100">

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