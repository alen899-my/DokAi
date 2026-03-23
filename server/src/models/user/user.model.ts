import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { users } from '../../db/schema';
import {
  CreateUserInput,
  CreateGoogleUserInput,
  SafeUser,
  User,
} from './user.types';

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

// Find user by Google ID
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);
  return result[0] ?? null;
}

// Check if email already exists
export async function emailExists(email: string): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0;
}

// Create user with email/password
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const result = await db
    .insert(users)
    .values({
      name:         input.name,
      email:        input.email,
      passwordHash: input.passwordHash,
    })
    .returning({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      googleId:  users.googleId,
      avatar:    users.avatar,
      plan:      users.plan,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  return result[0];
}

// Find existing Google user or create new one
export async function findOrCreateGoogleUser(
  input: CreateGoogleUserInput
): Promise<SafeUser> {
  // 1. Try find by googleId first
  const existingByGoogleId = await findUserByGoogleId(input.googleId);
  if (existingByGoogleId) {
    return {
      id:        existingByGoogleId.id,
      name:      existingByGoogleId.name,
      email:     existingByGoogleId.email,
      googleId:  existingByGoogleId.googleId,
      avatar:    existingByGoogleId.avatar,
      plan:      existingByGoogleId.plan,
      createdAt: existingByGoogleId.createdAt,
      updatedAt: existingByGoogleId.updatedAt,
    };
  }

  // 2. Try find by email — user may have registered with email before
  const existingByEmail = await findUserByEmail(input.email);
  if (existingByEmail) {
    // Link Google ID to existing account
    const updated = await db
      .update(users)
      .set({
        googleId: input.googleId,
        avatar:   input.avatar,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingByEmail.id))
      .returning({
        id:        users.id,
        name:      users.name,
        email:     users.email,
        googleId:  users.googleId,
        avatar:    users.avatar,
        plan:      users.plan,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return updated[0];
  }

  // 3. Create brand new Google user
  const created = await db
    .insert(users)
    .values({
      name:     input.name,
      email:    input.email,
      googleId: input.googleId,
      avatar:   input.avatar,
    })
    .returning({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      googleId:  users.googleId,
      avatar:    users.avatar,
      plan:      users.plan,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
  return created[0];
}