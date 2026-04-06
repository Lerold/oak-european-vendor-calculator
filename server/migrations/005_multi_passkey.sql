-- Migration 005: Multiple passkeys per user (max 5)
-- Moves credentials from admin_users to a dedicated table

CREATE TABLE user_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    credential_id   TEXT NOT NULL UNIQUE,
    public_key      TEXT NOT NULL,
    counter         INTEGER DEFAULT 0,
    name            VARCHAR(100) DEFAULT 'Passkey',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_credentials_user ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_cred ON user_credentials(credential_id);

-- Migrate existing credentials from admin_users to new table
INSERT INTO user_credentials (user_id, credential_id, public_key, counter, name)
SELECT id, credential_id, public_key, counter, 'Primary Passkey'
FROM admin_users
WHERE credential_id IS NOT NULL;
