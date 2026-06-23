import { useEffect, useRef, useCallback } from 'react';
import { trackingAPI } from '../services/api';

/**
 * useTimeTracker — Tracks real time spent by user on a deal section.
 * - Only counts when tab is visible (visibilitychange)
 * - Only counts when user is active (scroll/click/mousemove within last 60s)
 * - Sends heartbeat every 30s
 * - No duplicate counting across multiple tabs (unique session_id)
 */
const useTimeTracker = (dealId, section, enabled = true) => {
  const sessionIdRef = useRef(`${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const isVisibleRef = useRef(true);
  const isActiveRef = useRef(true);
  const accumulatedRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const activityTimeoutRef = useRef(null);

  const resetActivity = useCallback(() => {
    isActiveRef.current = true;
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
    }, 60000); // 60s without activity → inactive
  }, []);

  const flush = useCallback(async () => {
    const seconds = accumulatedRef.current;
    if (seconds <= 0 || !dealId) return;
    accumulatedRef.current = 0;
    try {
      await trackingAPI.recordTime(dealId, section, seconds, sessionIdRef.current);
    } catch {}
  }, [dealId, section]);

  useEffect(() => {
    if (!enabled || !dealId) return;

    // Visibility handler
    const onVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (document.hidden) {
        flush(); // flush on tab hide
      } else {
        lastTickRef.current = Date.now();
      }
    };

    // Activity handlers
    const onActivity = () => resetActivity();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('click', onActivity);
    window.addEventListener('mousemove', onActivity, { passive: true });

    resetActivity(); // Start as active

    // Tick every second to accumulate
    const tickInterval = setInterval(() => {
      if (isVisibleRef.current && isActiveRef.current) {
        const now = Date.now();
        const elapsed = Math.round((now - lastTickRef.current) / 1000);
        if (elapsed > 0 && elapsed <= 2) {
          accumulatedRef.current += elapsed;
        }
        lastTickRef.current = now;
      } else {
        lastTickRef.current = Date.now();
      }
    }, 1000);

    // Heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      flush();
    }, 30000);

    return () => {
      flush(); // flush on unmount
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('mousemove', onActivity);
      clearInterval(tickInterval);
      clearInterval(heartbeatInterval);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    };
  }, [dealId, section, enabled, flush, resetActivity]);
};

export default useTimeTracker;
