# CLAUDE.md — Oaklease European Vendor Leasing Calculator

## Project Overview
A European vendor leasing calculator for Oaklease Ltd. Helps manufacturers and vendors provide leasing cost estimations and facilitate cross-border leasing across Europe. Features an admin GUI for managing countries, rates, vendors, and white-label calculator instances.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16
- **Auth**: WebAuthn/Passkey (via @simplewebauthn) for admin
- **Infrastructure**: Docker Compose (Nginx reverse proxy, Cloudflare Tunnel for SSL)
- **Email**: Microsoft 365 SMTP (OAuth2)

## Architecture
```
┌─────────────────────────────────────────────┐
│ Cloudflare Tunnel (SSL termination)         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ Docker Compose                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Nginx   │─▶│  Node.js │─▶│ PostgreSQL│ │
│  │  :80     │  │  :3000   │  │  :5432    │ │
│  └──────────┘  └──────────┘  └───────────┘ │
└─────────────────────────────────────────────┘
```

## Branding & Design
- **Font**: Montserrat (Google Fonts) — all weights
- **Primary text**: `#3c5a77`
- **Heading text**: `#2c2c2c`
- **Oaklease green accent**: `#4a8c3f`
- **Background**: `#ffffff` (main), `#f7f8fa` (sections), `#eef1f5` (cards)
- **Border/dividers**: `#dce3eb`
- **CTA buttons**: `#4a8c3f` bg, `#ffffff` text
- **Admin sidebar**: `#2c3e50` bg, `#ffffff` text
- **Error/warning**: `#e74c3c` / `#f39c12`
- **Success**: `#27ae60`
- **Copyright**: © Oaklease Ltd 2026
- **Logo**: Oaklease tree logo (uploaded asset, serve from /public/logo.png)

Design should match oaklease.co.uk: clean, professional, trustworthy. NOT generic AI aesthetic. No purple gradients. No Inter/Roboto. White backgrounds, subtle card shadows, the green used sparingly for CTAs and accents.

## Folder Structure
```
oaklease-euro-calculator/
├── CLAUDE.md                    # This file
├── PROJECT_SPEC.md              # Detailed specification
├── docker-compose.yml
├── docker-compose.dev.yml       # Dev overrides (hot reload)
├── .env.example
├── .gitignore
├── nginx/
│   └── default.conf
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Express entry point
│   │   ├── config/
│   │   │   ├── database.ts      # PostgreSQL connection (pg)
│   │   │   └── email.ts         # M365 SMTP config
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Passkey session validation
│   │   │   ├── rateLimiter.ts
│   │   │   └── gdpr.ts         # Privacy/data handling
│   │   ├── routes/
│   │   │   ├── auth.ts          # Passkey registration/login
│   │   │   ├── admin/
│   │   │   │   ├── countries.ts
│   │   │   │   ├── vendors.ts
│   │   │   │   ├── rates.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── settings.ts
│   │   │   ├── calculator.ts    # Public calc API
│   │   │   └── enquiry.ts       # Quote request submissions
│   │   ├── models/              # TypeScript interfaces + DB queries
│   │   ├── services/
│   │   │   ├── calculator.ts    # PMT + flat-rate logic
│   │   │   └── email.ts        # Send via M365
│   │   ├── utils/
│   │   │   └── currencies.ts    # EUR + local currency formatting
│   │   └── seed/
│   │       └── countries.ts     # Initial country data (VAT, regulatory)
│   └── migrations/
│       └── 001_initial.sql
├── client/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   └── logo.png             # Oaklease logo
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── styles/
│       │   └── globals.css      # CSS variables, Montserrat import
│       ├── components/
│       │   ├── layout/          # Header, Footer, Layout
│       │   ├── calculator/      # CalculatorForm, ResultsCard, CountrySelector
│       │   ├── vendor/          # VendorLayout, VendorHeader
│       │   ├── enquiry/         # QuoteRequestForm
│       │   ├── faq/             # FAQAccordion
│       │   └── admin/           # Dashboard, CountryManager, VendorManager, etc.
│       ├── pages/
│       │   ├── Home.tsx         # Main Oaklease calculator
│       │   ├── VendorCalculator.tsx  # /vendor-slug route
│       │   ├── FAQ.tsx
│       │   ├── admin/
│       │   │   ├── Login.tsx    # Passkey login
│       │   │   ├── Setup.tsx    # First-time setup
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Countries.tsx
│       │   │   ├── Vendors.tsx
│       │   │   ├── Rates.tsx
│       │   │   ├── Users.tsx
│       │   │   └── Settings.tsx
│       │   └── NotFound.tsx
│       ├── hooks/
│       ├── services/            # API client functions
│       ├── i18n/
│       │   ├── index.ts         # i18next setup
│       │   └── locales/
│       │       ├── en.json
│       │       ├── de.json
│       │       ├── fr.json
│       │       ├── es.json
│       │       ├── it.json
│       │       ├── nl.json
│       │       ├── sv.json
│       │       ├── da.json
│       │       ├── fi.json
│       │       ├── no.json
│       │       ├── pl.json
│       │       ├── pt.json
│       │       ├── el.json
│       │       ├── hu.json
│       │       ├── cs.json
│       │       ├── ro.json
│       │       ├── hr.json
│       │       ├── sk.json
│       │       └── sl.json
│       └── types/
└── agents/                      # Claude Code agent configs
    ├── security-review.md
    ├── code-quality.md
    ├── i18n-check.md
    └── gdpr-review.md
```

