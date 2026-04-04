# Security Review Agent

## Purpose
Review all code changes for security vulnerabilities before merge.

## Checklist
Run against every PR touching `server/` or `client/src/services/`:

### Authentication & Authorization
- [ ] All `/api/admin/*` routes use auth middleware
- [ ] Passkey registration only available during setup or by authenticated admin
- [ ] Session tokens are httpOnly, secure, sameSite=strict cookies
- [ ] Session expiry is enforced (max 24h)
- [ ] No hardcoded secrets or credentials in source

### Input Validation
- [ ] All request bodies validated with zod schemas
- [ ] All URL params validated (UUID format, slug format)
- [ ] File uploads validated (type, size, filename sanitisation)
- [ ] No user input directly interpolated into SQL — use parameterised queries only

### XSS Prevention
- [ ] Regulatory info / markdown rendered with DOMPurify
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] Vendor welcome text sanitised on save AND render

### Data Exposure
- [ ] Interest rates NEVER returned in public API responses
- [ ] Admin-only fields not leaked in public endpoints
- [ ] Error messages don't expose stack traces or DB details in production
- [ ] No raw IP addresses stored (hash only)

### Infrastructure
- [ ] Helmet.js configured with strict CSP
- [ ] Rate limiting on: login attempts (5/min), calculator (30/min), enquiry (5/min)
- [ ] CORS restricted to configured origins only
- [ ] No `*` wildcard in CORS

### Dependencies
- [ ] No known vulnerabilities (`npm audit`)
- [ ] No unnecessary dependencies
- [ ] Lock files committed (package-lock.json)
