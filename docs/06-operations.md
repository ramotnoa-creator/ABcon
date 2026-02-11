# Operations - ANcon

## Environments

| Environment | Purpose | Database | URL |
|---|---|---|---|
| Local dev | Development | Neon dev branch (TODO: create) | localhost:5173 |
| Local (mock) | Quick dev | localStorage (VITE_DEV_MODE=true) | localhost:5173 |
| Production | Live | Neon main branch | Vercel URL |

## Deployment

- **Platform:** Vercel
- **Trigger:** Auto-deploy from main branch
- **Build command:** `npm run build`
- **Environment variables:** Vercel dashboard
- **Domain:** [TBD]

## Database

- **Provider:** Neon PostgreSQL (serverless)
- **Console:** https://console.neon.tech
- **Migrations:** Located in `/migrations/` (001-009)
- **Migration runner:** `node migrations/run-migrations.cjs`

### Backup Strategy

- Neon provides branching (create snapshot before migrations)
- Before any migration: `neon branches create --name pre-migration-YYYY-MM-DD`
- Rollback scripts exist for migrations 001-002 only
- All migration files should have rollback comments at top

### Migration Process

1. Create migration file: `migrations/NNN-description.sql`
2. Add rollback comment: `-- ROLLBACK: [undo SQL]`
3. Test on dev branch first
4. Apply to production: `node migrations/run-migrations.cjs`
5. Verify in Neon console
6. Update `docs/03-data-model.md` if relationships changed

## Monitoring

- **Uptime:** Not configured yet (TODO: add UptimeRobot)
- **Errors:** Not configured yet (TODO: add Sentry)
- **Performance:** Vercel analytics available
- **Database:** Neon console shows query performance

## Testing

- **E2E Tests:** Playwright (`npx playwright test`)
- **Accessibility:** axe-core (`tests/accessibility/`)
- **Visual:** Playwright visual tests
- **RTL:** Hebrew layout tests (`tests/accessibility/hebrew-layout.spec.ts`)
