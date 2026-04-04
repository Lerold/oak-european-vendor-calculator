import { Router, Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const router = Router();
router.use(requireAuth as any);

// List admin users
router.get('/', async (_req: AuthRequest, res: Response) => {
  const result = await query(
    `SELECT id, username, display_name, created_at, last_login, is_active
     FROM admin_users
     ORDER BY created_at ASC`
  );
  res.json({ users: result.rows });
});

// Deactivate user
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  // Prevent self-deletion
  if (req.params.id === req.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  const result = await query(
    'UPDATE admin_users SET is_active = false WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Remove their sessions
  await query('DELETE FROM sessions WHERE user_id = $1', [req.params.id]);

  res.json({ success: true });
});

export default router;
