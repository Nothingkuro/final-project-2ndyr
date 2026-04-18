import { API_BASE_URL } from './apiBaseUrl';

export const refreshSession = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    sessionStorage.removeItem('authRole');
    sessionStorage.removeItem('authUsername');
    window.location.href = '/';
  }
};
