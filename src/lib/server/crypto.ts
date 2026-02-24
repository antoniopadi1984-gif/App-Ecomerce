import crypto from "crypto";

// 32-byte key from environment
const RAW_KEY = process.env.APP_SECRET_KEY || "dev-key-32-characters-long-!!!!!";
const ENCRYPTION_KEY = Buffer.alloc(32, RAW_KEY).slice(0, 32);
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

if (!process.env.APP_SECRET_KEY) {
    console.warn("⚠️ [Crypto] Using development fallback key. DO NOT USE IN PRODUCTION.");
}

export interface EncryptedData {
    enc: string;
    iv: string;
    tag: string;
}

/**
 * encryptSecret — Encrypts a plain text string using AES-256-GCM.
 */
export function encryptSecret(plain: string): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);

    let encrypted = cipher.update(plain, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return {
        enc: encrypted,
        iv: iv.toString("hex"),
        tag: tag,
    };
}

/**
 * decryptSecret — Decrypts data using AES-256-GCM.
 */
export function decryptSecret(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
        Buffer.from(data.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(data.tag, "hex"));

    let decrypted = decipher.update(data.enc, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
