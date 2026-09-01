'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'next-themes';
import { logout } from '@/store/authSlice';

import {
  Home,
  Calendar,
  ClipboardList,
  CircleDollarSign,
  Star,
  BadgeCheck,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  Wallet,
  GraduationCap,
  Send,
  FileText,
  ChevronDown
} from 'lucide-react';

const EMP_MENU = [
  {
    key: '/employee/dashboard',
    label: 'Dashboard',
    icon: <Home size={18} strokeWidth={2} />
  },
  {
    key: '/employee/attendance',
    label: 'Attendance',
    icon: <Calendar size={18} strokeWidth={2} />
  },
  {
    key: '/employee/leave',
    label: 'Leave Management',
    icon: <ClipboardList size={18} strokeWidth={2} />
  },
  {
    key: '/employee/payslips',
    label: 'Payslips',
    icon: <CircleDollarSign size={18} strokeWidth={2} />
  },
  {
    key: '/employee/performance',
    label: 'Performance',
    icon: <Star size={18} strokeWidth={2} />
  },
  {
    key: '/employee/onboarding',
    label: 'Onboarding',
    icon: <BadgeCheck size={18} strokeWidth={2} />
  },
  {
    key: '/employee/training',
    label: 'Training',
    icon: <GraduationCap size={18} strokeWidth={2} />
  },
  {
    key: '/employee/jobs',
    label: 'Job Openings',
    icon: <Briefcase size={18} strokeWidth={2} />
  },
  {
    key: '/employee/referrals',
    label: 'My Referrals',
    icon: <Users size={18} strokeWidth={2} />
  },
  {
    key: '/employee/notifications',
    label: 'Notifications',
    icon: <Bell size={18} strokeWidth={2} />
  },
];

const ADMIN_MENU = [
  {
    key: '/admin/dashboard',
    label: 'Dashboard',
    icon: <Home size={18} strokeWidth={2} />
  },
  {
    key: '/admin/employees',
    label: 'Employees',
    icon: <Users size={18} strokeWidth={2} />
  },
  {
    key: '/admin/leave',
    label: 'Leave Management',
    icon: <ClipboardList size={18} strokeWidth={2} />
  },
  {
    key: '/admin/payroll',
    label: 'Payroll',
    icon: <Wallet size={18} strokeWidth={2} />
  },
  {
    key: '/admin/performance',
    label: 'Performance',
    icon: <Star size={18} strokeWidth={2} />
  },
  {
    key: '/admin/training',
    label: 'Training',
    icon: <GraduationCap size={18} strokeWidth={2} />
  },
  {
    key: '/admin/recruitment',
    label: 'Recruitment',
    icon: <ShieldCheck size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding',
    label: 'Onboarding',
    icon: <BadgeCheck size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/greetings',
    label: 'Send Greeting',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/interview',
    label: 'Send Interview',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/offerletter',
    label: 'Send Offer Letter',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/document-request',
    label: 'Document Request',
    icon: <FileText size={18} strokeWidth={2} />
  },
  {
    key: '/admin/notifications',
    label: 'Notifications',
    icon: <Bell size={18} strokeWidth={2} />
  },
];

export default function Sidebar({ role }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const handleToggle = () =>
      setIsMobileOpen((prev) => !prev);

    window.addEventListener(
      'toggleMobileSidebar',
      handleToggle
    );

    return () =>
      window.removeEventListener(
        'toggleMobileSidebar',
        handleToggle
      );
  }, []);

const isOnboardingChildPage =
  pathname.startsWith('/admin/onboarding/');

