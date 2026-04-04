import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const router = Router();
router.use(requireAuth as any);

// Get all settings
router.get('/', async (_req: AuthRequest, res: Response) => {
  const result = await query('SELECT key, value, updated_at FROM settings ORDER BY key');
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  res.json({ settings });
});

// Update settings (batch)
router.put('/', async (req: AuthRequest, res: Response) => {
  const settingsSchema = z.record(z.string(), z.string());
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );
  }

  // Return updated settings
  const result = await query('SELECT key, value FROM settings ORDER BY key');
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  res.json({ settings });
});

export default router;
