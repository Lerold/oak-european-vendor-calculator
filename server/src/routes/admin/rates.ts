import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { validateUuidParam } from '../../middleware/validate';

const router = Router();
router.use(requireAuth as any);
router.param('id', validateUuidParam('id'));

const rateSchema = z.object({
  country_id: z.string().uuid(),
  term_months: z.number().int().positive(),
  rate: z.number().min(0).max(100),
  is_active: z.boolean().default(true),
});

// List rates (optionally filtered by country)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { country_id } = req.query;
  let sql = `
    SELECT r.*, c.name as country_name, c.code as country_code
    FROM interest_rates r
    JOIN countries c ON c.id = r.country_id
  `;
  const params: unknown[] = [];

  if (country_id) {
    sql += ' WHERE r.country_id = $1';
    params.push(country_id);
  }

  sql += ' ORDER BY c.name ASC, r.term_months ASC';
  const result = await query(sql, params);
  res.json({ rates: result.rows });
});

// Create or update rate (upsert by country_id + term_months)
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  const result = await query(
    `INSERT INTO interest_rates (country_id, term_months, rate, is_active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (country_id, term_months)
     DO UPDATE SET rate = $3, is_active = $4
     RETURNING *`,
    [d.country_id, d.term_months, d.rate, d.is_active]
  );

  res.status(201).json({ rate: result.rows[0] });
});

// Bulk set rates for a country
router.put('/bulk', async (req: AuthRequest, res: Response) => {
  const bulkSchema = z.object({
    country_id: z.string().uuid(),
    rates: z.array(z.object({
      term_months: z.number().int().positive(),
      rate: z.number().min(0).max(100),
      is_active: z.boolean().default(true),
    })),
  });

  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { country_id, rates } = parsed.data;
  const results = [];

  for (const r of rates) {
    const result = await query(
      `INSERT INTO interest_rates (country_id, term_months, rate, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (country_id, term_months)
       DO UPDATE SET rate = $3, is_active = $4
       RETURNING *`,
      [country_id, r.term_months, r.rate, r.is_active]
    );
    results.push(result.rows[0]);
  }

  res.json({ rates: results });
});

// Delete rate
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await query('DELETE FROM interest_rates WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Rate not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
