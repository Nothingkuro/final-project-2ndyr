// Determine API base URL based on environment
export const API_BASE_URL = (() => {
  // Check if explicitly configured
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured;
  }

  // In production (Vercel), use same-origin API
  // Vercel's rewrite rules automatically route /api to the backend
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development, use localhost backend
  return 'http://localhost:5001';
})();
