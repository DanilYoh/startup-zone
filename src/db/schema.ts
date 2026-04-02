import { pgTable, text, serial, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  supabaseId: text('supabase_id').notNull().unique(),
  email: text('email').notNull(),
  role: varchar('role', { length: 20 }).notNull(), // founder | investor | developer
  createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  fullName: text('full_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  location: text('location'),
  website: text('website'),
  updatedAt: timestamp('updated_at').defaultNow(),
});