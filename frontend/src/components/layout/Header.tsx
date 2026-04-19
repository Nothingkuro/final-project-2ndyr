import { Bell, Menu } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import SearchBar from '../common/SearchBar';
import { getUpcomingExpirations } from '../../services/reportsApi';
import type { MembershipExpiryAlert } from '../../types/report';

const ALERT_WINDOW_DAYS = 3;
const ALERT_REFRESH_INTERVAL_MS = 30_000;
const USERNAME_UPDATED_EVENT = 'auth-username-updated';

/**
 * Handles read stored username logic for dashboard layout behavior.
 * @returns Computed value for the caller.
 */
function readStoredUsername(): string {
  const storedUsername = window.sessionStorage.getItem('authUsername')?.trim();
  return storedUsername ? storedUsername : 'None';
}

/**
 * Defines header props used by dashboard shell behavior.
 */
interface HeaderProps {
  /**
  * Callback fired when the mobile menu button is pressed.
   */
  onMenuToggle: () => void;
  /**
   * Data used for show notification dot behavior.
   */
  showNotificationDot?: boolean;
  /**
   * Data used for notification widget behavior.
   */
  notificationWidget?: ReactNode;
}

/**
 * Renders the header interface for dashboard layout behavior.
 *
 * @param params Input used by header.
 * @returns Rendered JSX output.
 */
export default function Header({
  onMenuToggle,
  showNotificationDot = true,
  notificationWidget,
}: HeaderProps) {
  const [mobileSearch, setMobileSearch] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>(() => readStoredUsername());
  const [expiringMembershipAlerts, setExpiringMembershipAlerts] = useState<
    MembershipExpiryAlert[]
  >([]);
  const isMountedRef = useRef(true);
  const isRefreshingAlertsRef = useRef(false);

  const refreshExpiringMembershipAlerts = useCallback(async () => {
    if (isRefreshingAlertsRef.current) {
      return;
    }

    isRefreshingAlertsRef.current = true;

    try {
      const alerts = await getUpcomingExpirations(ALERT_WINDOW_DAYS);

      const sorted = [...alerts].sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() -
          new Date(b.expiryDate).getTime(),
      );

      if (isMountedRef.current) {
        setExpiringMembershipAlerts(sorted);
      }
    } catch {
      if (isMountedRef.current) {
        setExpiringMembershipAlerts([]);
      }
    } finally {
      isRefreshingAlertsRef.current = false;
    }
  }, []);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  useEffect(() => {
    /**
     * Handles sync display name for dashboard shell behavior.
     * @returns Computed value for the caller.
     */
    const syncDisplayName = () => {
      setDisplayName(readStoredUsername());
    };

    syncDisplayName();

    window.addEventListener('storage', syncDisplayName);
    window.addEventListener(USERNAME_UPDATED_EVENT, syncDisplayName);
    window.addEventListener('focus', syncDisplayName);

    return () => {
      window.removeEventListener('storage', syncDisplayName);
      window.removeEventListener(USERNAME_UPDATED_EVENT, syncDisplayName);
      window.removeEventListener('focus', syncDisplayName);
    };
  }, []);

  useEffect(() => {
    /**
     * Handles handle focus for dashboard shell behavior.
     * @returns Computed value for the caller.
     */
    const handleFocus = () => {
      void refreshExpiringMembershipAlerts();
    };

    /**
     * Handles handle visibility change for dashboard shell behavior.
     * @returns Computed value for the caller.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshExpiringMembershipAlerts();
      }
    };

    void refreshExpiringMembershipAlerts();
    const intervalId = window.setInterval(() => {
      void refreshExpiringMembershipAlerts();
    }, ALERT_REFRESH_INTERVAL_MS);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshExpiringMembershipAlerts]);

  useEffect(() => {
    if (isNotificationOpen) {
      void refreshExpiringMembershipAlerts();
    }
  }, [isNotificationOpen, refreshExpiringMembershipAlerts]);

  const shouldShowNotificationDot =
    showNotificationDot && expiringMembershipAlerts.length > 0;

  const defaultNotificationWidget = (
    <MembershipExpiryNotificationList alerts={expiringMembershipAlerts} />
  );
  const resolvedNotificationWidget =
    notificationWidget ?? defaultNotificationWidget;

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-neutral-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* ── Left: Mobile menu button + Page context ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="
              lg:hidden p-2 -ml-2 rounded-lg text-neutral-500
              hover:bg-neutral-100 hover:text-secondary
              transition-colors duration-200 cursor-pointer
            "
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* ── Center / Right: Search bar + Actions ── */}
        <div className="flex items-center gap-3 flex-1 justify-end">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    void refreshExpiringMembershipAlerts();
                  }

                  return next;
                });
              }}
              className="
                relative p-2 rounded-lg text-neutral-500
                hover:bg-neutral-100 hover:text-secondary
                transition-colors duration-200 cursor-pointer
              "
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
            >
              <Bell size={20} />
              {/* Notification badge */}
              {shouldShowNotificationDot && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-surface p-4 shadow-card">
                {resolvedNotificationWidget}
              </div>
            )}
          </div>

          {/* User Name */}
          <div className="
            flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg
            hover:bg-neutral-100 transition-colors duration-200
          ">
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary leading-tight">{displayName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Search (shown below header on small screens) ── */}
      <div className="sm:hidden pb-3">
        <SearchBar
          value={mobileSearch}
          onChange={setMobileSearch}
          placeholder="Search..."
          inputClassName="border-neutral-200 bg-surface-alt text-secondary placeholder:text-neutral-400 py-2"
        />
      </div>
    </header>
  );
}

/**
 * Handles format expiry date logic for dashboard layout behavior.
 *
 * @param expiryDate Input used by format expiry date.
 * @returns Computed value for the caller.
 */
function formatExpiryDate(expiryDate: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(expiryDate));
}

/**
 * Renders the membership expiry notification list interface for dashboard layout behavior.
 *
 * @param params Input used by membership expiry notification list.
 * @returns Rendered JSX output.
 */
function MembershipExpiryNotificationList({
  alerts,
}: {
  alerts: MembershipExpiryAlert[];
}) {
  if (alerts.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-secondary">
          Membership Expiry Alerts
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          No subscriptions expire within the next {ALERT_WINDOW_DAYS} days.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-secondary">
        Membership Expiry Alerts
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Expiring within {ALERT_WINDOW_DAYS} days
      </p>

      <ul className="mt-3 max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300">
        {alerts.map((member, index) => (
          <li
            key={`${member.id}-${member.expiryDate}-${index}`}
            className="border-b border-neutral-200 py-2 last:border-b-0"
          >
            <p className="text-sm font-medium text-secondary">{member.name}</p>
            <p className="text-xs text-neutral-500">
              Expires: {formatExpiryDate(member.expiryDate)}
            </p>
            <p className="text-xs text-neutral-500">{member.contactNumber}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
