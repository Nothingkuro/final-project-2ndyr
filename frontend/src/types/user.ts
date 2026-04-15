export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
