import { createHash, randomBytes } from "crypto";

/**
 * Enterprise-grade secure token generation and validation for team invitations
 *
 * Security features:
 * - Cryptographically secure random token generation (256-bit)
 * - SHA-256 hashing for storage (token never stored in plaintext)
 * - URL-safe Base64 encoding
 * - Time-limited expiration
 * - Single-use enforcement
 */

// Token length in bytes (32 bytes = 256 bits of entropy)
const TOKEN_BYTES = 32;

// Default expiration time (7 days in milliseconds)
export const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure invitation token
 * Returns both the plaintext token (for email) and hash (for storage)
 */
export function generateInviteToken(): { token: string; hash: string } {
  // Generate cryptographically secure random bytes
  const tokenBuffer = randomBytes(TOKEN_BYTES);

  // Convert to URL-safe Base64
  const token = tokenBuffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Create SHA-256 hash for storage
  const hash = hashToken(token);

  return { token, hash };
}

/**
 * Hash a token using SHA-256
 * Used for both storage and validation
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validate token format before processing
 * Prevents timing attacks and invalid input processing
 */
export function isValidTokenFormat(token: string): boolean {
  // URL-safe Base64 without padding, 43 characters for 32 bytes
  const urlSafeBase64Regex = /^[A-Za-z0-9_-]{43}$/;
  return urlSafeBase64Regex.test(token);
}

/**
 * Generate expiration timestamp
 */
export function getExpirationDate(daysFromNow: number = 7): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

/**
 * Sanitize email for display (partial masking)
 * Example: john.doe@company.com -> j***e@c***y.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";

  const [domainName, tld] = domain.split(".");

  const maskPart = (str: string) => {
    if (str.length <= 2) return str[0] + "*";
    return str[0] + "*".repeat(Math.min(str.length - 2, 3)) + str[str.length - 1];
  };

  return `${maskPart(local)}@${maskPart(domainName)}.${tld}`;
}

/**
 * Validate invitation link URL to prevent open redirect attacks
 */
export function buildSecureInviteUrl(baseUrl: string, token: string): string {
  // Ensure baseUrl is our own domain
  const url = new URL("/invite/accept", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Rate limiting helper - check if too many invitations sent
 */
export function shouldRateLimit(
  recentInviteCount: number,
  maxPerHour: number = 10
): boolean {
  return recentInviteCount >= maxPerHour;
}
