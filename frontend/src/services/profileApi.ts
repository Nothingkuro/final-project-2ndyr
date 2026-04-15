import type { User } from '../types/user';
import { getAuthHeaders } from './authHeaders';
import { API_BASE_URL } from './apiBaseUrl';

type UsersResponse = {
  users: User[];
};

type UserResponse = {
  user: User;
};

type UpdateProfilePayload = {
  username?: string;
  newPassword?: string;
};

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

export async function listSystemUsers(): Promise<User[]> {
  const response = await makeRequest<UsersResponse>('/users', { method: 'GET' });
  return response.users;
}

export async function updateOwnProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await makeRequest<UserResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
}

export async function updateUserProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
  const response = await makeRequest<UserResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.user;
}
