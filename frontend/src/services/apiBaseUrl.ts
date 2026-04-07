const FALLBACK_API_BASE_URL = 'http://localhost:5001';

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

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

const configuredBaseUrlRaw = typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ? import.meta.env.VITE_API_BASE_URL
  : '';

const configuredBaseUrl = configuredBaseUrlRaw
  ? toApiOrigin(normalizeBaseUrl(configuredBaseUrlRaw))
  : '';

function getDefaultApiBaseUrl(): string {
  // In production, use same-domain API (Vercel rewrites /api to backend)
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    return '';
  }

  return FALLBACK_API_BASE_URL;
}

export const API_BASE_URL = configuredBaseUrl || getDefaultApiBaseUrl();
