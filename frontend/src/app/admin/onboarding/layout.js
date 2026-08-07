'use client';
import { useRouter, usePathname } from 'next/navigation';

const SUB_NAV = [
    { key: '/admin/onboarding', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: '/admin/onboarding/employees', label: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { key: '/admin/onboarding/document-requests', label: 'Document Requests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: '/admin/onboarding/checklist', label: 'Checklist', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { key: '/admin/onboarding/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: '/admin/onboarding/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

function NavIcon({ path }) {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={path} />
        </svg>
    );
}

export default function OnboardingLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Secondary sidebar */}
            <div style={{
                width: '190px', flexShrink: 0, background: 'var(--card-bg)',
                borderRadius: '12px', border: '1px solid var(--card-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '10px',
                position: 'sticky', top: '20px',
            }}>
                {SUB_NAV.map(item => {
                    const bestMatch = SUB_NAV.reduce((best, nav) => {
                        if (pathname === nav.key || pathname.startsWith(nav.key + '/')) {
                            if (!best || nav.key.length > best.length) {
                                return nav.key;
                            }
                        }
                        return best;
                    }, null);
                    
                    const active = item.key === bestMatch;
                    
                    return (
                        <div
                            key={item.key}
                            onClick={() => router.push(item.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                                marginBottom: '2px',
                                background: active ? '#eef2ff' : 'transparent',
                                color: active ? '#1e293b' : '#64748b',
                                borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                                fontSize: '13px', fontWeight: active ? '700' : '400',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <NavIcon path={item.icon} />
                            {item.label}
                        </div>
                    );
                })}
            </div>

            {/* Page content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {children}
            </div>
        </div>
    );
}