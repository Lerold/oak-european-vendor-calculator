import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { query } from '../config/database';
import { createSession, destroySession, getSessionCookieOptions, AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

const rpName = process.env.WEBAUTHN_RP_NAME || 'Oaklease Admin';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5177';

const MAX_PASSKEYS_PER_USER = 5;

// In-memory challenge store (per-session, short-lived)
const challengeStore = new Map<string, { challenge: string; userId?: string; username?: string }>();

// Helper: check if user has credentials in the new table
async function userHasCredentials(userId: string): Promise<boolean> {
  const result = await query('SELECT COUNT(*) as count FROM user_credentials WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0].count, 10) > 0;
}

// Helper: count users with at least one credential
async function countUsersWithCredentials(): Promise<number> {
  const result = await query(
    `SELECT COUNT(DISTINCT uc.user_id) as count
     FROM user_credentials uc
     JOIN admin_users u ON u.id = uc.user_id AND u.is_active = true`
  );
  return parseInt(result.rows[0].count, 10);
}

// Validate invite token (public — no auth needed)
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const result = await query(
      `SELECT id, display_name, expires_at FROM invite_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invalid or expired invite' });
      return;
    }
    res.json({ valid: true, displayName: result.rows[0].display_name });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register via invite token (public — token acts as auth)
router.post('/register-with-invite', async (req: Request, res: Response) => {
  const { token: inviteToken, username, displayName } = req.body;

  if (!inviteToken || !username) {
    res.status(400).json({ error: 'Token and username are required' });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const inviteResult = await query(
      `SELECT id FROM invite_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    if (inviteResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired invite' });
      return;
    }

    // Check username not taken
    const existing = await query(
      'SELECT id FROM admin_users WHERE username = $1 AND is_active = true',
      [username.trim()]
    );
    if (existing.rows.length > 0) {
      const hasKeys = await userHasCredentials(existing.rows[0].id);
      if (hasKeys) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
    }

    // Clean up orphaned records
    await query(
      `DELETE FROM admin_users WHERE username = $1
       AND id NOT IN (SELECT DISTINCT user_id FROM user_credentials)`,
      [username.trim()]
    );

    // Create user
    const userResult = await query(
      'INSERT INTO admin_users (username, display_name) VALUES ($1, $2) RETURNING id',
      [username.trim(), (displayName || username).trim()]
    );
    const userId = userResult.rows[0].id;

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: username.trim(),
      userDisplayName: (displayName || username).trim(),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const challengeId = crypto.randomUUID();
    challengeStore.set(challengeId, { challenge: options.challenge, userId, username: username.trim() });
    setTimeout(() => challengeStore.delete(challengeId), 5 * 60 * 1000);

    // Mark invite as used
    await query('UPDATE invite_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);

    res.json({ options, challengeId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if setup is needed (no admin users with credentials exist)
router.get('/setup-status', async (_req: Request, res: Response) => {
  try {
    const count = await countUsersWithCredentials();
    res.json({ needsSetup: count === 0 });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === REGISTRATION (first-time setup or adding new users) ===

router.post('/register-options', async (req: Request, res: Response) => {
  try {
    const { username, displayName } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    const isFirstSetup = (await countUsersWithCredentials()) === 0;

    if (!isFirstSetup) {
      const token = req.cookies?.session;
      if (!token) {
        res.status(401).json({ error: 'Authentication required to add new users' });
        return;
      }
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const sessionResult = await query(
        `SELECT s.user_id FROM sessions s
         JOIN admin_users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = true`,
        [tokenHash]
      );
      if (sessionResult.rows.length === 0) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }
    }

    // Check for existing username with credentials
    const existing = await query('SELECT id FROM admin_users WHERE username = $1 AND is_active = true', [username.trim()]);
    if (existing.rows.length > 0) {
      const hasKeys = await userHasCredentials(existing.rows[0].id);
      if (hasKeys) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
    }

    // Clean up orphaned records (users without any credentials)
    await query(
      `DELETE FROM admin_users WHERE username = $1
       AND id NOT IN (SELECT DISTINCT user_id FROM user_credentials)`,
      [username.trim()]
    );

    const userResult = await query(
      'INSERT INTO admin_users (username, display_name) VALUES ($1, $2) RETURNING id',
      [username.trim(), (displayName || username).trim()]
    );
    const userId = userResult.rows[0].id;

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: username.trim(),
      userDisplayName: (displayName || username).trim(),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const challengeId = crypto.randomUUID();
    challengeStore.set(challengeId, { challenge: options.challenge, userId, username: username.trim() });
    setTimeout(() => challengeStore.delete(challengeId), 5 * 60 * 1000);

    res.json({ options, challengeId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { challengeId, response: attResponse } = req.body as {
    challengeId: string;
    response: RegistrationResponseJSON;
  };

  const stored = challengeStore.get(challengeId);
  if (!stored) {
    res.status(400).json({ error: 'Challenge expired or invalid' });
    return;
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: attResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Registration verification failed' });
      return;
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const credIdB64 = Buffer.from(credentialID).toString('base64url');
    const pubKeyB64 = Buffer.from(credentialPublicKey).toString('base64url');

    // Store credential in user_credentials table
    await query(
      `INSERT INTO user_credentials (user_id, credential_id, public_key, counter, name)
       VALUES ($1, $2, $3, $4, $5)`,
      [stored.userId, credIdB64, pubKeyB64, counter, 'Passkey']
    );

    // Also update admin_users for backward compat (first credential)
    await query(
      `UPDATE admin_users SET credential_id = $1, public_key = $2, counter = $3
       WHERE id = $4 AND credential_id IS NULL`,
      [credIdB64, pubKeyB64, counter, stored.userId]
    );

    challengeStore.delete(challengeId);

    const token = await createSession(stored.userId!);

    await query(`UPDATE settings SET value = 'true' WHERE key = 'setup_complete'`);

    res.cookie('session', token, getSessionCookieOptions());
    res.json({
      verified: true,
      user: { id: stored.userId, username: stored.username },
    });
  } catch (err) {
    if (stored.userId) {
      // Only delete user if they have no credentials at all
      const hasKeys = await userHasCredentials(stored.userId);
      if (!hasKeys) {
        await query('DELETE FROM admin_users WHERE id = $1', [stored.userId]);
      }
    }
    challengeStore.delete(challengeId);
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// === ADD PASSKEY (authenticated user adding to their own account) ===

router.post('/add-passkey-options', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    // Check max passkeys
    const countResult = await query(
      'SELECT COUNT(*) as count FROM user_credentials WHERE user_id = $1',
      [req.userId]
    );
    const count = parseInt(countResult.rows[0].count, 10);
    if (count >= MAX_PASSKEYS_PER_USER) {
      res.status(400).json({ error: `Maximum ${MAX_PASSKEYS_PER_USER} passkeys per account` });
      return;
    }

    // Get existing credentials to exclude
    const existingCreds = await query(
      'SELECT credential_id FROM user_credentials WHERE user_id = $1',
      [req.userId]
    );

    const userResult = await query(
      'SELECT id, username, display_name FROM admin_users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.username,
      userDisplayName: user.display_name || user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: existingCreds.rows.map((r: { credential_id: string }) => ({
        id: Buffer.from(r.credential_id, 'base64url'),
        type: 'public-key' as const,
      })),
    });

    const challengeId = crypto.randomUUID();
    challengeStore.set(challengeId, { challenge: options.challenge, userId: user.id, username: user.username });
    setTimeout(() => challengeStore.delete(challengeId), 5 * 60 * 1000);

    res.json({ options, challengeId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete add-passkey (authenticated, checks ownership + limit)
router.post('/add-passkey', requireAuth as any, async (req: AuthRequest, res: Response) => {
  const { challengeId, response: attResponse } = req.body as {
    challengeId: string;
    response: RegistrationResponseJSON;
  };

  const stored = challengeStore.get(challengeId);
  if (!stored) {
    res.status(400).json({ error: 'Challenge expired or invalid' });
    return;
  }

  // Verify the challenge belongs to this user
  if (stored.userId !== req.userId) {
    res.status(403).json({ error: 'Challenge does not belong to this user' });
    return;
  }

  try {
    // Atomic max check
    const countResult = await query(
      'SELECT COUNT(*) as count FROM user_credentials WHERE user_id = $1',
      [req.userId]
    );
    if (parseInt(countResult.rows[0].count, 10) >= MAX_PASSKEYS_PER_USER) {
      res.status(400).json({ error: `Maximum ${MAX_PASSKEYS_PER_USER} passkeys per account` });
      return;
    }

    const verification = await verifyRegistrationResponse({
      response: attResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Registration verification failed' });
      return;
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    await query(
      `INSERT INTO user_credentials (user_id, credential_id, public_key, counter, name)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.userId,
        Buffer.from(credentialID).toString('base64url'),
        Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        'Backup Passkey',
      ]
    );

    challengeStore.delete(challengeId);
    res.json({ verified: true });
  } catch (err) {
    challengeStore.delete(challengeId);
    console.error('Add passkey error:', err instanceof Error ? err.message : 'Unknown');
    res.status(400).json({ error: 'Failed to add passkey' });
  }
});

// List passkeys for current user
router.get('/passkeys', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, created_at FROM user_credentials WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json({ passkeys: result.rows, max: MAX_PASSKEYS_PER_USER });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a passkey
router.delete('/passkeys/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    // Must keep at least one
    const countResult = await query(
      'SELECT COUNT(*) as count FROM user_credentials WHERE user_id = $1',
      [req.userId]
    );
    if (parseInt(countResult.rows[0].count, 10) <= 1) {
      res.status(400).json({ error: 'Cannot remove your last passkey' });
      return;
    }

    const result = await query(
      'DELETE FROM user_credentials WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Passkey not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rename a passkey
router.put('/passkeys/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const result = await query(
      'UPDATE user_credentials SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
      [name.trim().substring(0, 100), req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Passkey not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === AUTHENTICATION ===

router.post('/login-options', async (_req: Request, res: Response) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    const challengeId = crypto.randomUUID();
    challengeStore.set(challengeId, { challenge: options.challenge });
    setTimeout(() => challengeStore.delete(challengeId), 5 * 60 * 1000);

    res.json({ options, challengeId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { challengeId, response: authResponse } = req.body as {
    challengeId: string;
    response: AuthenticationResponseJSON;
  };

  const stored = challengeStore.get(challengeId);
  if (!stored) {
    res.status(400).json({ error: 'Challenge expired or invalid' });
    return;
  }

  // Find credential in user_credentials table
  const credentialId = authResponse.id;
  const credResult = await query(
    `SELECT uc.id as cred_id, uc.credential_id, uc.public_key, uc.counter, uc.user_id,
            u.username, u.is_active
     FROM user_credentials uc
     JOIN admin_users u ON u.id = uc.user_id
     WHERE uc.credential_id = $1 AND u.is_active = true`,
    [credentialId]
  );

  if (credResult.rows.length === 0) {
    res.status(401).json({ error: 'Unknown credential' });
    return;
  }

  const cred = credResult.rows[0];

  try {
    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(cred.credential_id, 'base64url'),
        credentialPublicKey: Buffer.from(cred.public_key, 'base64url'),
        counter: cred.counter,
      },
    });

    if (!verification.verified) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    // Update counter on the credential
    await query(
      'UPDATE user_credentials SET counter = $1 WHERE id = $2',
      [verification.authenticationInfo.newCounter, cred.cred_id]
    );

    // Update last_login on the user
    await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [cred.user_id]);

    challengeStore.delete(challengeId);

    const token = await createSession(cred.user_id);

    res.cookie('session', token, getSessionCookieOptions());
    res.json({
      verified: true,
      user: { id: cred.user_id, username: cred.username },
    });
  } catch (err) {
    challengeStore.delete(challengeId);
    console.error('Login error:', err instanceof Error ? err.message : 'Unknown');
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// === SESSION ===

router.get('/me', requireAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, display_name, last_login FROM admin_users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.session;
  if (token) {
    await destroySession(token);
  }
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

export default router;
