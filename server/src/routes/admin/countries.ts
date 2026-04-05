import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { validateUuidParam } from '../../middleware/validate';

const router = Router();
router.use(requireAuth as any);
router.param('id', validateUuidParam('id'));

const countrySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(3).toUpperCase(),
  flag_emoji: z.string().max(10).optional(),
  currency_code: z.string().length(3).toUpperCase().default('EUR'),
  vat_rate: z.number().min(0).max(100),
  regulatory_info: z.string().optional(),
  lease_types: z.array(z.string()).default(['finance', 'operating']),
  min_amount: z.number().min(0).default(3000),
  max_amount: z.number().min(0).default(15000000),
  available_terms: z.array(z.number()).default([24, 36, 48, 60]),
  deposit_enabled: z.boolean().default(true),
  deposit_months: z.number().int().min(0).default(1),
  calc_method: z.enum(['pmt', 'flat']).default('pmt'),
  show_local_currency: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

// List all countries
router.get('/', async (_req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT * FROM countries ORDER BY sort_order ASC, name ASC'
  );
  res.json({ countries: result.rows });
});

// Get single country
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM countries WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }
  res.json({ country: result.rows[0] });
});

// Create country
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = countrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  try {
    const result = await query(
      `INSERT INTO countries (name, code, flag_emoji, currency_code, vat_rate, regulatory_info,
         lease_types, min_amount, max_amount, available_terms, deposit_enabled, deposit_months,
         calc_method, show_local_currency, is_active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [d.name, d.code, d.flag_emoji, d.currency_code, d.vat_rate, d.regulatory_info,
       d.lease_types, d.min_amount, d.max_amount, d.available_terms, d.deposit_enabled,
       d.deposit_months, d.calc_method, d.show_local_currency, d.is_active, d.sort_order]
    );
    res.status(201).json({ country: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Country code already exists' });
      return;
    }
    throw err;
  }
});

// Update country
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = countrySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(d)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(req.params.id);
  const result = await query(
    `UPDATE countries SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }
  res.json({ country: result.rows[0] });
});

// Delete country
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await query('DELETE FROM countries WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
