import { useEffect, useCallback, useRef } from 'react';
import { refreshSession, logoutUser } from '../../services/authApi';

const INACTIVITY_LIMIT_MS = 5 * 60 * 10000; // 5 minutes
const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

export default function InactivityTimeout({ children }: { children: React.ReactNode }) {
  const lastActivityRef = useRef<number>(Date.now());
  const lastRefreshRef = useRef<number>(Date.now());

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      updateActivity();

      const response = await originalFetch.apply(this, args);
      // Only successful requests count as activity as per AC
      if (response.ok && !args[0]?.toString().includes('/api/auth/refresh')) {
        updateActivity();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [updateActivity]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleUserActivity = () => {
      updateActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const intervalId = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Auto logout after 5 minutes of inactivity
      if (timeSinceLastActivity >= INACTIVITY_LIMIT_MS) {
        clearInterval(intervalId);
        await logoutUser();
        return;
      }

      // Refresh token if active in the last interval
      const timeSinceLastRefresh = now - lastRefreshRef.current;
      if (timeSinceLastRefresh >= REFRESH_INTERVAL_MS && timeSinceLastActivity < REFRESH_INTERVAL_MS) {
        const success = await refreshSession();
        if (success) {
          lastRefreshRef.current = now;
        } else {
          // If refresh fails (e.g. token expired on server), we should log out
          clearInterval(intervalId);
          await logoutUser();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
    };
  }, [updateActivity]);

  return <>{children}</>;
}
