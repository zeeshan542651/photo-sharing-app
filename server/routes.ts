import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  insertPhotoSchema,
  insertCommentSchema,
  insertRatingSchema,
} from "@shared/schema";
import {
  objectStorageClient,
  registerObjectStorageRoutes,
} from "./integrations/object_storage";

async function seedDatabase() {
  const existingCreator = await storage.getUserByUsername("creator_user");
  if (!existingCreator) {
    const creatorPassword = await hashPassword("creator123");
    const consumerPassword = await hashPassword("consumer123");

    const creator = await storage.createUser({
      username: "creator_user",
      password: creatorPassword,
      role: "creator",
    });

    const consumer = await storage.createUser({
      username: "consumer_user",
      password: consumerPassword,
      role: "consumer",
    });

    // Seed some photos
    const photo1 = await storage.createPhoto({
      userId: creator.id,
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      title: "Majestic Mountains",
      caption: "A beautiful view of the sunrise over the mountains.",
      location: "Yosemite National Park",
      peoplePresent: "Self",
    });

    const photo2 = await storage.createPhoto({
      userId: creator.id,
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
      title: "Serene Forest",
      caption: "Deep in the heart of the ancient woods.",
      location: "Black Forest, Germany",
      peoplePresent: "Nature",
    });

    // Seed some interactions
    await storage.createComment({
      userId: consumer.id,
      photoId: photo1.id,
      content: "Stunning shot! The lighting is perfect.",
    });

    await storage.createOrUpdateRating({
      userId: consumer.id,
      photoId: photo1.id,
      rating: 5,
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerObjectStorageRoutes(app);
  await seedDatabase();

  // Profile routes
  app.get(api.auth.getProfile.path, async (req, res) => {
    const id = Number(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch(api.auth.updateProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const parsed = api.auth.updateProfile.input.parse(req.body);
    // @ts-ignore
    const updatedUser = await storage.updateUser(req.user.id, parsed);
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  });

  // Photos
  app.get(api.photos.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    // @ts-ignore - Pass user ID if authenticated to get their ratings
    const userId = req.isAuthenticated() ? req.user?.id : undefined;
    const results = await storage.getPhotos(search, userId);
    res.json(results);
  });

  app.get(api.photos.get.path, async (req, res) => {
    const id = Number(req.params.id);
    // @ts-ignore - Pass user ID if authenticated to get their rating
    const userId = req.isAuthenticated() ? req.user?.id : undefined;
    const photo = await storage.getPhoto(id, userId);
    if (!photo) return res.status(404).json({ message: "Photo not found" });
    res.json(photo);
  });

  app.post(api.photos.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    // @ts-ignore
    if (req.user.role !== "creator")
      return res.status(403).send("Only creators can upload");

    const parsed = insertPhotoSchema.parse(req.body);
    // @ts-ignore
    const userId = req.user.id;

    // Set ACL policy on uploaded photo (make it public and set owner)
    if (parsed.url && parsed.url.startsWith("/api/objects/")) {
      try {
        await objectStorageClient.trySetObjectAclPolicy(parsed.url, {
          owner: String(userId),
          visibility: "public",
        });
      } catch (error) {
        console.error("Failed to set ACL policy:", error);
      }
    }

    const photo = await storage.createPhoto({ ...parsed, userId });
    res.status(201).json(photo);
  });

  // Comments
  app.post(api.comments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const photoId = Number(req.params.photoId);
    const parsed = insertCommentSchema.parse(req.body);
    // @ts-ignore
    const comment = await storage.createComment({
      ...parsed,
      userId: req.user.id,
      photoId,
    });
    res.status(201).json(comment);
  });

  // Ratings - now supports updating existing ratings
  app.post(api.ratings.rate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const photoId = Number(req.params.photoId);
    const parsed = insertRatingSchema.parse(req.body);
    // @ts-ignore
    const rating = await storage.createOrUpdateRating({
      ...parsed,
      userId: req.user.id,
      photoId,
    });
    res.status(201).json(rating);
  });

  return httpServer;
}
