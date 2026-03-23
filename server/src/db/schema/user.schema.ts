import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'pro']);

export const users = pgTable('users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  name:         varchar('name', { length: 255 }).notNull(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),           // nullable — Google users have no password
  googleId:     varchar('google_id', { length: 255 }).unique(), // nullable — email users have no googleId
  avatar:       text('avatar'),                  // Google profile picture URL
  plan:         planEnum('plan').default('free').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at', { withTimezone: true }),
});