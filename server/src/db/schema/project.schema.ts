import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const projects = pgTable('projects', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for v1 guests
  idea:         text('idea').notNull(),
  modelUsed:    varchar('model_used', { length: 255 }).notNull(),
  documentData: jsonb('document_data').default({}).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
