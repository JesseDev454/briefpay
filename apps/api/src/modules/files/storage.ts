import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env";

export interface StorageAdapter {
  createKey(fileName: string): string;
  moveIntoStorage(tempPath: string, storageKey: string): Promise<void>;
  exists(storageKey: string): boolean;
  stream(storageKey: string): NodeJS.ReadableStream;
}

class LocalStorageAdapter implements StorageAdapter {
  private readonly directory = path.resolve(process.cwd(), env.UPLOAD_DIR);
  constructor() { mkdirSync(this.directory, { recursive: true }); }
  createKey(fileName: string) { return `${randomUUID()}-${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`; }
  async moveIntoStorage(tempPath: string, storageKey: string) { await rename(tempPath, path.join(this.directory, storageKey)); }
  exists(storageKey: string) { return existsSync(path.join(this.directory, storageKey)); }
  stream(storageKey: string) { return createReadStream(path.join(this.directory, storageKey)); }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
