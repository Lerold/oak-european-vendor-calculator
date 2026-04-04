# Code Quality Agent

## Purpose
Enforce consistent code quality, patterns, and maintainability.

## Standards

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` types — use proper interfaces
- All functions have explicit return types
- Shared types in `types/` directories

### Naming
- Files: kebab-case (`country-manager.tsx`)
- Components: PascalCase (`CountryManager`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Database columns: snake_case
- API routes: kebab-case (`/api/admin/interest-rates`)

### Structure
- Components: one component per file, max 200 lines
- API routes: thin controllers, business logic in services
- Database queries in models, not in route handlers
- Shared utilities in `utils/`

### Error Handling
- All async routes wrapped in try/catch
- Consistent error response format: `{ error: string, code: string }`
- Database errors caught and wrapped (never expose raw PG errors)
- Client: toast notifications for errors, not alerts

### Testing
- Unit tests for calculator service (PMT + flat-rate edge cases)
- Unit tests for input validation schemas
- Integration tests for auth flow
- Test file naming: `*.test.ts`

### Performance
- Database queries use indexes on: country code, vendor slug, enquiry status
- React components use memo where appropriate
- API responses include cache headers for static data (countries, FAQ)
- Vendor logos optimised on upload (max 500px width)

### Commit Messages
Follow Conventional Commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code restructuring
- `security:` security improvement
- `i18n:` translation updates
- `chore:` tooling/config changes
