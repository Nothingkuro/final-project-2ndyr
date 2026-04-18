import {
  getSessionCookieName,
  getSessionCookieOptions,
  hashPassword,
  isBcryptHash,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from '../../../src/utils/auth';

describe('auth utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AUTH_COOKIE_NAME;
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_TTL;
    delete process.env.BCRYPT_ROUNDS;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses default session cookie name when env value is missing', () => {
    expect(getSessionCookieName()).toBe('arrowhead_session');
  });

  it('uses AUTH_COOKIE_NAME when provided', () => {
    process.env.AUTH_COOKIE_NAME = 'custom_cookie';

    expect(getSessionCookieName()).toBe('custom_cookie');
  });

  it('returns secure cookie options in production', () => {
    process.env.NODE_ENV = 'production';

    const options = getSessionCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe('none');
    expect(options.path).toBe('/');
    expect(options.maxAge).toBe(5 * 60 * 1000);
  });

  it('returns non-secure cookie options outside production', () => {
    process.env.NODE_ENV = 'development';

    expect(getSessionCookieOptions().secure).toBe(false);
  });

  it('detects bcrypt hash format correctly', () => {
    const validHash = '$2b$10$5j4QrtFjXb.A0xDo4d4j2.VvK4w9oBLQdz3hIcsn7aR3G14fIa8Ju';

    expect(isBcryptHash(validHash)).toBe(true);
    expect(isBcryptHash('plain-text-password')).toBe(false);
    expect(isBcryptHash('')).toBe(false);
  });

  it('hashes password and verifies it as bcrypt', async () => {
    process.env.BCRYPT_ROUNDS = '4';
    const password = 'MyStrongPassword123!';

    const hashed = await hashPassword(password);

    expect(isBcryptHash(hashed)).toBe(true);
    await expect(verifyPassword(password, hashed)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hashed)).resolves.toBe(false);
  });

  it('supports legacy plain-text password comparison fallback', async () => {
    await expect(verifyPassword('secret', 'secret')).resolves.toBe(true);
    await expect(verifyPassword('secret', 'different')).resolves.toBe(false);
  });

  it('signs and verifies session token with explicit JWT secret', () => {
    process.env.JWT_SECRET = 'unit-test-secret';

    const token = signSessionToken({
      id: 'user-id-1',
      username: 'staff-user',
      role: 'STAFF',
    });

    const payload = verifySessionToken(token);

    expect(payload.sub).toBe('user-id-1');
    expect(payload.username).toBe('staff-user');
    expect(payload.role).toBe('STAFF');
  });

  it('uses development fallback secret when JWT_SECRET is missing outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;

    const token = signSessionToken({
      id: 'user-id-2',
      username: 'dev-user',
      role: 'ADMIN',
    });

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('throws when signing token without JWT_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() =>
      signSessionToken({
        id: 'user-id-3',
        username: 'prod-user',
        role: 'STAFF',
      })
    ).toThrow('JWT_SECRET environment variable is required in production');
  });

  it('throws for malformed token verification', () => {
    process.env.JWT_SECRET = 'another-test-secret';

    expect(() => verifySessionToken('not-a-valid-token')).toThrow();
  });
});
