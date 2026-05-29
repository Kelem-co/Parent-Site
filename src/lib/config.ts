/**
 * Environment configuration helpers.
 *
 * In Next.js, NEXT_PUBLIC_* variables are inlined at build time using
 * static text replacement. They MUST be accessed as literal strings
 * (process.env.NEXT_PUBLIC_FOO), never via dynamic keys (env['NEXT_PUBLIC_FOO']),
 * or the bundler will not inline them and they will be undefined on the client.
 *
 * The `buildConfig` factory accepts an explicit env map so that
 * property-based tests can exercise the config logic without touching
 * real environment variables.
 */

/**
 * Factory function that builds a config object.
 * When called with no arguments (production), reads from process.env using
 * literal property access so Next.js can statically inline NEXT_PUBLIC_* vars.
 * When called with a custom map (tests), uses that map directly.
 */
export function buildConfig(env?: Record<string, string | undefined>) {
  // Use literal process.env access when no custom env is provided so the
  // Next.js bundler can statically inline NEXT_PUBLIC_* values on the client.
  const apiBaseUrl = env
    ? env['NEXT_PUBLIC_API_BASE_URL']
    : process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      '[Config] Required environment variable "NEXT_PUBLIC_API_BASE_URL" is not set. ' +
      'Check your .env.local or deployment environment.'
    );
  }

  const apiTimeoutMs = env
    ? env['NEXT_PUBLIC_API_TIMEOUT_MS']
    : process.env.NEXT_PUBLIC_API_TIMEOUT_MS;

  const enableMocks = env
    ? env['NEXT_PUBLIC_ENABLE_MOCKS']
    : process.env.NEXT_PUBLIC_ENABLE_MOCKS;

  return {
    apiBaseUrl,
    apiTimeoutMs: parseInt(apiTimeoutMs ?? '10000', 10),
    enableMocks: (enableMocks ?? 'false') === 'true',
  } as const;
}

/**
 * Singleton config object — lazily evaluated on first property access.
 * Using a Proxy defers buildConfig until the value is actually read,
 * which allows test files to import buildConfig without triggering
 * validation of the real process.env at module load time.
 *
 * All application code should import from here; no file should read
 * process.env directly.
 */
let _config: ReturnType<typeof buildConfig> | undefined;

function getConfig(): ReturnType<typeof buildConfig> {
  if (!_config) {
    _config = buildConfig();
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
