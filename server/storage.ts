import { db } from "./db";
import {
  users, photos, comments, ratings,
  type User, type SafeUser, type InsertUser,
  type Photo, type InsertPhoto,
  type Comment, type InsertComment,
  type Rating, type InsertRating
} from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import pg from "pg";

function sanitizeUser(user: User): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}

export interface PhotoWithRatings extends Photo {
  creator: SafeUser;
  averageRating: number | null;
  ratingCount: number;
  currentUserRating?: number | null;
}

export interface PhotoDetailWithRatings extends PhotoWithRatings {
  comments: (Comment & { user: SafeUser })[];
}

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<{ displayName: string; profilePicture: string; bio: string }>): Promise<User>;

  // Photos - creators returned as SafeUser (no password)
  getPhotos(search?: string, userId?: number): Promise<PhotoWithRatings[]>;
  getPhoto(id: number, userId?: number): Promise<PhotoDetailWithRatings | undefined>;
  createPhoto(photo: InsertPhoto & { userId: number }): Promise<Photo>;

  // Comments & Ratings
  createComment(comment: InsertComment & { userId: number, photoId: number }): Promise<Comment>;
  createOrUpdateRating(rating: InsertRating & { userId: number, photoId: number }): Promise<Rating>;
  getUserRating(photoId: number, userId: number): Promise<number | null>;
}

const PgStore = connectPgSimple(session);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export class DatabaseStorage implements IStorage {
  sessionStore = new PgStore({ pool, createTableIfMissing: true });
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<{ displayName: string; profilePicture: string; bio: string }>): Promise<User> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async getPhotos(search?: string, userId?: number): Promise<PhotoWithRatings[]> {
    let query = db.select({
      photo: photos,
      creator: users,
      averageRating: sql<number>`avg(${ratings.rating})::numeric(10,1)`,
      ratingCount: sql<number>`count(${ratings.id})::int`
    })
    .from(photos)
    .innerJoin(users, eq(photos.userId, users.id))
    .leftJoin(ratings, eq(photos.id, ratings.photoId))
    .groupBy(photos.id, users.id)
    .orderBy(desc(photos.createdAt));

    if (search) {
      query.where(sql`${photos.title} ILIKE ${`%${search}%`} OR ${photos.location} ILIKE ${`%${search}%`}`);
    }

    const results = await query;
    
    // Get user's ratings if userId is provided
    let userRatingsMap: Map<number, number> = new Map();
    if (userId) {
      const userRatings = await db.select({
        photoId: ratings.photoId,
        rating: ratings.rating
      })
      .from(ratings)
      .where(eq(ratings.userId, userId));
      
      userRatings.forEach(r => userRatingsMap.set(r.photoId, r.rating));
    }

    return results.map(r => ({ 
      ...r.photo, 
      creator: sanitizeUser(r.creator), 
      averageRating: r.averageRating,
      ratingCount: r.ratingCount || 0,
      currentUserRating: userId ? (userRatingsMap.get(r.photo.id) || null) : null
    }));
  }

  async getPhoto(id: number, userId?: number): Promise<PhotoDetailWithRatings | undefined> {
    const [result] = await db.select({
      photo: photos,
      creator: users,
      averageRating: sql<number>`avg(${ratings.rating})::numeric(10,1)`,
      ratingCount: sql<number>`count(${ratings.id})::int`
    })
    .from(photos)
    .innerJoin(users, eq(photos.userId, users.id))
    .leftJoin(ratings, eq(photos.id, ratings.photoId))
    .where(eq(photos.id, id))
    .groupBy(photos.id, users.id);

    if (!result) return undefined;

    const photoComments = await db.select({
      comment: comments,
      user: users
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.photoId, id))
    .orderBy(desc(comments.createdAt));

    // Get user's rating if userId provided
    let currentUserRating: number | null = null;
    if (userId) {
      currentUserRating = await this.getUserRating(id, userId);
    }

    return {
      ...result.photo,
      creator: sanitizeUser(result.creator),
      averageRating: result.averageRating,
      ratingCount: result.ratingCount || 0,
      currentUserRating,
      comments: photoComments.map(c => ({ ...c.comment, user: sanitizeUser(c.user) }))
    };
  }

  async createPhoto(photo: InsertPhoto & { userId: number }): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async createComment(comment: InsertComment & { userId: number, photoId: number }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getUserRating(photoId: number, userId: number): Promise<number | null> {
    const [existingRating] = await db.select({ rating: ratings.rating })
      .from(ratings)
      .where(and(eq(ratings.photoId, photoId), eq(ratings.userId, userId)));
    return existingRating?.rating || null;
  }

  async createOrUpdateRating(rating: InsertRating & { userId: number, photoId: number }): Promise<Rating> {
    // Check if user already rated this photo
    const [existing] = await db.select()
      .from(ratings)
      .where(and(eq(ratings.photoId, rating.photoId), eq(ratings.userId, rating.userId)));

    if (existing) {
      // Update existing rating
      const [updatedRating] = await db.update(ratings)
        .set({ rating: rating.rating })
        .where(eq(ratings.id, existing.id))
        .returning();
      return updatedRating;
    } else {
      // Create new rating
      const [newRating] = await db.insert(ratings).values(rating).returning();
      return newRating;
    }
  }
}

export const storage = new DatabaseStorage();
