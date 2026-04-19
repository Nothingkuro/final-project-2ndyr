/**
 * Type alias for user role in frontend domain models.
 */
export type UserRole = 'ADMIN' | 'STAFF';

/**
 * Defines user used by frontend domain models.
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
