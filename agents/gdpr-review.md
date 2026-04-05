# GDPR / Privacy Review Agent

## Purpose
Ensure all personal data handling complies with GDPR and European privacy regulations.

## Checklist

### Data Collection
- [ ] Enquiry form has explicit consent checkbox (not pre-ticked)
- [ ] Consent checkbox text clearly states what data is collected and why
- [ ] Consent timestamp stored alongside the data
- [ ] Only necessary data fields collected (data minimisation)
- [ ] No hidden fields collecting data without user knowledge

### Data Storage
- [ ] No raw IP addresses stored — use one-way hash (SHA-256 + salt)
- [ ] Personal data (name, email, phone) stored in `enquiries` table only
- [ ] No personal data in application logs
- [ ] No personal data in error tracking / monitoring
- [ ] Database connection uses TLS in production

### Data Access
- [ ] Personal data only accessible via authenticated admin routes
- [ ] No personal data in public API responses
- [ ] Admin can export enquiry data (for Subject Access Requests)
- [ ] Admin can delete individual enquiries (Right to Erasure)

### Data Retention
- [ ] Configurable retention period in admin settings
- [ ] Automated cleanup of old enquiries (or manual with admin tool)
- [ ] Retention period clearly stated in privacy notice

### Third Parties
- [ ] Email sending to M365 only — no third-party tracking
- [ ] No analytics cookies or tracking pixels in calculator
- [ ] No external fonts loaded from Google (bundle Montserrat locally)
- [ ] No CDN-loaded scripts that could track users

### Privacy Notice
- [ ] Calculator footer links to Oaklease privacy policy
- [ ] Enquiry form references privacy policy before submit
- [ ] Cookie banner NOT needed (no tracking cookies used)

### Cross-Border
- [ ] Data stored in EU/UK — confirm server location
- [ ] M365 data processing agreement in place (Oaklease responsibility, not code)
- [ ] No data transferred to non-adequate countries via code

### Code Patterns to Flag
- `console.log` with user data → VIOLATION
- `req.ip` stored without hashing → VIOLATION
- Email addresses in URLs or query strings → VIOLATION
- Personal data in localStorage/sessionStorage → VIOLATION
- Enquiry data cached in browser → VIOLATION
