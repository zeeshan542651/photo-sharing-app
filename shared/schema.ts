import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["creator", "consumer"] }).default("consumer").notNull(),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Creator
  url: text("url").notNull(),
  title: text("title").notNull(),
  caption: text("caption"),
  location: text("location"),
  peoplePresent: text("people_present"), // Simple text for MVP or JSON array
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  photos: many(photos),
  comments: many(comments),
  ratings: many(ratings),
}));

export const photoRelations = relations(photos, ({ one, many }) => ({
  creator: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  comments: many(comments),
  ratings: many(ratings),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  photo: one(photos, {
    fields: [comments.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const ratingRelations = relations(ratings, ({ one }) => ({
  photo: one(photos, {
    fields: [ratings.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, createdAt: true, userId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true, photoId: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true, userId: true, photoId: true });

// Types
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'password'>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
