import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  initialSidebarOpen?: boolean;
  sidebarRole?: 'staff' | 'owner' | 'STAFF' | 'ADMIN';
  sidebarDefaultCollapsed?: boolean;
}

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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
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
  );
}