useEffect(() => {
  if (isOnboardingChildPage) {
    setIsOnboardingOpen(true);
  }
}, [isOnboardingChildPage]);

  const menu =
    role === 'ADMIN' || role === 'HR'
      ? ADMIN_MENU
      : EMP_MENU;

  const settingsRoute =
    role === 'ADMIN' || role === 'HR'
      ? '/admin/settings'
      : '/employee/settings';

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const isItemActive = (key) => {
    if (pathname === key) return true;

    const allKeys = [
      ...menu.map((m) => m.key),
      settingsRoute
    ];

    const bestMatch = allKeys.reduce((best, k) => {
      if (
        pathname === k ||
        pathname.startsWith(k + '/')
      ) {
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
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '12px 16px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '8px',

      background: active
        ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)'
        : 'transparent',

      color: active
        ? '#ffffff'
        : '#94a3b8',

      border: active
        ? '1px solid rgba(16, 185, 129, 0.2)'
        : '1px solid transparent',

      fontSize: '13.5px',
      fontWeight: active ? '600' : '500',
      transition: 'all 0.2s ease',
      letterSpacing: '0.2px'
    };
  };

  const sidebarBg = isDark
    ? '#0A0E17'
    : '#ffffff';

  const borderColor = isDark
    ? 'rgba(255,255,255,0.05)'
    : '#e2e8f0';

  return (
    <>
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`app-sidebar ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        style={{
          backgroundColor: sidebarBg,
          borderRight: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >

        {/* Fixed Logo */}
        <div
          style={{
            padding: '28px 24px 20px',
            borderBottom: '1px solid transparent',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >

            {/* Saiteja Infotech Logo */}
            <div
              style={{
                width: '73px',
                height: '73px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}
            >
              <img
                src="/removee.png"
                alt="Saiteja Infotech"
                style={{
                  width: '73px',
                  height: '73px',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div>
              <div
                style={{
                  color: isDark
                    ? '#ffffff'
                    : '#0f172a',
                  fontSize: '18px',
                  fontWeight: '800',
                  lineHeight: 1.1,
                  letterSpacing: '0.5px'
                }}
              >
                HRMS
              </div>

              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  marginTop: '3px',
                  fontWeight: '700'
                }}
              >
                HR MANAGEMENT
              </div>
            </div>

          </div>
        </div>

        {/* Scrollable Middle Container */}
        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >

          {/* Main Menu */}
          <div
            style={{
              padding: '16px 16px 0',
              flexShrink: 0
            }}
          >
            {menu.map((item) => {
              const isAdminOnboarding =
                (role === 'ADMIN' || role === 'HR') &&
                item.key === '/admin/onboarding';

              if (isAdminOnboarding) {
                const isOnboardingActive =
                       pathname === '/admin/onboarding' ||
                           pathname.startsWith('/admin/onboarding/');

                return (
                  <div key={item.key}>
                    <Link
                      href={item.key}
                     onClick={() => {
                               setIsOnboardingOpen((prev) => !prev);
                                 setIsMobileOpen(false);
                                  router.push('/admin/onboarding');
                            } }
                      style={{
                        ...navItemStyle(item.key),
                        position: 'relative',
                        textDecoration: 'none',
                        ...(isOnboardingActive && {
                          background:
                            'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)',
                          color: '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          fontWeight: '600'
                        })
                      }}
                      onMouseEnter={(e) => {
                        if (!isOnboardingActive) {
                          e.currentTarget.style.background =
                            isDark
                              ? 'rgba(255,255,255,0.03)'
                              : '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOnboardingActive) {
                          e.currentTarget.style.background =
                            'transparent';
                        }
                      }}
                    >
                      <div
                        style={{
                          color: isOnboardingActive
                            ? '#34d399'
                            : isDark
                              ? '#cbd5e1'
                              : '#64748b',
                          display: 'flex'
                        }}
                      >
                        {item.icon}
                      </div>

                      <span
                        style={{
                          color: isOnboardingActive
                            ? isDark
                              ? '#ffffff'
                              : '#0f172a'
                            : isDark
                              ? '#cbd5e1'
                              : '#475569'
                        }}
                      >
                        {item.label}
                      </span>

                      <div
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: isOnboardingActive
                            ? '#34d399'
                            : '#94a3b8',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            transition: 'transform 0.2s',
                            transform: isOnboardingOpen
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)'
                          }}
                        />
                      </div>
                    </Link>

                    {isOnboardingOpen &&
                      menu
                        .filter((m) =>
                          m.key.startsWith('/admin/onboarding/') &&
                          m.key !== '/admin/onboarding'
                        )
                        .map((sub) => (
                          <Link
                            key={sub.key}
                            href={sub.key}
                            onClick={() =>
                              setIsMobileOpen(false)
                            }
                            style={{
                              ...navItemStyle(sub.key),
                              position: 'relative',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isItemActive(sub.key)) {
                                e.currentTarget.style.background =
                                  isDark
                                    ? 'rgba(255,255,255,0.03)'
                                    : '#f8fafc';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isItemActive(sub.key)) {
                                e.currentTarget.style.background =
                                  'transparent';
                              }
                            }}
                          >
                            <div
                              style={{
                                color: isItemActive(sub.key)
                                  ? '#34d399'
                                  : isDark
                                    ? '#cbd5e1'
                                    : '#64748b',
                                display: 'flex'
                              }}
                            >
                              {sub.icon}
                            </div>

                            <span
                              style={{
                                color: isItemActive(sub.key)
                                  ? isDark
                                    ? '#ffffff'
                                    : '#0f172a'
                                  : isDark
                                    ? '#cbd5e1'
                                    : '#475569'
                              }}
                            >
                              {sub.label}
                            </span>
                          </Link>
                        ))}
                  </div>
                );
              }

              if (
                (role === 'ADMIN' || role === 'HR') &&
                (item.key === '/admin/onboarding/greetings' ||
                  item.key === '/admin/onboarding/offerletter' ||
                  item.key === '/admin/onboarding/interview' ||
                  item.key === '/admin/onboarding/document-request')
              ) {
                return null;
              }

              return (
                <Link
                  key={item.key}
                  href={item.key}
                  onClick={() =>
                    setIsMobileOpen(false)
                  }
                  style={{
                    ...navItemStyle(item.key),
                    position: 'relative',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isItemActive(item.key)) {
                      e.currentTarget.style.background =
                        isDark
                          ? 'rgba(255,255,255,0.03)'
                          : '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isItemActive(item.key)) {
                      e.currentTarget.style.background =
                        'transparent';
                    }
                  }}
                >

                  <div
                    style={{
                      color: isItemActive(item.key)
                        ? '#34d399'
                        : isDark
                          ? '#cbd5e1'
                          : '#64748b',
                      display: 'flex'
                    }}
                  >
                    {item.icon}
                  </div>

                  <span
                    style={{
                      color: isItemActive(item.key)
                        ? isDark
                          ? '#ffffff'
                          : '#0f172a'
                        : isDark
                          ? '#cbd5e1'
                          : '#475569'
                    }}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow:
                          '0 2px 8px rgba(139, 92, 246, 0.4)'
                      }}
                    >
                      {item.badge}
                    </div>
                  )}

                </Link>
              );
            })}
          </div>

          {/* Spacer */}
          <div
            style={{
              flex: 1,
              minHeight: '20px'
            }}
          />

          {/* Decorative Mountain Vector */}
          {isDark && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                flexShrink: 0,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  background:
                    'linear-gradient(to bottom, #0A0E17, transparent)',
                  zIndex: 1
                }}
              />
            </div>
          )}

        </div>

        {/* Fixed Bottom — Settings + Logout */}
        <div
          style={{
            padding: '16px 16px 20px',
            borderTop: `1px solid ${borderColor}`,
            background: sidebarBg,
            zIndex: 2,
            flexShrink: 0
          }}
        >

          {/* Settings */}
          <Link
            href={settingsRoute}
            onClick={() =>
              setIsMobileOpen(false)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              marginBottom: '8px',
              textDecoration: 'none',

              color: isItemActive(settingsRoute)
                ? isDark
                  ? '#ffffff'
                  : '#0f172a'
                : isDark
                  ? '#cbd5e1'
                  : '#475569',

              background: isItemActive(settingsRoute)
                ? isDark
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)'
                  : '#f8fafc'
                : 'transparent',

              border: isItemActive(settingsRoute)
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid transparent',

              fontSize: '13.5px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isItemActive(settingsRoute)) {
                e.currentTarget.style.background =
                  isDark
                    ? 'rgba(255,255,255,0.03)'
                    : '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isItemActive(settingsRoute)) {
                e.currentTarget.style.background =
                  'transparent';
              }
            }}
          >

            <div
              style={{
                color: isItemActive(settingsRoute)
                  ? '#34d399'
                  : isDark
                    ? '#cbd5e1'
                    : '#64748b',
                display: 'flex'
              }}
            >
              <Settings
                size={18}
                strokeWidth={2}
              />
            </div>

            Settings

          </Link>

          {/* Logout */}
          <div
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#ef4444',
              border: '1px solid transparent',
              fontSize: '13.5px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                'rgba(239,68,68,0.1)'
            }
            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                'transparent'
            }
          >

            <div
              style={{
                display: 'flex',
                color: '#ef4444'
              }}
            >
              <LogOut
                size={18}
                strokeWidth={2}
              />
            </div>

            Logout

          </div>

        </div>

      </div>
    </>
  );
}