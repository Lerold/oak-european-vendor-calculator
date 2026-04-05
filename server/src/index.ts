import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import pool, { testConnection } from './config/database';
import { startSessionCleanup } from './middleware/auth';
import authRoutes from './routes/auth';
import publicCountriesRoutes from './routes/countries';
import calculatorRoutes from './routes/calculator';
import vendorRoutes from './routes/vendor';
import enquiryRoutes from './routes/enquiry';
import faqRoutes from './routes/faq';
import publicSettingsRoutes from './routes/settings-public';
import countriesRoutes from './routes/admin/countries';
import ratesRoutes from './routes/admin/rates';
import settingsRoutes from './routes/admin/settings';
import usersRoutes from './routes/admin/users';
import vendorsAdminRoutes from './routes/admin/vendors';
import enquiriesAdminRoutes from './routes/admin/enquiries';
import analyticsAdminRoutes from './routes/admin/analytics';
import invitesAdminRoutes from './routes/admin/invites';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust first proxy (Nginx) so rate limiting uses real client IP
app.set('trust proxy', 1);

// Security headers with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://www.google-analytics.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://analytics.google.com"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
}));

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5177'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Body parsing & cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const enquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later' },
});

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check (no rate limit)
app.get('/api/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'disconnected',
  });
});

// Public routes with rate limiting
app.use('/api/countries', apiLimiter, publicCountriesRoutes);
app.use('/api/calculate', apiLimiter, calculatorRoutes);
app.use('/api/vendor', apiLimiter, vendorRoutes);
app.use('/api/faq', apiLimiter, faqRoutes);
app.use('/api/settings/public', apiLimiter, publicSettingsRoutes);
app.use('/api/enquiry', enquiryLimiter, enquiryRoutes);

// Auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Admin routes (auth required — enforced in each router)
app.use('/api/admin/countries', countriesRoutes);
app.use('/api/admin/rates', ratesRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/vendors', vendorsAdminRoutes);
app.use('/api/admin/enquiries', enquiriesAdminRoutes);
app.use('/api/admin/analytics', analyticsAdminRoutes);
app.use('/api/admin/invites', invitesAdminRoutes);

// Global error handler — never leak stack traces or DB details
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Run migrations on startup, then start server
async function start() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const fs = await import('fs');
      const migrationsDir = path.join(__dirname, '../migrations');

      if (fs.existsSync(migrationsDir)) {
        const { rows: applied } = await client.query('SELECT name FROM _migrations ORDER BY id');
        const appliedNames = new Set(applied.map((r) => r.name));

        const files = fs.readdirSync(migrationsDir)
          .filter((f: string) => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          if (appliedNames.has(file)) continue;
          console.log(`Applying migration: ${file}`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
          await client.query('BEGIN');
          try {
            await client.query(sql);
            await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`Migration applied: ${file}`);
          } catch (err) {
            await client.query('ROLLBACK');
            console.error(`Migration failed: ${file}`, err);
            throw err;
          }
        }
      }
    } finally {
      client.release();
    }
    console.log('Database migrations complete');
  } catch (err) {
    console.error('Database migration error:', err);
    console.log('Server starting without migrations — database may not be ready');
  }

  // Start periodic session cleanup
  startSessionCleanup();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oaklease API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();

export default app;
