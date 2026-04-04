import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../../config/database';
import { AuthRequest, requireAuth } from '../../middleware/auth';
import { validateUuidParam } from '../../middleware/validate';

const router = Router();
router.use(requireAuth as any);
router.param('id', validateUuidParam('id'));

// Logo upload config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/logos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `vendor-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, and WebP images are allowed'));
    }
  },
});

const vendorSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  welcome_text: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  oaklease_email: z.string().email().default('enquiries@oaklease.co.uk'),
  equipment_types: z.array(z.string()).optional(),
  allowed_countries: z.array(z.string().uuid()).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cta_text: z.string().max(100).optional(),
  default_country: z.string().min(2).max(3).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

// List all vendors
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM vendors ORDER BY name ASC'
    );
    res.json({ vendors: result.rows });
  } catch {
    res.status(500).json({ error: 'Failed to load vendors' });
  }
});

// Get single vendor
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json({ vendor: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to load vendor' });
  }
});

// Create vendor
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  try {
    const result = await query(
      `INSERT INTO vendors (name, slug, welcome_text, contact_email, oaklease_email,
         equipment_types, allowed_countries, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [d.name, d.slug, d.welcome_text, d.contact_email || null, d.oaklease_email,
       d.equipment_types || null, d.allowed_countries || null, d.is_active]
    );
    res.status(201).json({ vendor: result.rows[0] });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      res.status(409).json({ error: 'Vendor slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = vendorSchema.partial().safeParse(req.body);
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
      values.push(key === 'contact_email' && value === '' ? null : value);
      idx++;
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(req.params.id);
  try {
    const result = await query(
      `UPDATE vendors SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json({ vendor: result.rows[0] });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      res.status(409).json({ error: 'Vendor slug already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Upload vendor logo (with multer error handling)
router.post('/:id/logo', (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large (max 5MB)' });
        return;
      }
      res.status(400).json({ error: err.message || 'Upload failed' });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;

  try {
    // Delete old logo file if it exists
    const existing = await query('SELECT logo_url FROM vendors WHERE id = $1', [req.params.id]);
    if (existing.rows.length > 0 && existing.rows[0].logo_url) {
      const oldPath = path.join(__dirname, '../../..', existing.rows[0].logo_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const result = await query(
      'UPDATE vendors SET logo_url = $1 WHERE id = $2 RETURNING *',
      [logoUrl, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json({ vendor: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Delete vendor
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM vendors WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

export default router;
