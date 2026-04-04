# Oaklease European Vendor Leasing Calculator

European equipment leasing calculator with admin GUI, vendor white-labelling, and passkey authentication.

© Oaklease Ltd 2026

## Quick Start (Mac M5 — Development)

```bash
cp .env.example .env
# Edit .env with your values

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Client:  http://localhost:5173
# API:     http://localhost:3000
# DB:      localhost:5432
```

## Production (Ubuntu Server)

```bash
cp .env.example .env
# Set production values

docker compose up -d --build
# Configure Cloudflare Tunnel → localhost:80
```

## First-Time Setup

1. Navigate to `/admin/setup`
2. Create your admin username
3. Register your passkey (biometric / security key)
4. Start adding countries, rates, and vendors

## Project Documentation

- `CLAUDE.md` — Full project specification (for Claude Code)
- `agents/` — Code review agent configurations
- `server/migrations/` — Database schema

## Git Workflow

```bash
git checkout -b feature/your-feature develop
# ... work ...
git commit -m "feat: description"
git push origin feature/your-feature
# PR → develop → main
```
