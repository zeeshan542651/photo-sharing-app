import type { Express } from "express";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  ObjectAccessDeniedError,
} from "./objectStorage";

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const { uploadUrl, objectPath } =
        await objectStorageService.generateUploadUrl();

      res.json({
        uploadURL: uploadUrl,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/api/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectPath = req.path;
      const blobClient = await objectStorageService.getBlobClient(objectPath);

      // @ts-ignore - Get user ID if authenticated for access control
      const userId = req.isAuthenticated?.() ? req.user?.id : undefined;

      return await objectStorageService.downloadObject(blobClient, res, userId);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      if (error instanceof ObjectAccessDeniedError) {
        return res.status(403).json({ error: "Access denied" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
