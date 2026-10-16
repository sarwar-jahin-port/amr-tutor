# AMR Tutor

A free, direct home-tuition marketplace connecting parents/guardians and tutors across Bangladesh. No commissions, no payments, no wallet — guardians publish tuition listings, tutors apply, both communicate under the platform's privacy rules.

See [`docs/master_implementation_blueprint.md`](docs/master_implementation_blueprint.md) for the full phased implementation plan and [`docs/decisions/`](docs/decisions/) for finalized product decisions.

## Status

**Phases 1–13 of the blueprint are implemented, plus an admin panel beyond the original plan.** Registration (email/password and Google OAuth), login, email verification, token refresh/rotation, logout, and self-service role management work end to end, with role- and status-based authorization guards protecting every route by default. The "Learning Commons" visual direction (docs/ui-ux.md) is implemented as design tokens (`apps/web/app/globals.css`) and ~20 reusable components under `apps/web/components/ui/` — see `/style-guide` for a living reference. Visitors can browse published tutor profiles and tuition listings without an account, and search and filter both. Tutors build a profile through a guided onboarding wizard and apply to listings; guardians build a profile, publish a listing through a guided wizard, and review/shortlist/accept applicants — a listing only becomes publicly visible after admin review. Accepted applications unlock in-platform messaging and consent-based contact sharing (phone/email revealed only once both parties explicitly agree). Tutors can request university-affiliation/academic-credential verification and guardians can request identity verification, both with private evidence upload and an authorized reviewer queue. Users can report a listing, profile, or conversation; an admin panel (`/admin`) covers user management, account impersonation, listing/report/verification/guardian-verification review, an audit log, and an analytics dashboard. A security and privacy review (decision record 0002) and the Phase 13 test suite are complete. The public footer now links to dedicated Safety Guidelines, Privacy Policy, and Terms of Service pages (`/safety-guidelines`, `/privacy-policy`, `/terms-of-service`). Bangla localization, payments, and native apps remain out of scope per decision record 0001.

## Stack

