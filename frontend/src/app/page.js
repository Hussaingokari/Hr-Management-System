'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8fafc] transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-[100px] sm:blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white border border-slate-100 p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center transform transition-all duration-500 hover:scale-[1.01]">
        {/* Header */}
        <div className="w-16 h-16 rounded-[16px] bg-[#10b981] flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 relative group">
          <div className="absolute inset-0 bg-white/20 rounded-[16px] blur-md group-hover:blur-lg transition-all"></div>
          <span className="text-white text-3xl font-black tracking-tight relative z-10">H</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">HRMS</h1>
        <h2 className="text-[13px] font-semibold text-slate-500 mb-5 tracking-wide text-center uppercase">
          Saiteja Infotech Private Limited
        </h2>
        
        <div className="w-6 h-[2px] rounded-full bg-slate-200 mb-5"></div>
        
        <div className="flex flex-col items-center mb-8">
          <p className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 uppercase tracking-[0.35em] mb-2">
            Workspace
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium uppercase tracking-widest">
            <span>Streamline</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 "></span>
            <span>Manage</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 "></span>
            <span>Empower</span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 mb-4 w-full text-left uppercase tracking-wider">Select Portal</p>

        {/* Employee Card */}
        <Link
          href="/login/employee"
          className="group w-full flex items-center gap-5 p-4 mb-4 rounded-[16px] border border-slate-100 bg-white hover:border-emerald-500/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md "
        >
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#10b981] stroke-[2] stroke-linecap-round stroke-linejoin-round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-[#10b981] transition-colors">Employee Portal</div>
            <div className="text-[11px] font-medium text-slate-400 ">Access your personal dashboard</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:translate-x-1 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-400 group-hover:text-[#10b981] stroke-[2.5] stroke-linecap-round stroke-linejoin-round"><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </Link>

        {/* Admin Card */}
        <Link
          href="/login/admin"
          className="group w-full flex items-center gap-5 p-4 mb-8 rounded-[16px] border border-slate-100 bg-white hover:border-emerald-500/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md "
        >
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#10b981] stroke-[2] stroke-linecap-round stroke-linejoin-round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-[#10b981] transition-colors">HR / Admin Portal</div>
            <div className="text-[11px] font-medium text-slate-400 ">Manage system and personnel</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:translate-x-1 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-400 group-hover:text-[#10b981] stroke-[2.5] stroke-linecap-round stroke-linejoin-round"><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </Link>

        <div className="flex flex-col items-center mt-2 text-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            © 2026 Saiteja Infotech Private Limited.
          </p>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}