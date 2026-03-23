import { SafeUser } from '../../models/user/user.types';
import { AuthTokens } from '../../types/common.types';

// Register request body
export interface RegisterInput {
  name:     string;
  email:    string;
  password: string;
}

// Login request body
export interface LoginInput {
  email:    string;
  password: string;
}

// Refresh token request body
export interface RefreshTokenInput {
  refreshToken: string;
}

// What auth service returns after register/login
export interface AuthResult {
  user:   SafeUser;
  tokens: AuthTokens;
}