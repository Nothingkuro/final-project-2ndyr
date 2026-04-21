type SameSiteMode = 'lax' | 'strict' | 'none';

const DATABASE_URL_PREFIX = 'DATABASE_URL=';
const DEFAULT_NODE_ENV = 'development';
const DEFAULT_SESSION_TTL = '5m';
const DEFAULT_COOKIE_NAME = 'arrowhead_session';
const DEV_JWT_SECRET = 'dev-only-change-this-secret';
const DEFAULT_PROD_COOKIE_SAME_SITE: SameSiteMode = 'none';
const DEFAULT_NON_PROD_COOKIE_SAME_SITE: SameSiteMode = 'lax';
const DEFAULT_BCRYPT_ROUNDS = 10;

/**
 * Centralized configuration manager backed by process.env.
 *
 * This singleton keeps environment access consistent, immutable, and testable.
 */
export class ConfigManager {
	private static instance: ConfigManager | undefined;

	public readonly nodeEnv: string;
	public readonly databaseUrl: string | undefined;
	public readonly jwtSecret: string;
	public readonly authCookieName: string;
	public readonly sessionTtl: string;
	public readonly authCookieSameSite: SameSiteMode;
	public readonly authCookieSecure: boolean;
	public readonly bcryptRounds: number;

	private constructor() {
		this.nodeEnv = process.env.NODE_ENV ?? DEFAULT_NODE_ENV;
		this.databaseUrl = this.normalizeDatabaseUrl(process.env.DATABASE_URL);
		this.jwtSecret = this.resolveJwtSecret();
		this.authCookieName = process.env.AUTH_COOKIE_NAME ?? DEFAULT_COOKIE_NAME;
		this.sessionTtl = process.env.SESSION_TTL ?? DEFAULT_SESSION_TTL;
		this.authCookieSameSite = this.resolveAuthCookieSameSite();
		this.authCookieSecure = this.resolveAuthCookieSecure(this.authCookieSameSite);
		this.bcryptRounds = this.resolveBcryptRounds();

		this.validateEnv();
	}

	public static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}

		return ConfigManager.instance;
	}

	public static _resetForTesting(): void {
		ConfigManager.instance = undefined;
	}

	private validateEnv(): void {
		if (this.nodeEnv !== 'production') {
			return;
		}

		if (!this.jwtSecret) {
			throw new Error('JWT_SECRET environment variable is required in production');
		}

		if (!this.databaseUrl) {
			throw new Error('DATABASE_URL environment variable is required in production');
		}
	}

	private resolveJwtSecret(): string {
		if (process.env.JWT_SECRET) {
			return process.env.JWT_SECRET;
		}

		if (this.nodeEnv !== 'production') {
			return DEV_JWT_SECRET;
		}

		// validateEnv also guards this path, but we fail fast for direct access too.
		throw new Error('JWT_SECRET environment variable is required in production');
	}

	private resolveAuthCookieSameSite(): SameSiteMode {
		const configuredValue = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase();

		if (configuredValue === 'lax' || configuredValue === 'strict' || configuredValue === 'none') {
			return configuredValue;
		}

		return this.nodeEnv === 'production'
			? DEFAULT_PROD_COOKIE_SAME_SITE
			: DEFAULT_NON_PROD_COOKIE_SAME_SITE;
	}

	private resolveAuthCookieSecure(sameSite: SameSiteMode): boolean {
		const configuredValue = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

		if (configuredValue === 'true') {
			return true;
		}

		if (configuredValue === 'false') {
			return sameSite === 'none';
		}

		return this.nodeEnv === 'production' || sameSite === 'none';
	}

	private resolveBcryptRounds(): number {
		const parsed = Number(process.env.BCRYPT_ROUNDS);

		if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
			return DEFAULT_BCRYPT_ROUNDS;
		}

		return parsed;
	}

	private normalizeDatabaseUrl(rawValue: string | undefined | null): string | undefined {
		if (!rawValue) {
			return undefined;
		}

		let normalizedValue = rawValue.trim();

		if (normalizedValue.startsWith(DATABASE_URL_PREFIX)) {
			normalizedValue = normalizedValue.slice(DATABASE_URL_PREFIX.length).trim();
		}

		const isWrappedInQuotes =
			(normalizedValue.startsWith('"') && normalizedValue.endsWith('"'))
			|| (normalizedValue.startsWith("'") && normalizedValue.endsWith("'"));

		if (isWrappedInQuotes) {
			normalizedValue = normalizedValue.slice(1, -1).trim();
		}

		return normalizedValue || undefined;
	}
}

export default ConfigManager;
