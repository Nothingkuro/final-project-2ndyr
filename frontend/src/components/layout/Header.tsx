import { Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import SearchBar from '../common/SearchBar';

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
              {showNotificationDot && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface" />
              )}
            </button>

            {isNotificationOpen && notificationWidget !== undefined && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-surface p-4 shadow-card">
                {notificationWidget}
              </div>
            )}
          </div>

          {/* User Name */}
          <div className="
            flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg
            hover:bg-neutral-100 transition-colors duration-200
          ">
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary leading-tight">Admin</p>
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
