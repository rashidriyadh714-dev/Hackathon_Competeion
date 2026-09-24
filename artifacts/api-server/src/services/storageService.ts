import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  private static getStorageRoot(): string {
    const root = process.env.STORAGE_DIR || "./data/uploads";
    return path.resolve(root);
  }

  public static validateFile(file: {
    mimetype: string;
    size: number;
    originalname: string;
    buffer?: Buffer;
  }): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: "File exceeds maximum size limit of 10MB.",
      };
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, PDF, Plain Text.`,
      };
    }

    return { valid: true };
  }

  public static computeChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  public static saveSourceFile(options: {
    userId: string;
    sourceId: string;
    filename: string;
    buffer: Buffer;
  }): { storagePath: string; checksum: string } {
    const userDir = path.join(
      this.getStorageRoot(),
      options.userId,
      "sources",
      options.sourceId,
    );
    fs.mkdirSync(userDir, { recursive: true });

    // Use sanitized non-guessable filename
    const ext = path.extname(options.filename).toLowerCase();
    const safeFilename = `source_${Date.now()}${ext}`;
    const destination = path.join(userDir, safeFilename);

    fs.writeFileSync(destination, options.buffer);

    const relativePath = path.relative(this.getStorageRoot(), destination);
    const checksum = this.computeChecksum(options.buffer);

    return { storagePath: relativePath, checksum };
  }

  public static saveEvidenceFile(options: {
    userId: string;
    taskId: string;
    evidenceId: string;
    filename: string;
    buffer: Buffer;
  }): { storagePath: string; checksum: string } {
    const evidenceDir = path.join(
      this.getStorageRoot(),
      options.userId,
      "evidence",
      options.taskId,
      options.evidenceId,
    );
    fs.mkdirSync(evidenceDir, { recursive: true });

    const ext = path.extname(options.filename).toLowerCase();
    const safeFilename = `evidence_${Date.now()}${ext}`;
    const destination = path.join(evidenceDir, safeFilename);

    fs.writeFileSync(destination, options.buffer);

    const relativePath = path.relative(this.getStorageRoot(), destination);
    const checksum = this.computeChecksum(options.buffer);

    return { storagePath: relativePath, checksum };
  }

  public static getAbsolutePath(storagePath: string): string | null {
    const fullPath = path.resolve(this.getStorageRoot(), storagePath);
    // Prevent directory traversal
    if (!fullPath.startsWith(this.getStorageRoot())) {
      return null;
    }
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fullPath;
  }
}
