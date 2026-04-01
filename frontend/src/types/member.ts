/** Member status types */
export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

/** Full member model used across the app */
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
