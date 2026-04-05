import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/countries — public list (no rates, no admin-only fields)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT code, name, flag_emoji, currency_code, vat_rate,
              min_amount, max_amount, available_terms,
              deposit_enabled, deposit_months, calc_method, show_local_currency
       FROM countries
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );
    res.json({ countries: result.rows });
  } catch {
    res.status(500).json({ error: 'Failed to load countries' });
  }
});

// GET /api/countries/:code — single country detail + regulatory info
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT code, name, flag_emoji, currency_code, vat_rate,
              regulatory_info, lease_types, min_amount, max_amount,
              available_terms, deposit_enabled, deposit_months,
              calc_method, show_local_currency
       FROM countries
       WHERE code = $1 AND is_active = true`,
      [req.params.code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }

    res.json({ country: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to load country' });
  }
});

export default router;
