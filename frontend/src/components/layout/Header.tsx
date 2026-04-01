import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  /** Callback to toggle sidebar on mobile */
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
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
          <button
            className="
              relative p-2 rounded-lg text-neutral-500
              hover:bg-neutral-100 hover:text-secondary
              transition-colors duration-200 cursor-pointer
            "
            aria-label="Notifications"
          >
            <Bell size={20} />
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface" />
          </button>

          {/* User Profile */}
          <div className="
            flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg
            hover:bg-neutral-100 transition-colors duration-200 cursor-pointer
          ">
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary leading-tight">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Search (shown below header on small screens) ── */}
      <div className="sm:hidden pb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200
              bg-surface-alt text-sm text-secondary
              placeholder:text-neutral-400
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              transition-all duration-200
            "
          />
        </div>
      </div>
    </header>
  );
}
