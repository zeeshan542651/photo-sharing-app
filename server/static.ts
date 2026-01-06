import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  let distPath: string;

  // Handle both ESM and CJS builds
  if (typeof __dirname !== "undefined") {
    // CJS build - __dirname is the dist folder
    distPath = path.resolve(__dirname, "public");
  } else {
    // ESM build
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    distPath = path.resolve(currentDir, "public");
  }

  // Fallback: check if we're running from project root
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(
    express.static(distPath, {
      maxAge: "1d",
      etag: true,
    })
  );
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