## Database Schema (PostgreSQL)

### admin_users
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
username        VARCHAR(100) UNIQUE NOT NULL
display_name    VARCHAR(200)
credential_id   TEXT          -- WebAuthn credential ID
public_key      TEXT          -- WebAuthn public key
counter         INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT NOW()
last_login      TIMESTAMPTZ
is_active       BOOLEAN DEFAULT true
```

### countries
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL
code            VARCHAR(3) UNIQUE NOT NULL   -- ISO 3166-1 alpha-2
flag_emoji      VARCHAR(10)
currency_code   VARCHAR(3) NOT NULL          -- EUR, GBP, SEK, etc.
vat_rate        DECIMAL(5,2) NOT NULL        -- e.g. 25.00
regulatory_info TEXT                         -- Rich text / markdown
lease_types     VARCHAR(50)[] DEFAULT '{finance,operating}'
min_amount      DECIMAL(12,2) DEFAULT 3000
max_amount      DECIMAL(12,2) DEFAULT 15000000
available_terms INTEGER[] DEFAULT '{24,36,48,60}'  -- months
deposit_enabled BOOLEAN DEFAULT true
deposit_months  INTEGER DEFAULT 1            -- advance months
calc_method     VARCHAR(20) DEFAULT 'pmt'    -- 'pmt' or 'flat'
show_local_currency BOOLEAN DEFAULT true     -- show alongside EUR
is_active       BOOLEAN DEFAULT true
sort_order      INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### interest_rates
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
country_id      UUID REFERENCES countries(id) ON DELETE CASCADE
term_months     INTEGER NOT NULL             -- 24, 36, 48, 60, 72, 84
rate            DECIMAL(5,3) NOT NULL        -- e.g. 5.500 (%)
is_active       BOOLEAN DEFAULT true
updated_at      TIMESTAMPTZ DEFAULT NOW()
UNIQUE(country_id, term_months)
```

### vendors
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(200) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL  -- URL: /vendor-slug
logo_url        VARCHAR(500)
welcome_text    TEXT
contact_email   VARCHAR(200)                 -- vendor receives enquiries
oaklease_email  VARCHAR(200) DEFAULT 'enquiries@oaklease.co.uk'
equipment_types VARCHAR(200)[]               -- e.g. '{CNC Machines,Lathes}'
allowed_countries UUID[]                     -- subset of countries
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### enquiries
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
vendor_id       UUID REFERENCES vendors(id)  -- NULL = main Oaklease calc
country_id      UUID REFERENCES countries(id)
contact_name    VARCHAR(200) NOT NULL
company_name    VARCHAR(200) NOT NULL
email           VARCHAR(200) NOT NULL
phone           VARCHAR(50)
equipment_type  VARCHAR(200)
equipment_value DECIMAL(12,2)
term_months     INTEGER
monthly_payment DECIMAL(12,2)
message         TEXT
gdpr_consent    BOOLEAN NOT NULL DEFAULT false
consent_timestamp TIMESTAMPTZ
ip_hash         VARCHAR(64)                  -- hashed, not raw IP
created_at      TIMESTAMPTZ DEFAULT NOW()
status          VARCHAR(20) DEFAULT 'new'    -- new, contacted, closed
```

### sessions
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES admin_users(id) ON DELETE CASCADE
token_hash      VARCHAR(128) NOT NULL
expires_at      TIMESTAMPTZ NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### settings
```sql
key             VARCHAR(100) PRIMARY KEY
value           TEXT NOT NULL
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

