import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Prevent dotenv from loading the real .env file (which would override test values)
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

describe('env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('applies default values when optional vars are absent', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.PORT;
    delete process.env.CLIENT_URL;

    const { env } = await import('./env.js');

    expect(env.PORT).toBe(5051);
    expect(env.CLIENT_URL).toBe('http://localhost:5050');
    expect(env.NODE_ENV).toBe('test');
  });

  it('reads PORT as a number when set', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '9999';

    const { env } = await import('./env.js');

    expect(env.PORT).toBe(9999);
  });

  it('exposes convenience boolean flags', async () => {
    process.env.NODE_ENV = 'test';

    const { env } = await import('./env.js');

    expect(env.isTest).toBe(true);
    expect(env.isDevelopment).toBe(false);
    expect(env.isProduction).toBe(false);
  });

  it('sets isDevelopment true when NODE_ENV is development', async () => {
    process.env.NODE_ENV = 'development';

    const { env } = await import('./env.js');

    expect(env.isDevelopment).toBe(true);
    expect(env.isTest).toBe(false);
    expect(env.isProduction).toBe(false);
  });

  it('sets isProduction true when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';

    const { env } = await import('./env.js');

    expect(env.isProduction).toBe(true);
    expect(env.isDevelopment).toBe(false);
    expect(env.isTest).toBe(false);
  });

  it('exits with code 1 when NODE_ENV is an invalid value', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as () => never);
    process.env.NODE_ENV = 'staging';

    try {
      await import('./env.js');
    } catch {
      // expected: module throws after mocked exit because parsed.data is undefined
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits with code 1 when PORT is not a number', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as () => never);
    process.env.NODE_ENV = 'test';
    process.env.PORT = 'not-a-number';

    try {
      await import('./env.js');
    } catch {
      // expected: module throws after mocked exit because parsed.data is undefined
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
