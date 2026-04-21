import ConfigManager from '../../../src/config/ConfigManager';

describe('singleton pattern (ConfigManager)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    ConfigManager._resetForTesting();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the same instance', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('loads configuration from process.env', () => {
    process.env.AUTH_COOKIE_NAME = 'test_cookie';
    process.env.BCRYPT_ROUNDS = '12';

    const config = ConfigManager.getInstance();

    expect(config.authCookieName).toBe('test_cookie');
    expect(config.bcryptRounds).toBe(12);
  });

  it('falls back to defaults when env is missing', () => {
    delete process.env.AUTH_COOKIE_NAME;
    delete process.env.BCRYPT_ROUNDS;

    const config = ConfigManager.getInstance();

    expect(config.authCookieName).toBe('arrowhead_session');
    expect(config.bcryptRounds).toBe(10);
  });

  it('throws in production when required variables are missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;

    expect(() => ConfigManager.getInstance()).toThrow('JWT_SECRET environment variable is required in production');
  });

  it('normalizes DATABASE_URL by removing prefix and quotes', () => {
    process.env.DATABASE_URL = 'DATABASE_URL=" postgresql://localhost "';

    const config = ConfigManager.getInstance();

    expect(config.databaseUrl).toBe('postgresql://localhost');
  });
});
