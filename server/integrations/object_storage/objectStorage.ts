import {
  BlobServiceClient,
  ContainerClient,
  BlobClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from "@azure/storage-blob";
import { Response } from "express";
import { randomUUID } from "crypto";
import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";

const ACL_POLICY_METADATA_KEY = "aclpolicy";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectAccessDeniedError extends Error {
  constructor() {
    super("Access denied");
    this.name = "ObjectAccessDeniedError";
    Object.setPrototypeOf(this, ObjectAccessDeniedError.prototype);
  }
}

function getAzureConfig() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT;
  const accountKey = process.env.AZURE_STORAGE_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER || "photos";

  if (!accountName || !accountKey) {
    throw new Error(
      "Azure Storage not configured. Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables."
    );
  }

  return { accountName, accountKey, containerName };
}

function getBlobServiceClient(): BlobServiceClient {
  const { accountName, accountKey } = getAzureConfig();
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );
}

function getContainerClient(): ContainerClient {
  const { containerName } = getAzureConfig();
  return getBlobServiceClient().getContainerClient(containerName);
}

export class ObjectStorageService {
  private containerClient: ContainerClient | null = null;

  private getContainer(): ContainerClient {
    if (!this.containerClient) {
      this.containerClient = getContainerClient();
    }
    return this.containerClient;
  }

  async ensureContainerExists(): Promise<void> {
    const container = this.getContainer();
    await container.createIfNotExists();
  }

  async getUploadSasUrl(
    blobName: string,
    contentType?: string
  ): Promise<{ uploadUrl: string; blobPath: string }> {
    const { accountName, accountKey, containerName } = getAzureConfig();
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + 15 * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
        contentType,
      },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
    const blobPath = `/api/objects/${blobName}`;

    return { uploadUrl, blobPath };
  }

  async generateUploadUrl(): Promise<{
    uploadUrl: string;
    objectPath: string;
  }> {
    await this.ensureContainerExists();

    const objectId = randomUUID();
    const blobName = `uploads/${objectId}`;

    const { uploadUrl, blobPath } = await this.getUploadSasUrl(blobName);

    return {
      uploadUrl,
      objectPath: blobPath,
    };
  }

  async getBlobClient(objectPath: string): Promise<BlobClient> {
    if (!objectPath.startsWith("/api/objects/")) {
      throw new ObjectNotFoundError();
    }

    const blobName = objectPath.replace("/api/objects/", "");
    const container = this.getContainer();
    const blobClient = container.getBlobClient(blobName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }

    return blobClient;
  }

  async getObjectAclPolicy(
    blobClient: BlobClient
  ): Promise<ObjectAclPolicy | null> {
    const properties = await blobClient.getProperties();
    const aclPolicyStr = properties.metadata?.[ACL_POLICY_METADATA_KEY];
    if (!aclPolicyStr) {
      return null;
    }
    try {
      return JSON.parse(aclPolicyStr);
    } catch {
      return null;
    }
  }

  async setObjectAclPolicy(
    blobClient: BlobClient,
    aclPolicy: ObjectAclPolicy
  ): Promise<void> {
    const blockBlobClient = blobClient.getBlockBlobClient();
    const properties = await blobClient.getProperties();

    await blockBlobClient.setMetadata({
      ...properties.metadata,
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    });
  }

  async canAccessObject(
    blobClient: BlobClient,
    userId?: number,
    requestedPermission: ObjectPermission = ObjectPermission.READ
  ): Promise<boolean> {
    const aclPolicy = await this.getObjectAclPolicy(blobClient);

    if (!aclPolicy) {
      return true;
    }

    if (
      aclPolicy.visibility === "public" &&
      requestedPermission === ObjectPermission.READ
    ) {
      return true;
    }

    if (!userId) {
      return false;
    }

    if (aclPolicy.owner === String(userId)) {
      return true;
    }

    return false;
  }

  async downloadObject(
    blobClient: BlobClient,
    res: Response,
    userId?: number,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      const canAccess = await this.canAccessObject(
        blobClient,
        userId,
        ObjectPermission.READ
      );
      if (!canAccess) {
        throw new ObjectAccessDeniedError();
      }

      const aclPolicy = await this.getObjectAclPolicy(blobClient);
      const isPublic = aclPolicy?.visibility === "public";
      const properties = await blobClient.getProperties();

      res.set({
        "Content-Type": properties.contentType || "application/octet-stream",
        "Content-Length": properties.contentLength?.toString() || "0",
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      const downloadResponse = await blobClient.download();

      if (downloadResponse.readableStreamBody) {
        downloadResponse.readableStreamBody.pipe(res);
      } else {
        res.status(500).json({ error: "Unable to stream file" });
      }
    } catch (error) {
      if (error instanceof ObjectAccessDeniedError) {
        throw error;
      }
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async deleteObject(objectPath: string): Promise<void> {
    const blobClient = await this.getBlobClient(objectPath);
    await blobClient.delete();
  }

  normalizeObjectPath(rawPath: string): string {
    const { accountName, containerName } = getAzureConfig();
    const blobUrlPrefix = `https://${accountName}.blob.core.windows.net/${containerName}/`;

    if (rawPath.startsWith(blobUrlPrefix)) {
      const url = new URL(rawPath);
      const blobName = url.pathname.replace(`/${containerName}/`, "");
      return `/api/objects/${blobName}`;
    }

    return rawPath;
  }

  async trySetObjectAclPolicy(
    objectPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectPath(objectPath);
    if (!normalizedPath.startsWith("/api/objects/")) {
      return normalizedPath;
    }

    const blobClient = await this.getBlobClient(normalizedPath);
    await this.setObjectAclPolicy(blobClient, aclPolicy);
    return normalizedPath;
  }
}

export const objectStorageClient = new ObjectStorageService();
