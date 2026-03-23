import { AppError } from '../../middleware/error.middleware';
import { findUserByEmail, createUser, emailExists } from '../../models/user/user.model';
import { hashPassword, comparePassword } from '../../lib/bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { RegisterInput, LoginInput, RefreshTokenInput, AuthResult } from './auth.types';
import { AuthTokens } from '../../types/common.types';

// Register a new user
export async function registerService(input: RegisterInput): Promise<AuthResult> {
  const { name, email, password } = input;

  // Check if email already taken
  const exists = await emailExists(email);
  if (exists) {
    throw new AppError('Email is already registered', 409);
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create user in DB
  const user = await createUser({ name, email, passwordHash });

  // Sign tokens
  const tokens = generateTokens(user.id, user.email, user.plan);

  return { user, tokens };
}

// Login existing user
export async function loginService(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    // Use same message for both wrong email and wrong password
    // This prevents email enumeration attacks
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  if (!user.passwordHash) {
    // This user registered via Google and doesn't have a password
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Build safe user (no passwordHash)
  const safeUser = {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    googleId:  user.googleId,
    avatar:    user.avatar,
    plan:      user.plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Sign tokens
  const tokens = generateTokens(user.id, user.email, user.plan);

  return { user: safeUser, tokens };
}

// Refresh access token using refresh token
export async function refreshTokenService(input: RefreshTokenInput): Promise<AuthTokens> {
  const { refreshToken } = input;

  try {
    // Verify refresh token — throws if invalid or expired
    const payload = verifyRefreshToken(refreshToken);

    // Issue new token pair
    const tokens = generateTokens(payload.userId, payload.email, payload.plan);

    return tokens;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

// Helper — generate access + refresh token pair
function generateTokens(userId: string, email: string, plan: 'free' | 'pro'): AuthTokens {
  const payload = { userId, email, plan };

  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}