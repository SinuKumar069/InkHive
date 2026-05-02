import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY_ENV = "INTEGRATIONS_ENCRYPTION_KEY";

function getKeyBuffer(): Buffer {
  const raw = process.env[ENCRYPTION_KEY_ENV];
  if (!raw) {
    throw new Error(`${ENCRYPTION_KEY_ENV} is required`);
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${ENCRYPTION_KEY_ENV} must be base64-encoded 32 bytes`);
  }

  return key;
}

function toBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

export async function encryptSecret(secret: string): Promise<string> {
  const iv = randomBytes(12);
  const key = getKeyBuffer();

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(authTag)}.${toBase64Url(encrypted)}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivPart, tagPart, encryptedPart] = payload.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = fromBase64Url(ivPart);
  const authTag = fromBase64Url(tagPart);
  const encrypted = fromBase64Url(encryptedPart);
  const key = getKeyBuffer();

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
