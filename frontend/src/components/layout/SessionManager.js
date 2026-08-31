'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/store/authSlice';
import toast from 'react-hot-toast';

const INACTIVITY_TIME =2 * 60 * 1000; // 2 minutes
const ACTIVITY_THROTTLE = 1000;

let sessionTimerState = {
  remainingTime: INACTIVITY_TIME,
  lastActivity: Date.now(),
};

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function recordActivity() {
  sessionTimerState.lastActivity = Date.now();
  sessionTimerState.remainingTime = INACTIVITY_TIME;

  notifyListeners();
}

/*
 * Navbar uses this hook to display the
 * current remaining session time.
 */
export function useSessionTimer() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => {
      forceUpdate((value) => value + 1);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return sessionTimerState;
}

/*
 * Main inactivity session manager.
 *
 * It detects:
 * - Mouse movement
 * - Mouse click
 * - Keyboard activity
 * - Scroll
 * - Touch
 *
 * After 5 minutes without activity,
 * the user is logged out.
 */
export default function SessionManager() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [logoutTriggered, setLogoutTriggered] =
    useState(false);

  const isLoginPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname?.startsWith('/admin/login') ||
    pathname?.startsWith('/employee/login') ||
    pathname === '/forgot-password';

  const handleLogout = useCallback(() => {
    if (logoutTriggered) {
      return;
    }

    setLogoutTriggered(true);

    dispatch(logout());

    toast.error(
      'Your session expired due to inactivity. Please login again.',
      {
        duration: 5000,
      }
    );

    /*
     * Redirect to the correct login page.
     */
    if (pathname?.startsWith('/admin')) {
      router.replace('/admin/login');
    } else {
      router.replace('/employee/login');
    }
  }, [
    dispatch,
    router,
    pathname,
    logoutTriggered,
  ]);

  useEffect(() => {
    /*
     * Do not run the timer when the user
     * is not authenticated.
     */
    if (!isAuthenticated || isLoginPage) {
      return;
    }

    setLogoutTriggered(false);

    /*
     * Start the timer at 5 minutes.
     */
    sessionTimerState.lastActivity = Date.now();

    sessionTimerState.remainingTime =
      INACTIVITY_TIME;

    notifyListeners();

    let lastRecordedActivity = Date.now();

    /*
     * Detect user activity.
     */
    const handleActivity = () => {
      const now = Date.now();

      /*
       * Prevent continuous mouse movement from
       * causing excessive updates.
       */
      if (
        now - lastRecordedActivity <
        ACTIVITY_THROTTLE
      ) {
        return;
      }

      lastRecordedActivity = now;

      recordActivity();
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity,
        { passive: true }
      );
    });

    /*
     * Countdown runs every second.
     */
    const timer = setInterval(() => {
      const elapsed =
        Date.now() -
        sessionTimerState.lastActivity;

      const remaining = Math.max(
        INACTIVITY_TIME - elapsed,
        0
      );

      sessionTimerState.remainingTime =
        remaining;

      notifyListeners();

      /*
       * 5 minutes without activity.
       */
      if (remaining <= 0) {
        clearInterval(timer);
        handleLogout();
      }
    }, 1000);

    /*
     * Cleanup.
     */
    return () => {
      clearInterval(timer);

      activityEvents.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });
    };
  }, [
    isAuthenticated,
    isLoginPage,
    handleLogout,
  ]);

  /*
   * No UI is rendered here.
   * Navbar displays the timer.
   */
  return null;
}

/*
 * Convert milliseconds into MM:SS.
 *
 * 300000 → 05:00
 * 299000 → 04:59
 * 60000  → 01:00
 */
export function formatSessionTime(
  milliseconds
) {
  const totalSeconds = Math.max(
    Math.ceil(milliseconds / 1000),
    0
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(
    2,
    '0'
  )}`;
}