## Calculator Logic

### PMT (Annuity) Formula
```
M = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
  P = principal (equipment value minus deposit)
  r = monthly interest rate (annual rate / 12 / 100)
  n = number of months
  M = monthly payment (excl. VAT)
```

### Flat-Rate Formula
```
M = (P + (P × annual_rate / 100 × years)) / n

Where:
  P = principal (equipment value minus deposit)
  n = number of months
  M = monthly payment (excl. VAT)
```

### Output shown to user:
- Monthly payment (excl. VAT)
- Monthly payment (incl. VAT)
- Quarterly payment (excl. and incl. VAT)
- VAT amount breakdown
- Total lease cost
- Deposit/advance amount (if enabled for country)
- "Request a Quote" form

### Interest rates are NEVER shown to the end user.

## Admin GUI Features
1. **First-time setup**: Create initial admin user + register passkey
2. **Dashboard**: Overview stats (enquiries, active vendors, countries)
3. **Country management**: Add/edit/remove countries with all settings
4. **Interest rates**: Set rate per country per term length
5. **Vendor management**: Create vendor calculators with slug, logo upload, welcome text, equipment types, email recipients, country access
6. **User management**: Add/remove admin users, each with own passkey
7. **Enquiry viewer**: List/filter/export enquiries, mark status
8. **Settings**: Email config (SMTP/from address), default values

## Vendor White-Label Calculators
- URL pattern: `euro.oaklease.co.uk/{vendor-slug}`
- Shows: vendor logo + welcome text at top, Oaklease branding in footer
- Calculator uses only the countries assigned to that vendor
- Equipment type dropdown populated from vendor config (auto-shows if >1 type)
- Enquiry emails sent to BOTH vendor email AND Oaklease email (configured per vendor)
- Same Oaklease styling — NO custom colours for vendors

## API Routes

### Public
```
GET  /api/countries                     # Active countries list (no rates)
GET  /api/countries/:code               # Country detail + regulatory info
POST /api/calculate                     # { countryCode, amount, termMonths, depositMonths? }
POST /api/enquiry                       # Submit quote request
GET  /api/vendor/:slug                  # Vendor config for white-label
GET  /api/faq                           # FAQ content
```

### Admin (requires passkey session)
```
POST /api/auth/register-options         # First setup: get registration options
POST /api/auth/register                 # Complete registration
POST /api/auth/login-options            # Get authentication options
POST /api/auth/login                    # Complete authentication
POST /api/auth/logout

GET/POST/PUT/DELETE /api/admin/countries
GET/POST/PUT/DELETE /api/admin/rates
GET/POST/PUT/DELETE /api/admin/vendors
POST                /api/admin/vendors/:id/logo   # Upload logo
GET/POST/DELETE     /api/admin/users
GET                 /api/admin/enquiries
PUT                 /api/admin/enquiries/:id/status
GET                 /api/admin/settings
PUT                 /api/admin/settings
```

## i18n Strategy
- Use `react-i18next` with JSON locale files
- Default language: English
- Supported: EN, DE, FR, ES, IT, NL, SV, DA, FI, NO, PL, PT, EL, HU, CS, RO, HR, SK, SL
- Auto-detect browser language, allow manual switch
- Translate: UI labels, calculator fields, FAQ content, error messages
- Admin GUI: English only
- Regulatory info per country: stored as entered (admin decides language)

