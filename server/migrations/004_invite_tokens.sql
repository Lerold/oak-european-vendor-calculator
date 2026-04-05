-- Migration 004: One-time invite tokens for admin user registration

CREATE TABLE invite_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    created_by  UUID REFERENCES admin_users(id),
    display_name VARCHAR(200),
    used_at     TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_tokens_hash ON invite_tokens(token_hash);
