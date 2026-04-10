export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem('authToken');
}

export function getAuthHeaders(): Record<string, string> {
  const authToken = getAuthToken();

  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}