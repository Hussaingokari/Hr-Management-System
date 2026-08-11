'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Clock, FileText, CheckCircle, Users, Activity, TrendingUp, ChevronRight } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `about ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const ACTIVITY_ICON = {
  PENDING_SUMMARY: <Clock size={18} className="text-amber-600 dark:text-amber-400" />,
  DOCUMENT_UPLOADED: <FileText size={18} className="text-blue-600 dark:text-blue-400" />,
  ONBOARDING_COMPLETED: <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />,
};

export default function OnboardingDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/onboarding/dashboard-summary');
      setData(res.data?.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="p-20 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  const STATS = [
    {
      label: 'Total Employees',
      value: data.totalEmployees,
      sub: 'All time',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      icon: <Users size={20} className="text-indigo-600 dark:text-indigo-400" />,
    },
    {
      label: 'Pending Onboarding',
      value: data.pendingOnboarding,
      sub: 'In progress',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      icon: <Clock size={20} className="text-amber-600 dark:text-amber-400" />,
    },
    {
      label: 'Completed Onboarding',
      value: data.completedOnboarding,
      sub: 'Fully onboarded',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      icon: <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: 'Pending Doc Verifications',
      value: data.pendingDocVerifications,
      sub: 'Awaiting review',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      icon: <FileText size={20} className="text-rose-600 dark:text-rose-400" />,
    },
  ];

  const QUICK_ACTIONS = [
    { label: 'View Employees', route: '/admin/onboarding/employees' },
    { label: 'Review Documents', route: '/admin/onboarding/document-requests' },
    { label: 'View Checklists', route: '/admin/onboarding/checklist' },
    { label: 'Reports', route: '/admin/onboarding/reports' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
          HR Dashboard
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          Welcome back. Here's your onboarding overview.
        </p>
      </div>

      {/* Stat Cards - Increased size & padding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {s.label}
              </span>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                {s.icon}
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">
                {s.value}
              </div>
              <div className="text-xs font-medium text-slate-400 dark:text-slate-500">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-5">
            <div className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" /> Recent Activity
            </div>
            <button
              onClick={() => router.push('/admin/onboarding/notifications')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
            >
              View all
            </button>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.map((item, i) => (
                <div
                  key={i}
                  className={`flex gap-3.5 p-3.5 rounded-xl items-start transition ${i === 0
                      ? 'bg-slate-50 dark:bg-slate-800/60'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 mt-0.5">
                    {ACTIVITY_ICON[item.type] || <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {timeAgo(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs h-fit space-y-4">
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
            Quick Actions
          </div>
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => router.push(a.route)}
              className="w-full flex justify-between items-center p-3.5 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition shadow-2xs group"
            >
              <span>{a.label}</span>
              <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}