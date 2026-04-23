import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ShieldCheck, Users } from 'lucide-react';
import type { User } from '../types/user';
import {
  listSystemUsers,
  updateOwnProfile,
  updateUserProfile,
} from '../services/profileApi';

const USERNAME_UPDATED_EVENT = 'auth-username-updated';

/**
 * Defines user profile page props used by route-level dashboard orchestration.
 */
interface UserProfilePageProps {
  /**
   * Collection data rendered by users UI.
   */
  users?: User[];
  /**
   * Marks whether asynchronous data is currently loading.
   */
  initialLoading?: boolean;
}

/**
 * Handles format account date logic for page-level dashboard orchestration.
 *
 * @param isoDate Input used by format account date.
 * @returns Computed value for the caller.
 */
function formatAccountDate(isoDate: string): string {
  if (!isoDate) {
    return '--';
  }

  const dateValue = new Date(isoDate);
  if (Number.isNaN(dateValue.getTime())) {
    return '--';
  }

  return dateValue.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Handles role badge class logic for page-level dashboard orchestration.
 *
 * @param role Input used by role badge class.
 * @returns Computed value for the caller.
 */
function roleBadgeClass(role: User['role']): string {
  return role === 'ADMIN'
    ? 'bg-primary/10 text-primary'
    : 'bg-neutral-200 text-secondary';
}

/**
 * Handles apply local update logic for page-level dashboard orchestration.
 *
 * @param users Input used by apply local update.
 * @param targetUserId Input used by apply local update.
 * @param username Input used by apply local update.
 * @returns Computed value for the caller.
 */
function applyLocalUpdate(users: User[], targetUserId: string, username?: string): User[] {
  if (!username) {
    return users;
  }

  const now = new Date().toISOString();

  return users.map((user) => (
    user.id === targetUserId
      ? {
        ...user,
        username,
        updatedAt: now,
      }
      : user
  ));
}

/**
 * Renders the user profile page interface for page-level dashboard orchestration.
 *
 * @param params Input used by user profile page.
 * @returns Rendered JSX output.
 */
export default function UserProfilePage({
  users: providedUsers,
  initialLoading = false,
}: UserProfilePageProps) {
  const [accounts, setAccounts] = useState<User[]>(providedUsers ?? []);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const isLocalMode = providedUsers !== undefined;

  const adminAccount = useMemo(() => (
    accounts.find((account) => account.role === 'ADMIN') ?? null
  ), [accounts]);

  const primaryStaffAccount = useMemo(() => (
    accounts.find((account) => account.role === 'STAFF') ?? null
  ), [accounts]);

  useEffect(() => {
    if (!providedUsers) {
      return;
    }

    setAccounts(providedUsers);
    setIsLoading(false);
    setPageError(null);
  }, [providedUsers]);

  useEffect(() => {
    if (!adminAccount) {
      setAdminUsername('');
      return;
    }

    setAdminUsername(adminAccount.username);
  }, [adminAccount]);

  useEffect(() => {
    if (!primaryStaffAccount) {
      setStaffUsername('');
      return;
    }

    setStaffUsername(primaryStaffAccount.username);
  }, [primaryStaffAccount]);

  useEffect(() => {
    if (isLocalMode) {
      return;
    }

    let cancelled = false;

    /**
     * Handles load users for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setPageError(null);
        const users = await listSystemUsers();

        if (!cancelled) {
          setAccounts(users);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load profile records';
          setPageError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isLocalMode]);

  /**
   * Handles handle admin submit for route-level dashboard orchestration.
   *
   * @param event Input consumed by handle admin submit.
   * @returns A promise that resolves when processing completes.
   */
  const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminAccount) {
      setPageError('Admin account record was not found.');
      return;
    }

    const trimmedUsername = adminUsername.trim();
    const hasUsernameChange = trimmedUsername.length > 0 && trimmedUsername !== adminAccount.username;
    const hasPasswordChange = adminPassword.trim().length > 0;

    if (!hasUsernameChange && !hasPasswordChange) {
      setPageError('Provide a new admin username or password before saving.');
      return;
    }

    const payload = {
      username: hasUsernameChange ? trimmedUsername : undefined,
      newPassword: hasPasswordChange ? adminPassword : undefined,
    };

    try {
      setPageError(null);
      setSuccessMessage(null);

      if (isLocalMode) {
        setAccounts((prev) => applyLocalUpdate(prev, adminAccount.id, payload.username));
      } else {
        const updatedAdmin = await updateOwnProfile(payload);
        setAccounts((prev) => prev.map((user) => (user.id === updatedAdmin.id ? updatedAdmin : user)));
      }

      if (payload.username) {
        const updatedUsername = payload.username.trim();
        if (updatedUsername) {
          window.sessionStorage.setItem('authUsername', updatedUsername);
          window.dispatchEvent(new Event(USERNAME_UPDATED_EVENT));
        }
      }

      setAdminPassword('');
      setSuccessMessage('Admin credentials updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update admin profile';
      setPageError(message);
    }
  };

  /**
   * Handles handle staff submit for route-level dashboard orchestration.
   *
   * @param event Input consumed by handle staff submit.
   * @returns A promise that resolves when processing completes.
   */
  const handleStaffSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!primaryStaffAccount) {
      setPageError('Staff account record was not found.');
      return;
    }

    const trimmedUsername = staffUsername.trim();
    const hasUsernameChange = trimmedUsername.length > 0 && trimmedUsername !== primaryStaffAccount.username;
    const hasPasswordChange = staffPassword.trim().length > 0;

    if (!hasUsernameChange && !hasPasswordChange) {
      setPageError('Provide a new staff username or password before saving.');
      return;
    }

    const payload = {
      username: hasUsernameChange ? trimmedUsername : undefined,
      newPassword: hasPasswordChange ? staffPassword : undefined,
    };

    try {
      setPageError(null);
      setSuccessMessage(null);

      if (isLocalMode) {
        setAccounts((prev) => applyLocalUpdate(prev, primaryStaffAccount.id, payload.username));
      } else {
        const updatedStaff = await updateUserProfile(primaryStaffAccount.id, payload);
        setAccounts((prev) => prev.map((user) => (user.id === updatedStaff.id ? updatedStaff : user)));
      }

      setStaffPassword('');
      setSuccessMessage('Staff credentials updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update staff profile';
      setPageError(message);
    }
  };

  return (
    <div className="relative min-h-full">
      <div className="flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">Profiles</h1>
      </div>

      <div className="max-w-5xl mx-auto space-y-5">
        {isLoading && (
          <div className="text-sm text-neutral-500">Loading profile records...</div>
        )}

        {pageError && (
          <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {pageError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            {successMessage}
          </div>
        )}

        <section className="border border-neutral-300 bg-surface-alt px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2 border-b border-neutral-300 pb-4">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-primary">Owner / Admin</h2>
          </div>

          {adminAccount ? (
            <>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Role</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${roleBadgeClass(adminAccount.role)}`}>
                    {adminAccount.role}
                  </span>
                </article>

                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Created At</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-secondary">
                    <CalendarDays size={14} className="text-primary" />
                    {formatAccountDate(adminAccount.createdAt)}
                  </p>
                </article>

                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Last Updated</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-secondary">
                    <CalendarDays size={14} className="text-primary" />
                    {formatAccountDate(adminAccount.updatedAt)}
                  </p>
                </article>
              </div>

              <form onSubmit={handleAdminSubmit} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-secondary">
                  <span className="mb-1 block font-medium">Admin Username</span>
                  <input
                    value={adminUsername}
                    onChange={(event) => setAdminUsername(event.target.value)}
                    placeholder="Admin username"
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  />
                </label>

                <label className="text-sm text-secondary">
                  <span className="mb-1 block font-medium">Admin Password</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Admin new password"
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  />
                </label>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-text-light hover:bg-primary-dark transition-colors"
                  >
                    Save Admin Profile
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-500">
              No admin account available.
            </div>
          )}
        </section>

        <section className="border border-neutral-300 bg-surface-alt px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2 border-b border-neutral-300 pb-4">
            <Users size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-primary">Staff</h2>
          </div>

          {primaryStaffAccount ? (
            <>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Role</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${roleBadgeClass(primaryStaffAccount.role)}`}>
                    {primaryStaffAccount.role}
                  </span>
                </article>

                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Created At</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-secondary">
                    <CalendarDays size={14} className="text-primary" />
                    {formatAccountDate(primaryStaffAccount.createdAt)}
                  </p>
                </article>

                <article className="rounded-md border border-neutral-300 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Last Updated</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-secondary">
                    <CalendarDays size={14} className="text-primary" />
                    {formatAccountDate(primaryStaffAccount.updatedAt)}
                  </p>
                </article>
              </div>

              <form onSubmit={handleStaffSubmit} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-secondary">
                  <span className="mb-1 block font-medium">Staff Username</span>
                  <input
                    value={staffUsername}
                    onChange={(event) => setStaffUsername(event.target.value)}
                    placeholder="Staff username"
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  />
                </label>

                <label className="text-sm text-secondary">
                  <span className="mb-1 block font-medium">Staff Password</span>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(event) => setStaffPassword(event.target.value)}
                    placeholder="Staff new password"
                    className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  />
                </label>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-text-light hover:bg-primary-dark transition-colors"
                  >
                    Save Staff Profile
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-500">
              No staff account available.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
