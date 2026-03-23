export const CONSTANTS = {
  // Bcrypt
  BCRYPT_SALT_ROUNDS: 10,

  // JWT
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',

  // Rate limiting
  AUTH_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_RATE_LIMIT_MAX: 10,                     // max 10 requests per window

  // API
  API_VERSION: 'v1',
  API_PREFIX: '/api/v1',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;