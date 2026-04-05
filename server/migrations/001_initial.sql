-- Migration 001: Initial schema
-- Oaklease European Vendor Leasing Calculator

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users (passkey authentication)
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) UNIQUE NOT NULL,
    display_name    VARCHAR(200),
    credential_id   TEXT,
    public_key      TEXT,
    counter         INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true
);

-- Admin sessions
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Countries (fully admin-managed)
CREATE TABLE countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(3) UNIQUE NOT NULL,
    flag_emoji      VARCHAR(10),
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'EUR',
    vat_rate        DECIMAL(5,2) NOT NULL,
    regulatory_info TEXT,
    lease_types     VARCHAR(50)[] DEFAULT '{finance,operating}',
    min_amount      DECIMAL(12,2) DEFAULT 3000,
    max_amount      DECIMAL(12,2) DEFAULT 15000000,
    available_terms INTEGER[] DEFAULT '{24,36,48,60}',
    deposit_enabled BOOLEAN DEFAULT true,
    deposit_months  INTEGER DEFAULT 1,
    calc_method     VARCHAR(20) DEFAULT 'pmt',
    show_local_currency BOOLEAN DEFAULT true,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_active ON countries(is_active);

-- Interest rates (per country, per term length — NEVER exposed publicly)
CREATE TABLE interest_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id      UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    term_months     INTEGER NOT NULL,
    rate            DECIMAL(5,3) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, term_months)
);
CREATE INDEX idx_rates_country ON interest_rates(country_id);

-- Vendors (white-label calculator instances)
CREATE TABLE vendors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    logo_url        VARCHAR(500),
    welcome_text    TEXT,
    contact_email   VARCHAR(200),
    oaklease_email  VARCHAR(200) DEFAULT 'enquiries@oaklease.co.uk',
    equipment_types VARCHAR(200)[],
    allowed_countries UUID[],
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_active ON vendors(is_active);

-- Enquiries (quote requests from calculator users)
CREATE TABLE enquiries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id       UUID REFERENCES vendors(id),
    country_id      UUID REFERENCES countries(id),
    contact_name    VARCHAR(200) NOT NULL,
    company_name    VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL,
    phone           VARCHAR(50),
    equipment_type  VARCHAR(200),
    equipment_value DECIMAL(12,2),
    term_months     INTEGER,
    monthly_payment DECIMAL(12,2),
    message         TEXT,
    gdpr_consent    BOOLEAN NOT NULL DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    ip_hash         VARCHAR(64),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'new'
);
CREATE INDEX idx_enquiries_vendor ON enquiries(vendor_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_created ON enquiries(created_at DESC);

-- Application settings (key-value store)
CREATE TABLE settings (
    key             VARCHAR(100) PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
    ('setup_complete', 'false'),
    ('email_from', 'enquiries@oaklease.co.uk'),
    ('data_retention_days', '730'),
    ('default_min_amount', '3000'),
    ('default_max_amount', '15000000');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_countries_updated BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_rates_updated BEFORE UPDATE ON interest_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_vendors_updated BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_settings_updated BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
