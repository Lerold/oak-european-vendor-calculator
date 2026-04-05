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

// In-memory challenge store (per-session, short-lived)
const challengeStore = new Map<string, { challenge: string; userId?: string; username?: string }>();

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
      'SELECT id FROM admin_users WHERE username = $1 AND credential_id IS NOT NULL',
      [username.trim()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Clean up orphaned records
    await query(
      'DELETE FROM admin_users WHERE username = $1 AND credential_id IS NULL',
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
    challengeStore.set(challengeId, {
      challenge: options.challenge,
      userId,
      username: username.trim(),
    });
    setTimeout(() => challengeStore.delete(challengeId), 5 * 60 * 1000);

    // Mark invite as used
    await query(
      'UPDATE invite_tokens SET used_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );

    res.json({ options, challengeId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if setup is needed (no admin users exist)
router.get('/setup-status', async (_req: Request, res: Response) => {
  try {
    // Only count users with completed passkey registration
    const result = await query('SELECT COUNT(*) as count FROM admin_users WHERE credential_id IS NOT NULL');
    const needsSetup = parseInt(result.rows[0].count, 10) === 0;
    res.json({ needsSetup });
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

    // Check if this is first-time setup or an authenticated admin adding a user
    const userCount = await query('SELECT COUNT(*) as count FROM admin_users WHERE credential_id IS NOT NULL');
    const isFirstSetup = parseInt(userCount.rows[0].count, 10) === 0;

    if (!isFirstSetup) {
      // Fully validate the session token
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

    // Check for existing username (ignore orphaned records without credentials)
    const existing = await query(
      'SELECT id FROM admin_users WHERE username = $1 AND credential_id IS NOT NULL',
      [username.trim()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Clean up any orphaned record from a previous failed registration
    await query(
      'DELETE FROM admin_users WHERE username = $1 AND credential_id IS NULL',
      [username.trim()]
    );

    // Create the user record (without credentials — will be set after passkey verification)
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

    // Store challenge for verification
    const challengeId = crypto.randomUUID();
    challengeStore.set(challengeId, { challenge: options.challenge, userId, username: username.trim() });

    // Auto-expire challenge after 5 minutes
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

    // Update user with credential info
    await query(
      `UPDATE admin_users
       SET credential_id = $1, public_key = $2, counter = $3
       WHERE id = $4`,
      [
        Buffer.from(credentialID).toString('base64url'),
        Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        stored.userId,
      ]
    );

    challengeStore.delete(challengeId);

    // Create session and set httpOnly cookie
    const token = await createSession(stored.userId!);

    // Mark setup as complete if this is the first user
    await query(
      `UPDATE settings SET value = 'true' WHERE key = 'setup_complete'`
    );

    res.cookie('session', token, getSessionCookieOptions());
    res.json({
      verified: true,
      user: { id: stored.userId, username: stored.username },
    });
  } catch (err) {
    // Clean up the user if registration failed
    if (stored.userId) {
      await query('DELETE FROM admin_users WHERE id = $1 AND credential_id IS NULL', [stored.userId]);
    }
    challengeStore.delete(challengeId);
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed' });
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

  // Find user by credential ID
  const credentialId = authResponse.id;
  const userResult = await query(
    `SELECT id, username, credential_id, public_key, counter
     FROM admin_users
     WHERE credential_id = $1 AND is_active = true`,
    [credentialId]
  );

  if (userResult.rows.length === 0) {
    res.status(401).json({ error: 'Unknown credential' });
    return;
  }

  const user = userResult.rows[0];

  try {
    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(user.credential_id, 'base64url'),
        credentialPublicKey: Buffer.from(user.public_key, 'base64url'),
        counter: user.counter,
      },
    });

    if (!verification.verified) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    // Update counter
    await query(
      'UPDATE admin_users SET counter = $1, last_login = NOW() WHERE id = $2',
      [verification.authenticationInfo.newCounter, user.id]
    );

    challengeStore.delete(challengeId);

    // Create session and set httpOnly cookie
    const token = await createSession(user.id);

    res.cookie('session', token, getSessionCookieOptions());
    res.json({
      verified: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    challengeStore.delete(challengeId);
    console.error('Login error:', err);
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
