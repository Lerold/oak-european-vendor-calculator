import { Router, Response } from 'express';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';

const router = Router();
router.use(requireAuth as any);

// GET /api/admin/analytics — calculator usage stats
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { days: daysStr } = req.query;
    const days = parseInt(daysStr as string, 10) || 30;

    // Total calculations
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM calculation_logs
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1`,
      [days]
    );

    // By country
    const byCountry = await query(
      `SELECT country_code, COUNT(*) as count
       FROM calculation_logs
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY country_code ORDER BY count DESC`,
      [days]
    );

    // By vendor
    const byVendor = await query(
      `SELECT COALESCE(vendor_slug, 'direct') as vendor, COUNT(*) as count
       FROM calculation_logs
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY vendor_slug ORDER BY count DESC`,
      [days]
    );

    // By day (last N days)
    const byDay = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM calculation_logs
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );

    res.json({
      total: parseInt(totalResult.rows[0].total, 10),
      byCountry: byCountry.rows,
      byVendor: byVendor.rows,
      byDay: byDay.rows,
      days,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
