/**
 * Environment configuration helpers.
 *
 * In Next.js, NEXT_PUBLIC_* variables are inlined at build time.
 * The `config` object is evaluated at module load time, which is fine
 * for build-time inlining.
 *
 * The `buildConfig` factory accepts an explicit env map so that
 * property-based tests can exercise the config logic without touching
 * real environment variables.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Config] Required environment variable "${name}" is not set. ` +
      `Check your .env.local or deployment environment.`
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

/**
 * Factory function that builds a config object from an arbitrary env map.
 * Defaults to `process.env` so production usage requires no arguments.
 * Pass a custom map in tests to avoid mutating the real environment.
 */
export function buildConfig(env: Record<string, string | undefined> = process.env) {
  const apiBaseUrl = env['NEXT_PUBLIC_API_BASE_URL'];
  if (!apiBaseUrl) {
    throw new Error(
      '[Config] Required environment variable "NEXT_PUBLIC_API_BASE_URL" is not set. ' +
      'Check your .env.local or deployment environment.'
    );
  }
  return {
    apiBaseUrl,
    apiTimeoutMs: parseInt(env['NEXT_PUBLIC_API_TIMEOUT_MS'] ?? '10000', 10),
    enableMocks: (env['NEXT_PUBLIC_ENABLE_MOCKS'] ?? 'false') === 'true',
  } as const;
}

/**
 * Singleton config object — lazily evaluated on first property access.
 * Using a Proxy defers `requireEnv` until the value is actually read,
 * which allows test files to import `buildConfig` without triggering
 * validation of the real process.env at module load time.
 *
 * All application code should import from here; no file should read
 * `process.env` directly.
 */
let _config: ReturnType<typeof buildConfig> | undefined;

function getConfig(): ReturnType<typeof buildConfig> {
  if (!_config) {
    _config = buildConfig(process.env as Record<string, string | undefined>);
  }
  return _config;
}

export const config: ReturnType<typeof buildConfig> = new Proxy(
  {} as ReturnType<typeof buildConfig>,
  {
    get(_target, prop: string) {
      return getConfig()[prop as keyof ReturnType<typeof buildConfig>];
    },
  }
);
