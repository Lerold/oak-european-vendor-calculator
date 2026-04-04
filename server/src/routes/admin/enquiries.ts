import { Router, Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { validateUuidParam } from '../../middleware/validate';

const router = Router();
router.use(requireAuth as any);
router.param('id', validateUuidParam('id'));

// List enquiries with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, vendor_id, limit: limitStr, offset: offsetStr } = req.query;

    let sql = `
      SELECT e.*, c.name as country_name, c.code as country_code,
             v.name as vendor_name
      FROM enquiries e
      LEFT JOIN countries c ON c.id = e.country_id
      LEFT JOIN vendors v ON v.id = e.vendor_id
    `;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status && typeof status === 'string') {
      conditions.push(`e.status = $${idx++}`);
      params.push(status);
    }
    if (vendor_id && typeof vendor_id === 'string') {
      conditions.push(`e.vendor_id = $${idx++}`);
      params.push(vendor_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY e.created_at DESC';

    const limit = Math.min(parseInt(limitStr as string, 10) || 50, 200);
    const offset = parseInt(offsetStr as string, 10) || 0;
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM enquiries e';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await query(countSql, params.slice(0, conditions.length));
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ enquiries: result.rows, total, limit, offset });
  } catch {
    res.status(500).json({ error: 'Failed to load enquiries' });
  }
});

// Update enquiry status
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['new', 'contacted', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const result = await query(
      'UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }
    res.json({ enquiry: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// Delete enquiry (GDPR Right to Erasure)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM enquiries WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

export default router;
