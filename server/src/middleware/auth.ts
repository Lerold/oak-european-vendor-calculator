import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict' as const,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return token;
}

export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.session;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const tokenHash = hashToken(token);
    const result = await query(
      `SELECT s.user_id, u.username
       FROM sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = true`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    req.userId = result.rows[0].user_id;
    req.username = result.rows[0].username;
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Clean up expired sessions periodically
export async function cleanExpiredSessions(): Promise<void> {
  try {
    const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Cleaned ${result.rowCount} expired sessions`);
    }
  } catch (err) {
    console.error('Session cleanup error:', err);
  }
}

// Start periodic session cleanup (every hour)
export function startSessionCleanup(): void {
  // Run once on startup
  cleanExpiredSessions();
  // Then every hour
  setInterval(cleanExpiredSessions, 60 * 60 * 1000);
}
