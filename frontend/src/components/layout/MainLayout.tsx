import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import InactivityTimeout from '../common/InactivityTimeout';

/**
 * Defines main layout props used by dashboard shell behavior.
 */
interface MainLayoutProps {
  /**
   * Nested content rendered inside the component wrapper.
   */
  children: ReactNode;
  /**
   * Initial state value for sidebar open.
   */
  initialSidebarOpen?: boolean;
  /**
   * Data used for sidebar role behavior.
   */
  sidebarRole?: 'staff' | 'owner' | 'STAFF' | 'ADMIN';
  /**
   * Data used for sidebar default collapsed behavior.
   */
  sidebarDefaultCollapsed?: boolean;
}

/**
 * Renders the main layout interface for dashboard layout behavior.
 *
 * @param params Input used by main layout.
 * @returns Rendered JSX output.
 */
export default function MainLayout({
  children,
  initialSidebarOpen = false,
  sidebarRole,
  sidebarDefaultCollapsed = false,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(initialSidebarOpen);
  const storedRole = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('authRole')
    : null;
  const resolvedSidebarRole = sidebarRole ?? (storedRole === 'ADMIN' ? 'ADMIN' : 'STAFF');

  /**
   * Handles toggle sidebar for dashboard shell behavior.
    * @returns Void.
   */
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <InactivityTimeout>
      <div className="flex h-screen overflow-hidden bg-surface-alt">
        {/* ── Sidebar ── */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          role={resolvedSidebarRole}
          defaultCollapsed={sidebarDefaultCollapsed}
        />

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Header ── */}
          <Header onMenuToggle={toggleSidebar} />

          {/* ── Page Content ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </InactivityTimeout>
  );
}
