import type { User } from '../types/user';
import { getAuthHeaders } from './authHeaders';
import { API_BASE_URL } from './apiBaseUrl';

/**
 * Type alias for users response in API integration behavior.
 */
type UsersResponse = {
  users: User[];
};

/**
 * Type alias for user response in API integration behavior.
 */
type UserResponse = {
  user: User;
};

/**
 * Type alias for update profile payload in API integration behavior.
 */
type UpdateProfilePayload = {
  username?: string;
  newPassword?: string;
};

/**
 * Handles make request logic for API integration behavior.
 *
 * @param endpoint Input used by make request.
 * @param options Input used by make request.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const data = (await response.json()) as { error?: string };
      if (typeof data.error === 'string' && data.error.trim().length > 0) {
        message = data.error;
      }
    } catch {
      // Keep fallback message if body is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Handles list system users logic for API integration behavior.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function listSystemUsers(): Promise<User[]> {
  const response = await makeRequest<UsersResponse>('/users', { method: 'GET' });
  return response.users;
}

/**
 * Handles update own profile logic for API integration behavior.
 *
 * @param payload Input used by update own profile.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function updateOwnProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await makeRequest<UserResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
}

/**
 * Handles update user profile logic for API integration behavior.
 *
 * @param userId Input used by update user profile.
 * @param payload Input used by update user profile.
 * @returns A promise that resolves when processing is complete.
 * @throws {Error} When the backend request fails or returns invalid data.
 */
export async function updateUserProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
  const response = await makeRequest<UserResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
}
