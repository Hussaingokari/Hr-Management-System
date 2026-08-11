'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SendOfferLetterForm from '@/components/layout/SendOfferLetterForm';
import { ChevronRight, Send } from 'lucide-react';

export default function OfferLetterPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const token = sessionStorage.getItem('accessToken');
            const userStr = sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userRole = user?.role;

            if (!token) {
                router.push('/login');
                return;
            }
            if (
                userRole?.toLowerCase() !== 'admin' &&
                userRole?.toLowerCase() !== 'hr'
            ) {
                router.push('/admin/dashboard');
                return;
            }
            setIsAuthenticated(true);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full" />
                    <p className="text-sm font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="space-y-6 text-slate-900 dark:text-slate-100">
            {/* Breadcrumb Navigation */}
            <nav
                aria-label="Breadcrumb"
                className="flex items-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 gap-1.5 sm:gap-2 flex-wrap"
            >
                <Link
                    href="/admin/dashboard"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    Dashboard
                </Link>
                <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
                <Link
                    href="/admin/onboarding"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    Onboarding
                </Link>
                <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    Send Offer Letter
                </span>
            </nav>

            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Send size={22} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Send Offer Letter
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 pl-1">
                        Issue and dispatch offer letters to selected candidates for onboarding.
                    </p>
                </div>
            </div>

            {/* Form rendered directly without double wrapping */}
            <div className="w-full">
                <SendOfferLetterForm />
            </div>
        </div>
    );
}