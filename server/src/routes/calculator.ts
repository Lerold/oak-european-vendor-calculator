import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { calculate } from '../services/calculator';

const router = Router();

const calculateSchema = z.object({
  countryCode: z.string().min(2).max(3),
  amount: z.number().positive(),
  termMonths: z.number().int().positive(),
  depositMonths: z.number().int().min(0).optional(),
  vendorSlug: z.string().max(100).optional(),
});

// POST /api/calculate
router.post('/', async (req: Request, res: Response) => {
  const parsed = calculateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { countryCode, amount, termMonths, depositMonths } = parsed.data;

  try {
    // Fetch country config
    const countryResult = await query(
      `SELECT id, name, code, vat_rate, min_amount, max_amount, available_terms,
              deposit_enabled, deposit_months, calc_method, currency_code, show_local_currency
       FROM countries WHERE code = $1 AND is_active = true`,
      [countryCode.toUpperCase()]
    );

    if (countryResult.rows.length === 0) {
      res.status(404).json({ error: 'Country not found or not active' });
      return;
    }

    const country = countryResult.rows[0];

    // Validate amount within country limits
    if (amount < Number(country.min_amount) || amount > Number(country.max_amount)) {
      res.status(400).json({
        error: `Amount must be between ${country.min_amount} and ${country.max_amount}`,
      });
      return;
    }

    // Validate term is available for this country
    const availableTerms: number[] = country.available_terms || [24, 36, 48, 60];
    if (!availableTerms.includes(termMonths)) {
      res.status(400).json({
        error: `Term ${termMonths} months is not available. Choose from: ${availableTerms.join(', ')}`,
      });
      return;
    }

    // Fetch interest rate for this country + term (NEVER exposed to user)
    const rateResult = await query(
      `SELECT rate FROM interest_rates
       WHERE country_id = $1 AND term_months = $2 AND is_active = true`,
      [country.id, termMonths]
    );

    if (rateResult.rows.length === 0) {
      res.status(400).json({ error: 'No rate configured for this country and term' });
      return;
    }

    const annualRate = Number(rateResult.rows[0].rate);
    const effectiveDepositMonths = depositMonths !== undefined
      ? depositMonths
      : (country.deposit_enabled ? country.deposit_months : 0);

    const result = calculate({
      amount,
      termMonths,
      annualRate,
      vatRate: Number(country.vat_rate),
      calcMethod: country.calc_method,
      depositMonths: country.deposit_enabled ? effectiveDepositMonths : 0,
      depositEnabled: country.deposit_enabled,
    });

    // Log calculation anonymously (no PII — GDPR compliant)
    query(
      'INSERT INTO calculation_logs (country_code, vendor_slug, term_months) VALUES ($1, $2, $3)',
      [countryCode.toUpperCase(), req.body.vendorSlug || null, termMonths]
    ).catch(() => { /* non-critical — don't fail the request */ });

    // Return results WITHOUT the interest rate
    res.json({
      country: {
        name: country.name,
        code: country.code,
        currencyCode: country.currency_code,
        vatRate: Number(country.vat_rate),
        showLocalCurrency: country.show_local_currency,
      },
      input: {
        equipmentValue: amount,
        termMonths,
        depositMonths: country.deposit_enabled ? effectiveDepositMonths : 0,
      },
      result,
    });
  } catch {
    res.status(500).json({ error: 'Calculation failed' });
  }
});

export default router;
