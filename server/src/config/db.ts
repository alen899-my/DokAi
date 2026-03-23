import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema/index';
import { env } from './env';

// Create Neon HTTP client using connection string from env
const sql = neon(env.DATABASE_URL);

// Create Drizzle instance with full schema for type safety
export const db = drizzle(sql, { schema });

// Export the type so route handlers can type the db param if needed
export type Database = typeof db;