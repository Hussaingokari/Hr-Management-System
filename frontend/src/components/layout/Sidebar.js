'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'next-themes';
import { logout } from '@/store/authSlice';
import { 
  Home, Calendar, ClipboardList, CircleDollarSign, 
  Star, BadgeCheck, Bell, Settings, LogOut, ShieldCheck, Users, Wallet, GraduationCap, Send, FileText
} from 'lucide-react';

const EMP_MENU = [
  { key: '/employee/dashboard', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
  { key: '/employee/attendance', label: 'Attendance', icon: <Calendar size={18} strokeWidth={2} /> },
  { key: '/employee/leave', label: 'Leave Management', icon: <ClipboardList size={18} strokeWidth={2} /> },
  { key: '/employee/payslips', label: 'Payslips', icon: <CircleDollarSign size={18} strokeWidth={2} /> },
  { key: '/employee/performance', label: 'Performance', icon: <Star size={18} strokeWidth={2} /> },
  { key: '/employee/onboarding', label: 'Onboarding', icon: <BadgeCheck size={18} strokeWidth={2} /> },
  { key: '/employee/notifications', label: 'Notifications', icon: <Bell size={18} strokeWidth={2} /> },
];

const ADMIN_MENU = [
  { key: '/admin/dashboard', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
  { key: '/admin/employees', label: 'Employees', icon: <Users size={18} strokeWidth={2} /> },
  { key: '/admin/leave', label: 'Leave Management', icon: <ClipboardList size={18} strokeWidth={2} /> },
  { key: '/admin/payroll', label: 'Payroll', icon: <Wallet size={18} strokeWidth={2} /> },
  { key: '/admin/performance', label: 'Performance', icon: <Star size={18} strokeWidth={2} /> },
  { key: '/admin/training', label: 'Training', icon: <GraduationCap size={18} strokeWidth={2} /> },
  { key: '/admin/recruitment', label: 'Recruitment', icon: <ShieldCheck size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding', label: 'Onboarding', icon: <BadgeCheck size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/greetings', label: 'Send Greeting', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/offerletter', label: 'Send Offer Letter', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/interview', label: 'Send Interview', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/document-request', label: 'Document Request', icon: <FileText size={18} strokeWidth={2} /> },
  { key: '/admin/notifications', label: 'Notifications', icon: <Bell size={18} strokeWidth={2} /> },
];

export default function Sidebar({ role }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggleMobileSidebar', handleToggle);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggle);
  }, []);

  const menu = role === 'ADMIN' || role === 'HR' ? ADMIN_MENU : EMP_MENU;
  const settingsRoute = role === 'ADMIN' || role === 'HR'
    ? '/admin/settings'
    : '/employee/settings';

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const isItemActive = (key) => {
    if (pathname === key) return true;
    const allKeys = [...menu.map(m => m.key), settingsRoute];
    const bestMatch = allKeys.reduce((best, k) => {
      if (pathname === k || pathname.startsWith(k + '/')) {
        if (!best || k.length > best.length) {
          return k;
        }
      }
      return best;
    }, null);
    return key === bestMatch;
  };

  const navItemStyle = (key) => {
    const active = isItemActive(key);
    return {
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '12px 16px', borderRadius: '10px',
      cursor: 'pointer', marginBottom: '8px',
      background: active ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
      color: active ? '#ffffff' : '#94a3b8',
      border: active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
      fontSize: '13.5px', fontWeight: active ? '600' : '500',
      transition: 'all 0.2s ease',
      letterSpacing: '0.2px'
    };
  };

  // We only render the 1:1 image style on dark mode, otherwise fallback to standard light mode styling
  const sidebarBg = isDark ? '#0A0E17' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';

  return (
    <>
      {isMobileOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />
      )}
      <div className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`} style={{ 
        backgroundColor: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px',
              background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)', 
              borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
            }}>H</div>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: '18px', fontWeight: '800', lineHeight: 1.1, letterSpacing: '0.5px' }}>HRMS</div>
              <div style={{ color: isDark ? '#64748b' : '#64748b', fontSize: '10px', letterSpacing: '1px', marginTop: '3px', fontWeight: '700' }}>HR MANAGEMENT</div>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          {menu.map((item) => (
            <div
              key={item.key}
              onClick={() => { setIsMobileOpen(false); router.push(item.key); }}
              style={{...navItemStyle(item.key), position: 'relative'}}
              onMouseEnter={e => {
                if (!isItemActive(item.key)) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
              }}
              onMouseLeave={e => {
                if (!isItemActive(item.key)) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ color: isItemActive(item.key) ? '#34d399' : '#64748b', display: 'flex' }}>
                {item.icon}
              </div>
              <span style={{ color: isItemActive(item.key) ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#475569') }}>
                {item.label}
              </span>
              
              {/* Purple Badge for Notifications exactly like the image */}
              {item.badge && (
                <div style={{ 
                  position: 'absolute', right: '12px',
                  background: '#8b5cf6', color: 'white',
                  fontSize: '11px', fontWeight: '700',
                  width: '20px', height: '20px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
                }}>
                  {item.badge}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Decorative Mountain Vector exactly matching the user's image */}
        {isDark && (
          <div style={{ position: 'relative', flex: 1, minHeight: '100px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, #0A0E17, transparent)', zIndex: 1 }} />
            <svg width="100%" height="100%" viewBox="0 0 240 200" style={{ position: 'absolute', bottom: 0, opacity: 1 }} preserveAspectRatio="xMidYMax slice">
              <defs>
                <linearGradient id="skyGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0A0E17" />
                  <stop offset="60%" stopColor="#1e183a" />
                  <stop offset="100%" stopColor="#301c4d" />
                </linearGradient>
                <linearGradient id="mntBack" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#432868" />
                  <stop offset="100%" stopColor="#251442" />
                </linearGradient>
                <linearGradient id="mntMid" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2b184a" />
                  <stop offset="100%" stopColor="#120826" />
                </linearGradient>
                <linearGradient id="mntFront" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#150e24" />
                  <stop offset="100%" stopColor="#07040f" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              <rect width="240" height="200" fill="url(#skyGrad)" />
              
              {/* Stars */}
              <circle cx="30" cy="50" r="1" fill="#fff" opacity="0.6" />
              <circle cx="85" cy="30" r="1.5" fill="#fff" opacity="0.4" />
              <circle cx="160" cy="60" r="1" fill="#fff" opacity="0.8" />
              <circle cx="210" cy="40" r="1.5" fill="#fff" opacity="0.5" />
              <circle cx="130" cy="90" r="1" fill="#fff" opacity="0.3" />
              <circle cx="190" cy="80" r="0.8" fill="#fff" opacity="0.7" />
              
              {/* Moon / Sun with glow */}
              <circle cx="70" cy="110" r="28" fill="url(#sunGlow)" />
              <circle cx="70" cy="110" r="14" fill="#fb923c" />
              
              {/* Back Mountains */}
              <path d="M-20 200 L20 120 L60 145 L110 95 L160 135 L210 80 L260 140 L260 200 Z" fill="url(#mntBack)" opacity="0.8" />
              
              {/* Mid Mountains */}
              <path d="M-10 200 L40 140 L80 170 L130 115 L180 150 L230 100 L260 130 L260 200 Z" fill="url(#mntMid)" />
              
              {/* Front Mountains */}
              <path d="M0 200 L50 160 L90 185 L140 140 L190 170 L240 130 L260 150 L260 200 Z" fill="url(#mntFront)" />
              
              {/* Pine Trees Silhouette */}
              <g fill="#05030a">
                <path d="M15 200 L18 175 L21 200 Z" />
                <path d="M35 200 L39 160 L43 200 Z" />
                <path d="M45 200 L48 180 L51 200 Z" />
                <path d="M110 200 L115 170 L120 200 Z" />
                <path d="M125 200 L128 155 L131 200 Z" />
                <path d="M175 200 L180 165 L185 200 Z" />
                <path d="M210 200 L214 150 L218 200 Z" />
                <path d="M225 200 L228 175 L231 200 Z" />
              </g>
            </svg>
          </div>
        )}

        {/* Bottom — Settings + Logout exactly like the image */}
        <div style={{ padding: '16px 16px 24px', borderTop: `1px solid ${borderColor}`, background: sidebarBg, zIndex: 2, flexShrink: 0 }}>

          {/* Settings */}
          <div
            onClick={() => { setIsMobileOpen(false); router.push(settingsRoute); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 16px', borderRadius: '10px',
              cursor: 'pointer', marginBottom: '8px',
              color: isItemActive(settingsRoute) ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#475569'),
              background: isItemActive(settingsRoute) ? (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc') : 'transparent',
              fontSize: '13.5px', fontWeight: '500', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!isItemActive(settingsRoute)) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
            }}
            onMouseLeave={e => {
              if (!isItemActive(settingsRoute)) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Settings size={18} strokeWidth={2} color={isDark ? "#94a3b8" : "#64748b"} />
            Settings
          </div>

          {/* Logout */}
          <div
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 16px', borderRadius: '10px',
              cursor: 'pointer', color: '#ef4444',
              fontSize: '13.5px', fontWeight: '600', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} strokeWidth={2} />
            Logout
          </div>
        </div>

      </div>
    </>
  );
}