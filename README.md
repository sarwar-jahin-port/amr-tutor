# AMR Tutor

A free, direct home-tuition marketplace connecting parents/guardians and tutors across Bangladesh. No commissions, no payments, no wallet — guardians publish tuition listings, tutors apply, both communicate under the platform's privacy rules.

See [`docs/master_implementation_blueprint.md`](docs/master_implementation_blueprint.md) for the full phased implementation plan and [`docs/decisions/`](docs/decisions/) for finalized product decisions.

## Status

**Phase 1 — Repository and development foundation.** The database schema (Phase 2), authentication (Phase 3), and every product feature are not implemented yet.

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

# 4. Apply database migrations (none yet — Phase 2 introduces the schema)
pnpm run db:migrate

# 5. Seed reference data (no-op until Phase 2)
pnpm run db:seed

# 6. Start both apps in dev mode
pnpm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1 (health: `/health`, readiness: `/health/ready`)

The homepage calls the API's health endpoint server-side and shows whether it's reachable — a quick way to confirm both apps are wired together correctly.

> **Note on the Prisma client:** `pnpm install` regenerates it automatically (`postinstall` → `db:generate`). If you ever see a "Cannot find module '.prisma/client'" error after an install, just re-run `pnpm run db:generate`.

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
  schema.prisma   Data model (empty until Phase 2)
  seed.ts         Reference-data seed script
docs/
  master_implementation_blueprint.md   Full phased implementation plan
  decisions/                            Finalized product/scope decisions
```

## Environment variables

See `.env.example` for the full list. The monorepo uses a single root-level `.env` — both `apps/api` and `apps/web` load it directly rather than keeping separate copies. Never commit `.env`.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: install → lint → typecheck → Prisma schema validation → migrations → unit tests → API integration tests → build → web end-to-end tests, against a real Postgres service container.
