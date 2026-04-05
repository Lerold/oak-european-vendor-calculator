# i18n Language Agent

## Purpose
Ensure all user-facing text is internationalised and translations are complete.

## Rules

### Source Code
- [ ] No hardcoded user-facing strings in React components
- [ ] All text uses `t('key')` from react-i18next
- [ ] Translation keys use dot notation: `calculator.equipmentValue`, `faq.title`
- [ ] Plurals handled with i18next plural syntax
- [ ] Number formatting uses `Intl.NumberFormat` with locale
- [ ] Currency formatting uses `Intl.NumberFormat` with currency code
- [ ] Date formatting uses `Intl.DateTimeFormat` with locale

### Locale Files
- [ ] English (`en.json`) is the source of truth — always complete
- [ ] All other locale files have the same keys as English
- [ ] No missing keys in any locale file
- [ ] No unused keys (keys in JSON but not referenced in code)
- [ ] Keys are alphabetically sorted within each section

### Supported Locales
en, de, fr, es, it, nl, sv, da, fi, no, pl, pt, el, hu, cs, ro, hr, sk, sl

### Key Structure
```json
{
  "common": { "submit", "cancel", "loading", "error" },
  "nav": { "home", "faq", "admin", "language" },
  "calculator": { "title", "equipmentValue", "country", "term", "deposit", "calculate" },
  "results": { "monthly", "quarterly", "totalCost", "vatAmount", "inclVat", "exclVat" },
  "enquiry": { "title", "name", "company", "email", "phone", "message", "consent", "submit" },
  "faq": { "title", "questions" },
  "countries": { country names in each language },
  "footer": { "copyright", "privacy", "terms" },
  "validation": { error messages }
}
```

### Admin GUI
- Admin interface is English-only (no translation needed)
- Admin-entered content (regulatory info, FAQ, vendor text) is NOT translated by the system — admin enters it in the appropriate language

### Exclusions
- Console logs and error codes: English only
- Database column names: not translated
- API error codes: not translated (human message is translated client-side)
