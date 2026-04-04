import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/vendor/:slug — public vendor config for white-label calculator
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const vendorResult = await query(
      `SELECT id, name, slug, logo_url, welcome_text, equipment_types, allowed_countries
       FROM vendors
       WHERE slug = $1 AND is_active = true`,
      [req.params.slug.toLowerCase()]
    );

    if (vendorResult.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const vendor = vendorResult.rows[0];

    // Fetch only countries allowed for this vendor
    let countrySql = `
      SELECT code, name, flag_emoji, currency_code, vat_rate,
             min_amount, max_amount, available_terms,
             deposit_enabled, deposit_months, calc_method, show_local_currency
      FROM countries
      WHERE is_active = true
    `;
    const params: unknown[] = [];

    if (vendor.allowed_countries && vendor.allowed_countries.length > 0) {
      countrySql += ` AND id = ANY($1)`;
      params.push(vendor.allowed_countries);
    }

    countrySql += ' ORDER BY name ASC';
    const countriesResult = await query(countrySql, params);

    res.json({
      vendor: {
        name: vendor.name,
        slug: vendor.slug,
        logoUrl: vendor.logo_url,
        welcomeText: vendor.welcome_text,
        equipmentTypes: vendor.equipment_types,
      },
      countries: countriesResult.rows,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load vendor' });
  }
});

export default router;
