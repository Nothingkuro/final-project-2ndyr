/**
 * Handles get auth token logic for API integration behavior.
 * @returns Computed value for the caller.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem('authToken');
}

/**
 * Handles get auth headers logic for API integration behavior.
 * @returns Computed value for the caller.
 */
export function getAuthHeaders(): Record<string, string> {
  const authToken = getAuthToken();

  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}