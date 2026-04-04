import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/faq — public FAQ content (markdown)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT value FROM settings WHERE key = 'faq_content'"
    );
    const content = result.rows[0]?.value || '';
    res.json({ content });
  } catch {
    res.status(500).json({ error: 'Failed to load FAQ' });
  }
});

export default router;
