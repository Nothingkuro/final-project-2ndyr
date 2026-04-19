import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  CreditCard,
  Database,
  Truck,
  BarChart3,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';
import arrowheadLogo from '../../assets/arrowhead-logo.png';

const USERNAME_UPDATED_EVENT = 'auth-username-updated';

/** Navigation item definition */
/**
 * Defines nav item used by dashboard shell behavior.
 */
interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

/**
 * Defines sidebar props used by dashboard shell behavior.
 */
interface SidebarProps {
  /**
   * Controls whether the sidebar is visible on mobile screens.
   */
  isOpen: boolean;
  /**
   * Callback fired when the sidebar toggle action is triggered.
   */
  onToggle: () => void;
  /**
   * Sets the initial collapsed state for desktop layout.
   */
  defaultCollapsed?: boolean;
  /**
   * Role used to determine which navigation items are visible.
   */
  role?: 'staff' | 'owner' | 'STAFF' | 'ADMIN';
}

const navItems: NavItem[] = [
  { label: 'Members', icon: <Users size={20} />, to: '/dashboard/members' },
  { label: 'Payments', icon: <CreditCard size={20} />, to: '/dashboard/payments' },
  { label: 'Equipment Status', icon: <Activity size={20} />, to: '/dashboard/inventory' },
];

const adminAdditionalNavItems: NavItem[] = [
  { label: 'Membership Plans', icon: <Tag size={20} />, to: '/dashboard/membership-plans' },
  { label: 'Suppliers', icon: <Truck size={20} />, to: '/dashboard/suppliers' },
  { label: 'Reports', icon: <BarChart3 size={20} />, to: '/dashboard/reports' },
  { label: 'Assets Inventory', icon: <Database size={20} />, to: '/dashboard/manage-assets' },
  { label: 'Profiles', icon: <UserCog size={20} />, to: '/dashboard/profile' },
];

/**
 * Renders the sidebar interface for dashboard layout behavior.
 *
 * @param params Input used by sidebar.
 * @returns Rendered JSX output.
 */
export default function Sidebar({
  isOpen,
  onToggle,
  defaultCollapsed = false,
  role = 'staff',
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const navigate = useNavigate();
  const isAdmin = role === 'owner' || role === 'ADMIN';
  const navigationItems = isAdmin ? [...navItems, ...adminAdditionalNavItems] : navItems;

  /**
   * Handles handle logout for dashboard shell behavior.
   * @returns Computed value for the caller.
   */
  const handleLogout = () => {
    window.sessionStorage.removeItem('authUsername');
    window.dispatchEvent(new Event(USERNAME_UPDATED_EVENT));
    window.sessionStorage.removeItem('authRole');
    navigate('/');
  };

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-secondary-light flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* ── Logo / Brand ── */}
        <div className="flex shrink-0 items-center gap-3 px-5 py-6 border-b border-neutral-800">
          <img
            src={arrowheadLogo}
            alt="Arrowhead Gym Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-text-light text-lg font-semibold leading-tight whitespace-nowrap">
                Arrowhead Gym
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">Management System</p>
            </div>
          )}
        </div>

        {/* ── Navigation Links ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 py-4 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) onToggle();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? 'bg-primary text-text-light shadow-md shadow-primary/30'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-text-light'
                }
              `}
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 ${isActive ? 'text-text-light' : 'text-neutral-500 group-hover:text-text-light'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <span className="
                      absolute left-full ml-3 px-2.5 py-1.5 rounded-md
                      bg-neutral-800 text-text-light text-xs whitespace-nowrap
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 pointer-events-none z-50
                      shadow-lg
                    ">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="shrink-0 px-3 py-4 border-t border-neutral-800 bg-secondary-light space-y-2">
          {/* Collapse Toggle (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="
              hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
              text-sm font-medium text-neutral-400 hover:bg-neutral-800
              hover:text-text-light transition-all duration-200 cursor-pointer
            "
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
              text-sm font-medium text-neutral-400 hover:bg-danger/10
              hover:text-danger transition-all duration-200 cursor-pointer
            "
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
