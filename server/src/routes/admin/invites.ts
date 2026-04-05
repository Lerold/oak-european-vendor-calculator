import { Router, Response } from 'express';
import crypto from 'crypto';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const router = Router();
router.use(requireAuth as any);

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// List active invites
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT i.id, i.display_name, i.created_at, i.expires_at, i.used_at,
              u.username as created_by_username
       FROM invite_tokens i
       LEFT JOIN admin_users u ON u.id = i.created_by
       ORDER BY i.created_at DESC`
    );
    res.json({ invites: result.rows });
  } catch {
    res.status(500).json({ error: 'Failed to load invites' });
  }
});

// Create invite
router.post('/', async (req: AuthRequest, res: Response) => {
  const { displayName, expiresInHours } = req.body;
  const hours = Math.min(Math.max(parseInt(expiresInHours, 10) || 48, 1), 168); // 1h to 7d

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  try {
    await query(
      `INSERT INTO invite_tokens (token_hash, created_by, display_name, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, req.userId, displayName || null, expiresAt]
    );

    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:8082';
    const inviteUrl = `${origin}/admin/invite/${token}`;

    res.status(201).json({ inviteUrl, expiresAt });
  } catch {
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Delete invite
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM invite_tokens WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete invite' });
  }
});

export default router;