## Security Requirements
- All admin routes behind passkey authentication
- CSRF protection on all state-changing endpoints
- Rate limiting on calculator + enquiry endpoints
- Input validation with zod on all endpoints
- SQL injection prevention via parameterised queries (pg library)
- XSS prevention: React default escaping + DOMPurify for regulatory markdown
- CORS: restrict to configured domains
- No raw IP storage — hash only (GDPR)
- Helmet.js for security headers
- Session tokens: httpOnly, secure, sameSite cookies

## GDPR Requirements
- Explicit consent checkbox on enquiry form
- Consent timestamp stored
- No raw IP logging (hash only)
- Data retention policy configurable in admin settings
- Export/delete enquiry data capability
- Privacy notice link in calculator footer
- Cookie consent not needed (no tracking cookies — calculator only)

## Environment Variables (.env)
```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=oaklease_calc
DB_USER=oaklease
DB_PASSWORD=

# App
NODE_ENV=production
PORT=3000
SESSION_SECRET=
CORS_ORIGINS=https://euro.oaklease.co.uk

# Email (M365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=enquiries@oaklease.co.uk

# WebAuthn
WEBAUTHN_RP_NAME=Oaklease Admin
WEBAUTHN_RP_ID=euro.oaklease.co.uk
WEBAUTHN_ORIGIN=https://euro.oaklease.co.uk
```

## Git Workflow
- **Main branch**: `main` (production-ready)
- **Development**: `develop` (integration)
- **Features**: `feature/feature-name` branched from develop
- **Hotfixes**: `hotfix/description` branched from main
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `security:`)
- **Tags**: Semantic versioning `v1.0.0`
- **PR process**: Feature → develop → main (with agent checks)

## Development Workflow (Mac M5)
```bash
# Clone and start
git clone <repo>
cd oaklease-euro-calculator
cp .env.example .env  # Fill in values
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Client: http://localhost:5173 (Vite HMR)
# Server: http://localhost:3000
# DB: localhost:5432
```

## Deployment (Ubuntu Server)
```bash
docker compose up -d --build
# Cloudflare Tunnel points to nginx:80
```

## Key Dependencies
### Server
- express, cors, helmet, express-rate-limit
- pg (PostgreSQL client — NOT an ORM)
- @simplewebauthn/server
- zod (validation)
- nodemailer (email)
- multer (logo uploads)
- dompurify + jsdom (sanitise markdown)
- uuid

### Client
- react, react-dom, react-router-dom
- react-i18next, i18next, i18next-browser-languagedetector
- @simplewebauthn/browser
- axios
- react-hook-form + zod
- lucide-react (icons)
- dompurify (render regulatory info safely)

## FAQ Content
Include European leasing FAQ from the Oaklease website as a dedicated /faq page. Content is stored in the database via admin settings so it can be updated. Pre-seed with FAQ content covering:
- What is equipment leasing
- Who can lease in Europe
- EU regulation and harmonisation
- Countries covered
- Amounts and terms
- Deposits and advance payments
- IFRS 16 compliance
- End of lease options
- Vendor programmes
- Finance vs operating lease
- White label options
- Cross-border supplier/lessee arrangements

## Build Order (Suggested Phases)
### Phase 1 — Foundation
- Docker setup, database, migrations
- Express server with health check
- React app with routing and layout
- CSS variables, Montserrat, branding

### Phase 2 — Admin Core
- First-time setup flow (passkey registration)
- Admin login with passkey
- Country CRUD + interest rate management
- Settings page

### Phase 3 — Calculator
- Public calculator API (PMT + flat-rate)
- Calculator UI with country selector
- Results display (monthly, quarterly, VAT)
- Currency formatting (EUR + local)

### Phase 4 — Vendors & Enquiries
- Vendor CRUD in admin (logo upload, config)
- Vendor white-label route + layout
- Quote request form + email sending
- Enquiry management in admin

### Phase 5 — i18n & FAQ
- i18next setup + locale files
- Language switcher
- FAQ page with accordion

### Phase 6 — Hardening
- Security review agent pass
- GDPR review agent pass
- Code quality agent pass
- Rate limiting, input validation audit
- Error handling + logging
