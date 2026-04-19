const FALLBACK_API_BASE_URL = 'http://localhost:5001';

/**
 * Handles normalize base url logic for API integration behavior.
 *
 * @param value Input used by normalize base url.
 * @returns Computed value for the caller.
 */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

/**
 * Handles to api origin logic for API integration behavior.
 *
 * @param value Input used by to api origin.
 * @returns Computed value for the caller.
 */
function toApiOrigin(value: string): string {
  if (!value) {
    return '';
  }

  if (value.startsWith('/')) {
    return '';
  }

  try {
    const parsedUrl = new URL(value);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch {
    return '';
  }
}

/**
 * Handles is frontend origin logic for API integration behavior.
 *
 * @param url Input used by is frontend origin.
 * @returns Computed value for the caller.
 */
function isFrontendOrigin(url: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

const configuredBaseUrlRaw = typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ? import.meta.env.VITE_API_BASE_URL
  : '';

const configuredBaseUrl = configuredBaseUrlRaw
  ? toApiOrigin(normalizeBaseUrl(configuredBaseUrlRaw))
  : '';

export const API_BASE_URL = configuredBaseUrl && !isFrontendOrigin(configuredBaseUrl)
  ? configuredBaseUrl
  : FALLBACK_API_BASE_URL;
