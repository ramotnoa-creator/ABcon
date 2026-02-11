# Setup Guide - ANcon

## Prerequisites

- Node.js 20+
- npm
- Neon PostgreSQL account (https://neon.tech)

## Installation

```bash
git clone [repo-url]
cd ANcon
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Where to Get It | Public? |
|---|---|:---:|
| `VITE_NEON_DATABASE_URL` | Neon dashboard > Connection Details | NO (but currently VITE_ prefixed - see security note) |
| `VITE_DEV_MODE` | Set to `true` for localStorage mode | YES |
| `VITE_GOOGLE_API_KEY` | Google Cloud Console | NO (should not be VITE_) |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console | YES (OAuth client ID is public) |

**Security Note:** Database URL should NOT have VITE_ prefix in production. This exposes credentials to the client browser. Plan to move to server-side API routes.

## Database Setup

**Important:** Use a dev branch for local development, never the production database.

1. Go to Neon dashboard
2. Create a "dev" branch from main
3. Copy the dev branch connection string to `.env.local`
4. Run migrations: `node migrations/run-migrations.cjs`

## Running Locally

```bash
npm run dev
```

Opens at: `http://localhost:5173`

**Dev Mode:** Set `VITE_DEV_MODE=true` to use localStorage instead of Neon (faster development without DB).

## Running Tests

```bash
npx playwright test                    # All tests
npx playwright test tests/accessibility # Accessibility tests only
```
