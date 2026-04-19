/** Member status types */
/**
 * Type alias for member status in frontend domain models.
 */
export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

/** Full member model used across the app */
/**
 * Defines member used by frontend domain models.
 */
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  joinDate: string;
  expiryDate: string;
  status: MemberStatus;
  notes: string;
}
