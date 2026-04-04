import crypto from 'crypto';

/**
 * Hash an IP address for GDPR-compliant storage.
 * Uses SHA-256 with a salt — one-way, cannot be reversed to raw IP.
 */
export function hashIP(ip: string): string {
  const salt = process.env.SESSION_SECRET;
  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production for secure IP hashing');
    }
    // Dev-only fallback — log warning once
    console.warn('WARNING: SESSION_SECRET not set, using weak IP hash salt');
  }
  return crypto.createHash('sha256').update(ip + (salt || 'dev-only-salt')).digest('hex');
}
