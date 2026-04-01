export interface AuthUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}

export interface SessionTokenPayload {
  sub: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
}
