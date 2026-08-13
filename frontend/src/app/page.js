'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = !mounted ? true : resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Return a simple div on SSR to prevent Dark Reader from breaking hydration
  if (!mounted) {
    return <div className="min-h-screen bg-[#010b1e]" suppressHydrationWarning />;
  }

  // ── CSS variable map – drives ALL theme colours via inline style ──
  const theme = isDark
    ? {
      '--bg': '#010b1e',
      '--glow-l': 'rgba(0,48,128,0.25)',
      '--glow-r': 'rgba(0,80,192,0.15)',
      '--card-bg': 'rgba(6, 28, 75, 0.55)',
      '--card-border': 'rgba(30, 80, 160, 0.50)',
      '--card-shadow': '0 8px 32px rgba(0, 20, 50, 0.8)',
      '--card-glow': 'rgba(0, 170, 255, 0.25)',
      '--hrms': '#ffffff',
      '--company': '#6b84a0',
      '--workspace': '#33aaff',
      '--tagline': '#4b729e',
      '--dot': '#33aaff',
      '--dot-shadow': '0 0 8px #33aaff',
      '--label': '#6b84a0',
      '--portal-bg': 'rgba(12, 40, 90, 0.50)',
      '--portal-border': 'rgba(40, 90, 180, 0.60)',
      '--portal-hover-bg': 'rgba(20, 55, 120, 0.65)',
      '--portal-hover-border': 'rgba(60, 130, 240, 1)',
      '--icon-box-bg': 'transparent',
      '--icon-box-border': 'transparent',
      '--emp-icon': '#00aaff',
      '--admin-icon': '#00aaff',
      '--portal-title': '#ffffff',
      '--portal-sub': '#7c94b0',
      '--chevron': '#00aaff',
      '--footer-bg': 'rgba(10, 35, 85, 0.65)',
      '--footer-border': 'rgba(0, 120, 255, 0.4)',
      '--footer-shadow': '0 0 15px rgba(0, 150, 255, 0.3)',
      '--footer-text': '#8ca5c4',
      '--footer-sub': '#4b688c',
      '--toggle-bg': '#020b1e',
      '--toggle-border': 'rgba(26,58,96,0.60)',
      '--toggle-icon': '#5a7098',
      '--map-dot': '#2a9fff',
      '--map-line': '#1a7fff',
      '--map-node': '#4ab4ff',
      '--bldg-fill': '#040f26',
      '--bldg-stroke': '#0a3070',
      '--bldg-w1': '#2060d0',
      '--bldg-w2': '#1040a0',
      '--bldg-w3': '#0d3580',
      '--stream': '#00aaff',
      '--grid-color': 'rgba(0,140,255,0.06)',
      '--particle': '#3aa0ff',
      '--map-op': '0.18',
      '--sky-op': '0.22',
      '--grid-op': '0.65',
      '--particle-op': '0.45',
    }
    : {
      '--bg': '#daeaf8',
      '--glow-l': 'rgba(184,216,248,0.60)',
      '--glow-r': 'rgba(200,228,255,0.50)',
      '--card-bg': 'rgba(255,255,255,0.95)',
      '--card-border': 'rgba(200,221,240,1)',
      '--card-shadow': '0 8px 40px rgba(0,80,180,0.10), 0 2px 8px rgba(0,60,140,0.06)',
      '--card-glow': 'rgba(176,208,240,0.20)',
      '--hrms': '#0a1e40',
      '--company': '#4060a0',
      '--workspace': '#0055cc',
      '--tagline': '#5575a0',
      '--dot': '#0055cc',
      '--dot-shadow': 'none',
      '--label': '#3a5580',
      '--portal-bg': 'rgba(255,255,255,1)',
      '--portal-border': 'rgba(200,221,240,1)',
      '--portal-hover-bg': 'rgba(240,247,255,1)',
      '--portal-hover-border': 'rgba(128,176,224,1)',
      '--icon-box-bg': '#eef5ff',
      '--icon-box-border': 'rgba(200,221,240,1)',
      '--emp-icon': '#22a855',
      '--admin-icon': '#0055cc',
      '--portal-title': '#0a1e40',
      '--portal-sub': '#5575a0',
      '--chevron': '#0055cc',
      '--footer-bg': '#eef5ff',
      '--footer-border': 'rgba(200,221,240,1)',
      '--footer-shadow': 'none',
      '--footer-text': '#5070a0',
      '--footer-sub': '#7090b8',
      '--toggle-bg': '#ffffff',
      '--toggle-border': 'rgba(200,221,240,1)',
      '--toggle-icon': '#4070b0',
      '--map-dot': '#90c0e8',
      '--map-line': '#a8cce0',
      '--map-node': '#70a8d8',
      '--bldg-fill': '#cce0f5',
      '--bldg-stroke': '#9ac0e0',
      '--bldg-w1': '#aed4f0',
      '--bldg-w2': '#c8e2f8',
      '--bldg-w3': '#d8eeff',
      '--stream': '#60a8d8',
      '--grid-color': 'rgba(0,100,200,0.06)',
      '--particle': '#70b8e8',
      '--map-op': '0.55',
      '--sky-op': '0.60',
      '--grid-op': '0.50',
      '--particle-op': '0.50',
    };

  const cssVars = Object.entries(theme).map(([k, v]) => `${k}: ${v};`).join('\n');

  return (
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ backgroundColor: 'var(--bg)', transition: 'background-color 0.5s' }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{
        __html: `
        :root {
          ${cssVars}
        }
      `}} />

      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {isDark ? (
          <Image src="/dark-bg.jpg" fill className="object-cover" alt="Dark theme background" priority />
        ) : (
          <Image src="/light-bg.png" fill className="object-cover" alt="Light theme background" priority />
        )}
      </div>

      {/* ── CENTRAL CARD ── */}
      <div className="w-full max-w-[420px] relative z-10 backdrop-blur-md px-10 pt-9 pb-7 rounded-[22px] flex flex-col items-center mx-4"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          transition: 'background-color 0.5s, border-color 0.5s, box-shadow 0.5s',
        }}>

        {/* Inner top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 blur-[35px] rounded-full pointer-events-none"
          style={{ background: 'var(--card-glow)' }} />

        {/* Logo */}
        <div className="relative w-[240px] h-[138px] mb-1 shrink-0">
          <Image src="/logo.png" alt="Saiteja Infotech" fill className="object-contain" priority />
        </div>

        {/* HRMS */}
        <h1 className="text-[24px] font-bold mb-1 tracking-wide" style={{ color: 'var(--hrms)', transition: 'color 0.5s' }}>HRMS</h1>

        {/* Company name */}
        <p className="text-[10px] font-medium mb-4 tracking-[0.18em] uppercase text-center"
          style={{ color: 'var(--company)', transition: 'color 0.5s' }}>
          SAITEJA INFOTECH PRIVATE LIMITED
        </p>

        {/* Divider */}
        <div className="w-[30px] h-[2px] rounded-full mb-5"
          style={{ background: 'linear-gradient(to right, #0070d0, #00b4ff)' }} />

        {/* Workspace */}
        <div className="flex flex-col items-center mb-7 w-full">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2"
            style={{ color: 'var(--workspace)', transition: 'color 0.5s' }}>
            WORKSPACE
          </p>
          <div className="flex items-center gap-2.5 text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--tagline)', transition: 'color 0.5s' }}>
            <span>STREAMLINE</span>
            <span className="w-[4px] h-[4px] rounded-full inline-block"
              style={{ backgroundColor: 'var(--dot)', boxShadow: 'var(--dot-shadow)' }} />
            <span>MANAGE</span>
            <span className="w-[4px] h-[4px] rounded-full inline-block"
              style={{ backgroundColor: 'var(--dot)', boxShadow: 'var(--dot-shadow)' }} />
            <span>EMPOWER</span>
          </div>
        </div>

        {/* Select Portal label */}
        <p className="text-[9.5px] font-bold mb-2.5 w-full text-left uppercase tracking-widest"
          style={{ color: 'var(--label)', transition: 'color 0.5s' }}>
          SELECT PORTAL
        </p>

        {/* Employee Portal Card */}
        <Link href="/login/employee" className="group w-full flex items-center gap-3.5 p-3.5 mb-3 rounded-[13px] cursor-pointer relative overflow-hidden transition-all duration-300"
          style={{ backgroundColor: 'var(--portal-bg)', border: '1px solid var(--portal-border)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--portal-hover-bg)'; e.currentTarget.style.borderColor = 'var(--portal-hover-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--portal-bg)'; e.currentTarget.style.borderColor = 'var(--portal-border)'; }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 z-10 transition-all duration-300"
            style={{ backgroundColor: 'var(--icon-box-bg)', border: '1px solid var(--icon-box-border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
              stroke="currentColor" className="stroke-[1.5]" style={{ color: 'var(--emp-icon)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1 text-left z-10">
            <div className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--portal-title)', transition: 'color 0.5s' }}>Employee Portal</div>
            <div className="text-[10px]" style={{ color: 'var(--portal-sub)', transition: 'color 0.5s' }}>Access your personal dashboard</div>
          </div>
          <div className="w-5 h-5 flex items-center justify-center group-hover:translate-x-1 transition-transform z-10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              className="stroke-[2.5]" style={{ color: 'var(--chevron)' }}>
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>

        {/* HR / Admin Portal Card */}
        <Link href="/login/admin" className="group w-full flex items-center gap-3.5 p-3.5 mb-6 rounded-[13px] cursor-pointer relative overflow-hidden transition-all duration-300"
          style={{ backgroundColor: 'var(--portal-bg)', border: '1px solid var(--portal-border)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--portal-hover-bg)'; e.currentTarget.style.borderColor = 'var(--portal-hover-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--portal-bg)'; e.currentTarget.style.borderColor = 'var(--portal-border)'; }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 z-10 transition-all duration-300"
            style={{ backgroundColor: 'var(--icon-box-bg)', border: '1px solid var(--icon-box-border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
              stroke="currentColor" className="stroke-[1.5]" style={{ color: 'var(--admin-icon)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="flex-1 text-left z-10">
            <div className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--portal-title)', transition: 'color 0.5s' }}>HR / Admin Portal</div>
            <div className="text-[10px]" style={{ color: 'var(--portal-sub)', transition: 'color 0.5s' }}>Manage system and personnel</div>
          </div>
          <div className="w-5 h-5 flex items-center justify-center group-hover:translate-x-1 transition-transform z-10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              className="stroke-[2.5]" style={{ color: 'var(--chevron)' }}>
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>

        {/* Footer */}
        <div className="flex flex-col items-center w-full text-center">
          <div className="py-2 px-5 rounded-[8px] mb-2"
            style={{ backgroundColor: 'var(--footer-bg)', border: '1px solid var(--footer-border)', boxShadow: 'var(--footer-shadow)', transition: 'all 0.5s' }}>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap"
              style={{ color: 'var(--footer-text)', transition: 'color 0.5s' }}>
              © 2025 SAITEJA INFOTECH PRIVATE LIMITED.
            </p>
          </div>
          <p className="text-[7.5px] font-medium uppercase tracking-[0.18em]"
            style={{ color: 'var(--footer-sub)', transition: 'color 0.5s' }}>
            ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      {/* ── THEME TOGGLE ── */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-7 right-7 w-[46px] h-[46px] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-50 cursor-pointer group"
        style={{
          backgroundColor: 'var(--toggle-bg)',
          border: '1px solid var(--toggle-border)',
          boxShadow: isDark ? '0 0 10px rgba(0,40,120,0.35)' : '0 2px 8px rgba(0,60,150,0.10)',
        }}
        aria-label="Toggle theme"
      >
        {isDark ? (
          /* Sun – click to go light */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            className="stroke-[1.8] transition-colors" style={{ color: 'var(--toggle-icon)' }}>
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
          </svg>
        ) : (
          /* Moon – click to go dark */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            className="stroke-[1.8] transition-colors" style={{ color: 'var(--toggle-icon)' }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

    </div>
  );
}