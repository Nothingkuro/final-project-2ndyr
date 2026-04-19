import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowheadLogo from '../assets/arrowhead-logo.png';
import { API_BASE_URL } from '../services/apiBaseUrl';

const USERNAME_UPDATED_EVENT = 'auth-username-updated';

/**
 * Type alias for role in route-level dashboard orchestration.
 */
type Role = 'Staff' | 'Owner';

/**
 * Type alias for login step in route-level dashboard orchestration.
 */
type LoginStep = 'select-role' | 'enter-credentials';

/**
 * Defines login page props used by route-level dashboard orchestration.
 */
interface LoginPageProps {
  /**
   * Initial state value for step.
   */
  initialStep?: LoginStep;
  /**
   * Initial state value for role.
   */
  initialRole?: Role | null;
  /**
   * Initial state value for username.
   */
  initialUsername?: string;
  /**
   * Initial state value for password.
   */
  initialPassword?: string;
  /**
   * Error message shown when an operation fails.
   */
  initialError?: string | null;
  /**
   * Marks whether asynchronous data is currently loading.
   */
  initialLoading?: boolean;
  /**
   * Data used for disable submit behavior.
   */
  disableSubmit?: boolean;
}

/**
 * Renders the login page interface for page-level dashboard orchestration.
 *
 * @param params Input used by login page.
 * @returns Rendered JSX output.
 */
export default function LoginPage({
  initialStep = 'select-role',
  initialRole = null,
  initialUsername = '',
  initialPassword = '',
  initialError = null,
  initialLoading = false,
  disableSubmit = false,
}: LoginPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>(initialStep);
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(initialLoading);

  /**
   * Handles handle role select for route-level dashboard orchestration.
   *
   * @param role Input consumed by handle role select.
   * @returns Computed value for the caller.
   */
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('enter-credentials');
    setError(null); // Reset error on role change
  };

  /**
   * Handles handle login for route-level dashboard orchestration.
   *
   * @param e Input consumed by handle login.
   * @returns A promise that resolves when processing completes.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disableSubmit) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      const loggedInUsername =
        typeof data?.user?.username === 'string' && data.user.username.trim()
          ? data.user.username.trim()
          : username.trim();

      if (loggedInUsername) {
        window.sessionStorage.setItem('authUsername', loggedInUsername);
        window.dispatchEvent(new Event(USERNAME_UPDATED_EVENT));
      }

      const apiRole = typeof data?.user?.role === 'string' ? data.user.role.toUpperCase() : '';
      const normalizedRole = apiRole === 'ADMIN' || apiRole === 'STAFF'
        ? apiRole
        : selectedRole === 'Owner'
          ? 'ADMIN'
          : 'STAFF';
      window.sessionStorage.setItem('authRole', normalizedRole);

      navigate('/dashboard/members');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles handle back for route-level dashboard orchestration.
   * @returns Computed value for the caller.
   */
  const handleBack = () => {
    setStep('select-role');
    setSelectedRole(null);
    setUsername('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* ── Background gradient matching wireframe ── */}
      <div className="absolute inset-0 bg-linear-to-b from-neutral-300 via-primary to-primary-dark" />
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20" />

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-surface-alt rounded-2xl shadow-modal p-8 sm:p-10">
          {/* ── Brand Header ── */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <img
              src={arrowheadLogo}
              alt="Arrowhead Logo"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-primary text-4xl font-semibold tracking-tight">
              Arrowhead
            </h1>
          </div>

          {/* ── Step: Select Role ── */}
          {step === 'select-role' && (
            <div className="space-y-6">
              <p className="text-center text-secondary text-lg font-medium">
                Log in as:
              </p>

              <div className="flex flex-col items-center gap-3">
                {/* Staff button */}
                <button
                  onClick={() => handleRoleSelect('Staff')}
                  className="
                    w-48 px-5 py-3 bg-surface border border-neutral-300
                    rounded-lg text-secondary text-sm font-medium text-center
                    hover:border-neutral-400 hover:shadow-sm
                    transition-all duration-200 cursor-pointer
                  "
                >
                  Staff
                </button>

                {/* Owner button */}
                <button
                  onClick={() => handleRoleSelect('Owner')}
                  className="
                    w-48 px-5 py-3 bg-surface border border-neutral-300
                    rounded-lg text-secondary text-sm font-medium text-center
                    hover:border-neutral-400 hover:shadow-sm
                    transition-all duration-200 cursor-pointer
                  "
                >
                  Owner
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Enter Credentials ── */}
          {step === 'enter-credentials' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <p className="text-center text-secondary text-lg font-medium">
                Enter Username and Password:
              </p>

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="
                    w-full px-4 py-3 bg-surface border border-neutral-300
                    rounded-lg text-sm text-secondary placeholder:text-neutral-400
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    transition-all duration-200 disabled:opacity-50 disabled:bg-neutral-50
                  "
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="
                    w-full px-4 py-3 bg-surface border border-neutral-300
                    rounded-lg text-sm text-secondary placeholder:text-neutral-400
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    transition-all duration-200 disabled:opacity-50 disabled:bg-neutral-50
                  "
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="
                    flex-1 px-4 py-3 border border-neutral-300 rounded-lg
                    text-sm font-medium text-secondary
                    hover:bg-neutral-100 active:scale-[0.98]
                    transition-all duration-150 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    flex-1 px-4 py-3 bg-primary text-text-light rounded-lg
                    text-sm font-medium
                    hover:bg-primary-dark active:scale-[0.98]
                    transition-all duration-150 cursor-pointer
                    shadow-md shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? 'Logging In...' : 'Log In'}
                </button>
              </div>

              {selectedRole && (
                <p className="text-center text-xs text-neutral-400 mt-2">
                  Logging in as <span className="font-semibold text-primary">{selectedRole}</span>
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-white/60 mt-6">
          Arrowhead Gym Management System
        </p>
      </div>
    </div>
  );
}
