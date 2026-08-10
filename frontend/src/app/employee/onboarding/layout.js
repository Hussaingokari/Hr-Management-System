'use client';
import { useRouter, usePathname } from 'next/navigation';

const SUB_NAV = [
    { key: '/employee/onboarding', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: '/employee/onboarding/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: '/employee/onboarding/documents', label: 'My Documents', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    { key: '/employee/onboarding/checklist', label: 'Checklist', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { key: '/employee/onboarding/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
];

function NavIcon({ path }) {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={path} />
        </svg>
    );
}

export default function EmployeeOnboardingLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="w-full md:w-[260px] shrink-0 bg-white dark:bg-[#151d2d] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-3 md:p-4 md:sticky md:top-5 flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-1 no-scrollbar">
                {SUB_NAV.map(item => {
                    const active = pathname === item.key;
                    return (
                        <div
                            key={item.key}
                            onClick={() => router.push(item.key)}
                            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap ${
                                active 
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-slate-900 dark:text-indigo-400 font-bold' 
                                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal'
                            }`}
                        >
                            <NavIcon path={item.icon} />
                            <span className="text-sm md:text-[15px]">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 min-w-0 w-full">
                {children}
            </div>
        </div>
    );
}