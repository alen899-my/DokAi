import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Server
  PORT:     parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // JWT
  JWT_SECRET:        requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN:    process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_SECRET:    requireEnv('REFRESH_SECRET'),
  REFRESH_EXPIRES_IN:process.env.REFRESH_EXPIRES_IN || '7d',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Google OAuth
  GOOGLE_CLIENT_ID:     requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  FRONTEND_CALLBACK_URL:process.env.FRONTEND_CALLBACK_URL || 'http://localhost:3000/auth/callback',
  GROQ_API_KEY: requireEnv('GROQ_API_KEY'),
};