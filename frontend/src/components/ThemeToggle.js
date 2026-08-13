'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`fixed bottom-8 right-8 w-12 h-12 ${className}`} />;
  }

  // Hide the floating toggle on landing page and dashboard routes
  if (pathname === '/' || pathname?.startsWith('/admin') || pathname?.startsWith('/employee')) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center shadow-lg border border-slate-100 dark:border-[#334155] text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000] transition-all z-50 hover:scale-110 ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
}
