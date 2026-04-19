const DATABASE_URL_PREFIX = 'DATABASE_URL=';

/**
 * Normalizes DATABASE_URL values copied from shell exports or .env files.
 *
 * This prevents startup failures when developers paste values that still include
 * `DATABASE_URL=` prefixes or wrapping quotes.
 *
 * @param rawValue Raw environment value.
 * @returns Clean connection string, or undefined when input is empty.
 */
export function normalizeDatabaseUrl(rawValue: string | undefined | null): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  let normalizedValue = rawValue.trim();

  if (normalizedValue.startsWith(DATABASE_URL_PREFIX)) {
    normalizedValue = normalizedValue.slice(DATABASE_URL_PREFIX.length).trim();
  }

  const isWrappedInQuotes =
    (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
    (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"));

  if (isWrappedInQuotes) {
    normalizedValue = normalizedValue.slice(1, -1).trim();
  }

  return normalizedValue || undefined;
}
