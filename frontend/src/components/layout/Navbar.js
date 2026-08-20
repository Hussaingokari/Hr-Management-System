'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getUnreadCount } from '@/lib/employeeApi';
import { getAdminUnreadCount } from '@/lib/adminApi';
import {
  Home,
  Calendar,
  ClipboardList,
  Wallet,
  TrendingUp,
  Bell,
  Settings,
  Users,
  GraduationCap,
  Briefcase,
  FolderOpen,
} from 'lucide-react';
import DashboardThemeSwitcher from './DashboardThemeSwitcher';

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';
  const accentColor = isDark ? (isAdmin ? '#c084fc' : '#ccf000') : '#10b981';

  // ── Unread notification count (role-aware) ──
  useEffect(() => {
    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const res = isAdmin
          ? await getAdminUnreadCount()
          : await getUnreadCount();
        if (active) setUnreadCount(res.data?.data || 0);
      } catch { }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    const handleUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationsUpdated', handleUpdate);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', handleUpdate);
    };
  }, [isAdmin]);

  const EMP_SEARCH_ITEMS = [
    { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
    { label: 'Attendance', path: '/employee/attendance', icon: Calendar },
    { label: 'Leave Management', path: '/employee/leave', icon: ClipboardList },
    { label: 'Payslips', path: '/employee/payslips', icon: Wallet },
    { label: 'Performance', path: '/employee/performance', icon: TrendingUp },
    { label: 'Notifications', path: '/employee/notifications', icon: Bell },
    { label: 'Settings', path: '/employee/settings', icon: Settings },
  ];

  const ADMIN_SEARCH_ITEMS = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Employees', path: '/admin/employees', icon: Users },
    { label: 'Leave Approvals', path: '/admin/leave', icon: ClipboardList },
    { label: 'Payroll', path: '/admin/payroll', icon: Wallet },
    { label: 'Performance', path: '/admin/performance', icon: TrendingUp },
    { label: 'Training', path: '/admin/training', icon: GraduationCap },
    { label: 'Recruitment', path: '/admin/recruitment', icon: Briefcase },
    { label: 'Onboarding', path: '/admin/onboarding', icon: FolderOpen },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Sort alphabetically by label (string order, not insertion/numeric order)
  const allItems = (isAdmin ? ADMIN_SEARCH_ITEMS : EMP_SEARCH_ITEMS)
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  const filtered = search.trim()
    ? allItems.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSearchSelect = (path) => {
    router.push(path);
    setSearch('');
    setShowResults(false);
  };

  const handleBellClick = () => {
    if (isAdmin) {
      router.push('/admin/notifications');
    } else {
      router.push('/employee/notifications');
    }
  };

  return (
    <div className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Mobile Hamburger Button */}
        <button
          className="mobile-hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent('toggleMobileSidebar'))}
          style={{
            display: 'none',
            background: '#f1f5f9', border: 'none', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', color: '#1e293b',
            alignItems: 'center', justifyContent: 'center',
          }}
          title="Toggle Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Search Box */}
        <div className="nav-search-box" style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => {
              // Allow letters and spaces only — strip any numbers/symbols
              const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '');
              setSearch(lettersOnly);
              setShowResults(true);
            }}
            onKeyPress={e => {
              // Block numeric/symbol keys before they even get typed
              if (!/[a-zA-Z\s]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search pages..."
            style={{
              width: '100%', paddingLeft: '36px', paddingRight: '12px',
              height: '38px', border: isDark ? '1px solid #1E293B' : '1.5px solid #e2e8f0',
              borderRadius: '8px', fontSize: '13px', outline: 'none',
              boxSizing: 'border-box', transition: 'border 0.2s',
              background: isDark ? '#111827' : '#f8fafc',
              color: isDark ? '#f8fafc' : '#1e293b',
            }}
            onFocusCapture={e => {
              e.target.style.borderColor = isDark ? '#334155' : '#10b981';
              e.target.style.background = isDark ? '#1A1D24' : 'white';
            }}
            onBlurCapture={e => {
              e.target.style.borderColor = isDark ? '#1E293B' : '#e2e8f0';
              e.target.style.background = isDark ? '#111827' : '#f8fafc';
            }}
          />

          {/* Search Results Dropdown */}
          {showResults && search.trim() && (
            <div style={{
              position: 'absolute', top: '44px', left: 0, right: 0,
              background: isDark ? '#111827' : 'white', borderRadius: '12px',
              border: isDark ? '1px solid #1E293B' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 100,
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                  No results for &quot;{search}&quot;
                </div>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i}
                      onMouseDown={() => handleSearchSelect(item.path)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', cursor: 'pointer',
                        borderBottom: i < filtered.length - 1 ? (isDark ? '1px solid #1E293B' : '1px solid #f1f5f9') : 'none',
                        background: pathname === item.path ? (isDark ? '#1E293B' : '#eff6ff') : (isDark ? '#111827' : 'white'),
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1E293B' : '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = pathname === item.path ? (isDark ? '#1E293B' : '#eff6ff') : (isDark ? '#111827' : 'white')}
                    >
                      <Icon size={18} color={pathname === item.path ? accentColor : (isDark ? '#94a3b8' : '#64748b')} strokeWidth={2} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#f8fafc' : '#1e293b' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {item.path}
                        </div>
                      </div>
                      {pathname === item.path && (
                        <span style={{
                          marginLeft: 'auto', fontSize: '10px',
                          background: isDark ? '#334155' : '#eff6ff',
                          color: accentColor,
                          padding: '2px 8px', borderRadius: '20px', fontWeight: '700',
                        }}>
                          Current
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Empty Search — Quick Navigation */}
          {showResults && !search.trim() && (
            <div style={{
              position: 'absolute', top: '44px', left: 0, right: 0,
              background: isDark ? '#111827' : 'white', borderRadius: '12px',
              border: isDark ? '1px solid #1E293B' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              padding: '12px 16px', zIndex: 100,
            }}>
              <div style={{
                fontSize: '11px', color: '#94a3b8', fontWeight: '600',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Quick Navigation
              </div>
              {allItems.slice(0, 5).map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i}
                    onMouseDown={() => handleSearchSelect(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 0', cursor: 'pointer',
                      borderBottom: i < 4 ? (isDark ? '1px solid #1E293B' : '1px solid #f1f5f9') : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Icon size={16} color={isDark ? '#94a3b8' : '#374151'} strokeWidth={2} />
                    <span style={{ fontSize: '13px', color: isDark ? '#f8fafc' : '#374151', fontWeight: '500' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className="nav-right-side" style={{ display: 'flex', alignItems: 'center', gap: '16px', }}>

        <DashboardThemeSwitcher />

        {/* Notification Bell */}
        <div
          onClick={handleBellClick}
          style={{ position: 'relative', cursor: 'pointer', padding: '6px' }}
          title="Go to Notifications"
        >
          <Bell size={20} color="#64748b" strokeWidth={2} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '2px', right: '2px',
              background: '#8b5cf6', color: 'white',
              borderRadius: '50%', minWidth: '16px', height: '16px',
              fontSize: '9px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '700', padding: '0 3px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="nav-divider" style={{ width: '1px', height: '28px', background: isDark ? '#1E293B' : '#e2e8f0' }} />

        {/* Role Badge */}
        <span className="nav-role-badge" style={{
          background: isDark
            ? (user?.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.15)' : user?.role === 'HR' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)')
            : (user?.role === 'ADMIN' ? '#dbeafe' : user?.role === 'HR' ? '#fdf4ff' : '#f0fdf4'),
          color: isDark
            ? (user?.role === 'ADMIN' ? '#60a5fa' : user?.role === 'HR' ? '#c084fc' : '#34d399')
            : (user?.role === 'ADMIN' ? '#1d4ed8' : user?.role === 'HR' ? '#9333ea' : '#16a34a'),
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '11px', fontWeight: '700',
        }}>
          {user?.role}
        </span>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '13px', fontWeight: '700',
            flexShrink: 0,
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="nav-user-info">
            <div style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#f8fafc' : '#1e293b', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {user?.employeeCode} · {user?.role === 'ADMIN' ? 'Super Admin' : user?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}