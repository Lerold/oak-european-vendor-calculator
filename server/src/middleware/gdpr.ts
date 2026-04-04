import crypto from 'crypto';

/**
 * Hash an IP address for GDPR-compliant storage.
 * Uses SHA-256 with a salt — one-way, cannot be reversed to raw IP.
 */
export function hashIP(ip: string): string {
  const salt = process.env.SESSION_SECRET || 'oaklease-ip-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}
