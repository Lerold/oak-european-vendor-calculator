import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { hashIP } from '../middleware/gdpr';
import { sendEnquiryEmail } from '../services/email';

const router = Router();

const enquirySchema = z.object({
  vendorSlug: z.string().optional(),
  countryCode: z.string().min(2).max(3).optional(),
  contactName: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  equipmentType: z.string().max(200).optional(),
  equipmentValue: z.number().positive().optional(),
  termMonths: z.number().int().positive().optional(),
  monthlyPayment: z.number().positive().optional(),
  message: z.string().max(2000).optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to data processing to submit an enquiry' }),
  }),
});

// POST /api/enquiry
router.post('/', async (req: Request, res: Response) => {
  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;

  try {
    // Resolve vendor if slug provided
    let vendorId: string | null = null;
    let vendorName: string | null = null;
    let vendorEmail: string | null = null;
    let oakleaseEmail = 'enquiries@oaklease.co.uk';

    if (d.vendorSlug) {
      const vendorResult = await query(
        'SELECT id, name, contact_email, oaklease_email FROM vendors WHERE slug = $1 AND is_active = true',
        [d.vendorSlug]
      );
      if (vendorResult.rows.length > 0) {
        vendorId = vendorResult.rows[0].id;
        vendorName = vendorResult.rows[0].name;
        vendorEmail = vendorResult.rows[0].contact_email;
        oakleaseEmail = vendorResult.rows[0].oaklease_email || oakleaseEmail;
      }
    }

    // Resolve country
    let countryId: string | null = null;
    let countryName: string | null = null;
    if (d.countryCode) {
      const countryResult = await query(
        'SELECT id, name FROM countries WHERE code = $1 AND is_active = true',
        [d.countryCode.toUpperCase()]
      );
      if (countryResult.rows.length > 0) {
        countryId = countryResult.rows[0].id;
        countryName = countryResult.rows[0].name;
      }
    }

    // Hash IP for GDPR compliance — never store raw IP
    const ipHash = hashIP(req.ip || 'unknown');

    // Store enquiry
    const result = await query(
      `INSERT INTO enquiries
        (vendor_id, country_id, contact_name, company_name, email, phone,
         equipment_type, equipment_value, term_months, monthly_payment,
         message, gdpr_consent, consent_timestamp, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13)
       RETURNING id`,
      [
        vendorId, countryId, d.contactName, d.companyName, d.email,
        d.phone || null, d.equipmentType || null, d.equipmentValue || null,
        d.termMonths || null, d.monthlyPayment || null,
        d.message || null, true, ipHash,
      ]
    );

    // Send email notification(s)
    const recipients: string[] = [oakleaseEmail];
    if (vendorEmail) recipients.push(vendorEmail);

    await sendEnquiryEmail(recipients, {
      contactName: d.contactName,
      companyName: d.companyName,
      email: d.email,
      phone: d.phone,
      equipmentType: d.equipmentType,
      equipmentValue: d.equipmentValue,
      termMonths: d.termMonths,
      monthlyPayment: d.monthlyPayment,
      countryName: countryName || undefined,
      message: d.message,
      vendorName: vendorName || undefined,
    });

    res.status(201).json({
      success: true,
      enquiryId: result.rows[0].id,
    });
  } catch {
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
});

export default router;
