import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import SearchBar from '../common/SearchBar';
import { getUpcomingExpirations } from '../../services/reportsApi';
import type { MembershipExpiryAlert } from '../../types/report';

interface HeaderProps {
  /** Callback to toggle sidebar on mobile */
  onMenuToggle: () => void;
  showNotificationDot?: boolean;
  notificationWidget?: ReactNode;
}

export default function Header({
  onMenuToggle,
  showNotificationDot = true,
  notificationWidget,
}: HeaderProps) {
  const [mobileSearch, setMobileSearch] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [expiringMembershipAlerts, setExpiringMembershipAlerts] = useState<
    MembershipExpiryAlert[]
  >([]);
  const storedUsername = window.sessionStorage.getItem('authUsername')?.trim();
  const displayName = storedUsername ? storedUsername : 'None';

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      try {
        const alerts = await getUpcomingExpirations(3);
        if (cancelled) {
          return;
        }

        const sorted = [...alerts].sort(
          (a, b) =>
            new Date(a.expiryDate).getTime() -
            new Date(b.expiryDate).getTime(),
        );

        setExpiringMembershipAlerts(sorted);
      } catch {
        if (!cancelled) {
          setExpiringMembershipAlerts([]);
        }
      }
    };

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

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
              onClick={() => setIsNotificationOpen((prev) => !prev)}
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

function formatExpiryDate(expiryDate: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(expiryDate));
}

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
          No subscriptions expire within the next 3 days.
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
        Expiring within 3 days
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
