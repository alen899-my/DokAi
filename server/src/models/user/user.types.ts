import { users } from '../../db/schema';

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Safe user — never expose passwordHash
export type SafeUser = Omit<User, 'passwordHash' | 'deletedAt'>;

// Create user with email/password
export type CreateUserInput = {
  name:         string;
  email:        string;
  passwordHash: string;
};

// Create user with Google
export type CreateGoogleUserInput = {
  name:     string;
  email:    string;
  googleId: string;
  avatar?:  string;
};