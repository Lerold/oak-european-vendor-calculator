-- Migration 003: Anonymous calculator usage logs (GDPR-compliant)
-- No PII stored — only aggregate data for analytics

CREATE TABLE calculation_logs (
    id              BIGSERIAL PRIMARY KEY,
    country_code    VARCHAR(3) NOT NULL,
    vendor_slug     VARCHAR(100),
    term_months     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calc_logs_created ON calculation_logs(created_at DESC);
CREATE INDEX idx_calc_logs_country ON calculation_logs(country_code);
CREATE INDEX idx_calc_logs_vendor ON calculation_logs(vendor_slug);
