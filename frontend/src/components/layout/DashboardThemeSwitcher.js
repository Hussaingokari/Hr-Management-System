'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function DashboardThemeSwitcher({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-[130px] h-[36px] ${className}`} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`flex items-center p-1 rounded-full  bg-[#f1f5f9] dark:bg-[#1E293B] ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] cursor-pointer font-bold transition-all duration-300 ${
          !isDark 
            ? 'bg-white text-slate-800 shadow-sm' 
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-[11px] font-bold transition-all duration-300 ${
          isDark 
            ? 'bg-[#0f172a] text-white shadow-sm shadow-black/20' 
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        Dark
      </button>
    </div>
  );
}
