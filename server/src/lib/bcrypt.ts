import bcrypt from 'bcryptjs';
import { CONSTANTS } from '../config/constants';

// Hash a plain text password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, CONSTANTS.BCRYPT_SALT_ROUNDS);
}

// Compare plain text password with hashed password
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}