| Layer           | Technology                                                   |
| --------------- | ------------------------------------------------------------ |
| Language        | TypeScript                                                   |
| Package manager | pnpm (workspace monorepo)                                    |
| Web             | Next.js (App Router), React, Tailwind CSS                    |
| API             | NestJS                                                       |
| Database        | PostgreSQL via Prisma (driver adapter: `@prisma/adapter-pg`) |
| API tests       | Jest + Supertest                                             |
| Web e2e tests   | Playwright                                                   |

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- pnpm 10.28+ (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL 16, reachable at the connection string in your `.env` — either:
  - `docker compose up -d postgres` (uses `docker-compose.yml`), or
  - a local PostgreSQL install, with a role/database matching your `.env`

## Setup

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
pnpm install

# 2. Copy the env template and adjust if needed
cp .env.example .env

# 3. Start PostgreSQL (skip if you already have one running locally)
docker compose up -d postgres

# 4. Apply database migrations
pnpm run db:migrate

# 5. Seed reference data (subjects, curricula, a starting university directory)
pnpm run db:seed

# 6. Start both apps in dev mode
pnpm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1 (health: `/health`, readiness: `/health/ready`)

The homepage calls the API's health endpoint server-side and shows whether it's reachable — a quick way to confirm both apps are wired together correctly.

> **Note on the Prisma client:** `pnpm install` regenerates it automatically (`postinstall` → `db:generate`). If you ever see a "Cannot find module '.prisma/client'" error after an install, just re-run `pnpm run db:generate`.

## Auth

Implemented under `/api/v1/auth` and `/api/v1/users`:

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/verify-email`, `POST /auth/verify-email/resend`
- `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/google/complete`
- `PATCH /users/me` (phone only), `POST /users/me/roles`, `DELETE /users/me/roles/:role`

A user may self-register as `TUTOR` and/or `GUARDIAN` only — administrative roles are never self-assignable. Access tokens are short-lived JWTs kept in memory on the client; refresh tokens are opaque, rotated on every use, delivered as an HttpOnly cookie (`secure` only when `NODE_ENV=production`, so production must be served over HTTPS), and the whole session chain is revoked if an already-rotated token is ever replayed. See `apps/web/features/auth/` for the client-side session handling and `apps/api/src/modules/auth/` for the server implementation.

Registration never blocks on email verification — it sends a 24-hour link to `${FRONTEND_URL}/verify-email?token=...` via Brevo and silently logs (never throws) if the send fails, so a misconfigured `BREVO_*` value won't break registration, it'll just mean no email arrives. When testing this on a real deployment: set real `BREVO_API_KEY`/`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME` values with the sender domain's SPF/DKIM verified in Brevo, and point `FRONTEND_URL` at the deployed web app's real origin — the API fails fast at startup (`validateEnv`) if any required var is missing, but a *wrong* `FRONTEND_URL` will send valid-looking emails whose link points at the wrong host. `NEXT_PUBLIC_API_URL` (web) is read from the root `.env` and inlined into the client bundle by Next.js at **build time** (`next.config.ts`) — exporting it as a runtime-only env var on a host that builds once and runs many times will not update it; rebuild `apps/web` after changing it.

## Scripts (run from the repo root)

| Script                              | Description                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`                          | Run the web and API apps in watch mode, in parallel                         |
| `pnpm build`                        | Build both apps                                                             |
| `pnpm lint` / `pnpm lint:fix`       | Lint both apps                                                              |
| `pnpm format` / `pnpm format:check` | Prettier, repo-wide                                                         |
| `pnpm typecheck`                    | Type-check both apps                                                        |
| `pnpm test`                         | Unit tests for both apps                                                    |
| `pnpm test:e2e`                     | Playwright end-to-end tests for the web app                                 |
| `pnpm db:generate`                  | Regenerate the Prisma client                                                |
| `pnpm db:migrate`                   | Create/apply a dev migration (`prisma migrate dev`)                         |
| `pnpm db:migrate:deploy`            | Apply existing migrations without creating new ones (used in CI/production) |
| `pnpm db:seed`                      | Run `prisma/seed.ts`                                                        |

API-only commands (run from `apps/api`, or prefix with `pnpm --filter api`):

- `pnpm test:e2e` — API integration tests (`apps/api/test/*.e2e-spec.ts`) against a real database connection.

## Project structure

```text
apps/
  web/     Next.js App Router frontend
  api/     NestJS REST API
prisma/
  schema.prisma   Full data model (see docs/database_schema_and_prisma_models.md)
  migrations/     Generated SQL migrations (commit these)
  seed.ts         Reference-data seed script (subjects, curricula, universities)
docs/
  master_implementation_blueprint.md   Full phased implementation plan
  decisions/                            Finalized product/scope decisions
```

## Environment variables

See `.env.example` for the full list. The monorepo uses a single root-level `.env` — both `apps/api` and `apps/web` load it directly rather than keeping separate copies. Never commit `.env`.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: install → lint → typecheck → Prisma schema validation → migrations → unit tests → API integration tests → build → web end-to-end tests, against a real Postgres service container.

## Deployment (web on Vercel, API on Render, database on Neon)

This split is three independently-deployed pieces, each pointing at the others by URL:

- **Database — Neon (free).** Create a Neon project and use its connection string as `DATABASE_URL` (Neon's string already includes `?sslmode=require`, which the `pg`-based Prisma driver adapter honors natively — no code change needed). Neon auto-suspends after 5 minutes idle and auto-resumes in well under a second on the next query, with no hard expiry — unlike Render's own free Postgres, which is deleted 30 days after creation regardless of activity. Run `pnpm run db:migrate:deploy` and `pnpm run db:seed` against it once before first use.
- **API — Render (free web service).** Root directory `apps/api`, build command `pnpm install --frozen-lockfile && pnpm --filter api run build`, start command `pnpm --filter api run start`. Set every variable `apps/api/src/config/env.validation.ts` requires (it fails fast at boot if one is missing) — in particular `DATABASE_URL` (Neon), `FRONTEND_URL` and `CORS_ORIGIN` (the Vercel URL, once known), `NODE_ENV=production`, a real `JWT_ACCESS_SECRET`, real `BREVO_*` values with the sender domain's SPF/DKIM verified in Brevo, and real `GOOGLE_*` values with Render's URL added as an authorized redirect URI in Google Cloud Console. Leave `EVIDENCE_STORAGE_MODE=local-emulator` only for a throwaway test — it doesn't persist across restarts; switch to `EVIDENCE_STORAGE_MODE=s3` with a real S3-compatible bucket before relying on verification uploads.
- **Web — Vercel.** Root directory `apps/web`. Set `NEXT_PUBLIC_API_URL` to the Render API's public URL (e.g. `https://<service>.onrender.com/api/v1`) — Next.js inlines this into the client bundle at **build time** (`apps/web/next.config.ts`), so changing it later always needs a redeploy, not just an env var update.

**Render's free plan spins the API down after 15 minutes with no inbound HTTP request** (next request pays a 30-60s cold start). The fix has to be an external HTTP ping — a timer running inside the API itself does nothing, because Render freezes the whole process, scheduled jobs included, once it spins down. `.github/workflows/keep-alive.yml` pings the API's own `/health/ready` endpoint (which already runs a real database query) every 10 minutes via GitHub Actions; after the first deploy, add a repository secret named `RENDER_HEALTH_URL` pointing at `https://<service>.onrender.com/api/v1/health/ready` to turn it on. One service pinged continuously uses just under Render's 750 free instance-hours/month, so this fits the free tier as long as it's the only free web service in that Render workspace.
