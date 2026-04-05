import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/settings/public — non-sensitive settings for frontend
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT key, value FROM settings WHERE key IN ('google_analytics_id')"
    );
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json({ settings });
  } catch {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

export default router;
