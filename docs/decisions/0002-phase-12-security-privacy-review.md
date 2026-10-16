# Decision Record 0002 — Phase 12 Security and Privacy Review

**Status:** Final
**Date:** 2026-10-10
**Phase:** Phase 12 (Master Implementation Blueprint, §18)
**Supersedes:** None. Extends the data classification and retention decisions in [0001-phase-0-mvp-scope.md](0001-phase-0-mvp-scope.md).

## 1. Purpose

Blueprint §18's acceptance criterion is "a documented security checklist has been completed, authorization tests pass, evidence remains private, and unresolved high-severity security issues block release." This record is that checklist: for each §18.1–18.4 item it states the current status, points at the code or test that satisfies it, and names what was added in this phase versus what was already true of the Phase 1–11 implementation.

Nothing here is retroactive theater — most of this phase's items were already satisfied by design decisions made in earlier phases (documented inline in the source as blueprint references). This record consolidates them into one reviewable checklist and closes the handful of real gaps found.

---

## 2. §18.1 Authentication security

| Test | Status | Evidence |
|---|---|---|
| Invalid login | ✅ Pre-existing | `auth.e2e-spec.ts` — "resists account enumeration: wrong password and unknown email give the same error" |
| Expired access token | ✅ Added this phase | `auth.e2e-spec.ts` — "rejects an access token that has already expired" (signs a token with `expiresIn: -10` via the app's own `JwtService`) |
| Expired refresh token | ✅ Added this phase | `auth.e2e-spec.ts` — "rejects a refresh call once the stored session has expired" (backdates the stored `RefreshToken.expiresAt`; exercises the existing check in `auth.service.ts`'s `refresh()`) |
| Reused rotated refresh token | ✅ Pre-existing | `auth.e2e-spec.ts` — "rotates the refresh token and detects reuse of the old one" (reuse revokes the whole session chain) |
| Logout followed by refresh attempt | ✅ Pre-existing | `auth.e2e-spec.ts` — "logout revokes the refresh session" |
| Suspended account attempting a protected action | ✅ Pre-existing | `moderation.e2e-spec.ts` — a session suspended *after* a valid access token was issued is still rejected on the very next request, because `JwtAccessStrategy.validate()` re-reads the user's current status from the database on every request instead of trusting the token payload (`jwt-access.strategy.ts:27-38`) |
| Rate-limit behavior | ✅ Pre-existing | `auth-rate-limit.e2e-spec.ts`; `ThrottlerGuard` applied to `/auth/register`, `/auth/login`, and the messaging/contact-share write paths |
| Password-reset token expiration | N/A | Password reset is not implemented in the MVP (no forgot-password flow exists anywhere in `apps/api` or `apps/web`). Out of scope per blueprint §22; revisit if/when that flow is added. |

## 3. §18.2 Authorization security

The global `JwtAuthGuard` fails closed: every route requires authentication unless explicitly decorated `@Public()` (`jwt-auth.guard.ts:6-10`). Per-resource ownership/role checks are enforced in each module's service layer, not the controller.

| Scenario | Status | Evidence |
|---|---|---|
| Correct owner access | ✅ Pre-existing | Covered throughout `applications.e2e-spec.ts`, `guardian-listings.e2e-spec.ts`, `messaging.e2e-spec.ts`, `verifications.e2e-spec.ts` |
| Wrong owner access | ✅ Pre-existing | e.g. `applications.e2e-spec.ts` ("a stranger cannot view an application they're not party to" → 404), `guardian-listings.e2e-spec.ts` (non-owner → 404) |
| **Unauthenticated access** | ✅ **Added this phase** | New file `security-unauthenticated-access.e2e-spec.ts` — a single inventory asserting all ~53 non-public routes reject requests with no `Authorization` header (401), and all ~13 intentionally-public routes do not. This was the one systemic gap found: individual resource specs tested wrong-owner/wrong-role thoroughly but none asserted the no-token case per route, relying implicitly on the global guard. The new spec makes that guarantee explicit and regression-proof — a route that's accidentally marked `@Public()` in the future fails this test immediately. |
| User with an unrelated role | ✅ Pre-existing | e.g. `guardian-listings.e2e-spec.ts` ("a TUTOR-only account is blocked from guardian owner routes" → 403) |
| Suspended account access | ✅ Pre-existing | `moderation.e2e-spec.ts` |
| Direct URL / modified resource IDs | ✅ Pre-existing | All the "wrong owner" tests above use a *real* other user's resource ID (IDOR-style), which is a stronger check than a merely nonexistent ID |
| Cross-user message access | ✅ Pre-existing | `messaging.e2e-spec.ts` — a non-participant gets 404 for conversation creation, message read, and message send |
| Unauthorized contact retrieval | ✅ Pre-existing | `messaging.e2e-spec.ts` — contact-share endpoints reject non-participants; the contact fields themselves are only populated in the response once both `ContactShare` consent rows exist (`contact-share.service.ts`), never inferred from application status |
| Unauthorized verification evidence retrieval | ✅ Pre-existing | `verifications.e2e-spec.ts` — "evidence download authorization" explicitly tests that only the owning tutor and an assigned/`ADMIN` reviewer can mint a download URL; a stranger gets 404 |

## 4. §18.3 Input and application security

| Item | Status | Evidence |
|---|---|---|
| Validate all incoming DTOs | ✅ Pre-existing | Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` (`main.ts`) |
| Prevent mass assignment of privileged fields | ✅ Pre-existing | `whitelist`/`forbidNonWhitelisted` above strips/rejects unknown fields; role self-service is restricted to `SELF_REGISTERABLE_ROLES` (`add-role.dto.ts`) and account-status changes live only on an `ADMIN`-only admin controller, never on the user's own update DTO |
| Bound query parameters and pagination | ✅ Pre-existing | `PaginationQueryDto` caps `limit` at `@Max(100)`; the messaging cursor query (`message-query.dto.ts`) caps at the same bound |
| Escape untrusted content at the rendering boundary | ✅ Pre-existing | Next.js/React escapes all interpolated text by default; no `dangerouslySetInnerHTML`/raw HTML injection of user content exists in `apps/web` |
| Prevent unsafe file uploads | ✅ Pre-existing | Verification evidence upload allowlists content-type and caps size by DTO (`request-evidence-upload.dto.ts`), and the server independently re-verifies the file's magic bytes and actual stored size after upload rather than trusting the client-declared values (`verifications.service.ts`) |
| Configure security headers | ✅ **Added this phase** | `helmet()` added to `main.ts`, ahead of the cookie parser. `contentSecurityPolicy` is disabled deliberately — this is a JSON-only API with no HTML rendering of its own, so a page-oriented CSP here adds no protection and could conflict with the separately-hosted frontend's own policy. `crossOriginResourcePolicy` is set to `same-site`. |
| Restrict CORS to approved origins | ✅ Pre-existing | `app.enableCors({ origin: corsOrigin.split(','), credentials: true })` driven by the `CORS_ORIGIN` env var, not a wildcard |
| Protect cookie-authenticated mutations against CSRF | ✅ Pre-existing, documented this phase | The access token (used for every state-changing endpoint) travels only as an `Authorization: Bearer` header, which a cross-site form/fetch cannot attach automatically — this removes the classic CSRF vector for almost the entire API surface. Only `/auth/refresh` and `/auth/logout` authenticate via cookie, and that cookie is `HttpOnly`, `SameSite=Lax`, scoped to the `/api/v1/auth` path (`auth.controller.ts`'s `cookieOptions()`). `SameSite=Lax` already blocks the cookie being sent on a cross-site POST, so a dedicated CSRF token was judged unnecessary added complexity for what it would protect (refresh/logout have no destructive side effect beyond ending a session). |
| Avoid leaking stack traces and secrets | ✅ Pre-existing | `AllExceptionsFilter` returns a generic `"Internal server error"` body for any non-`HttpException`, logging the real stack server-side only (`all-exceptions.filter.ts`) |
| Review dependency vulnerabilities | ✅ Reviewed this phase | `pnpm audit --prod` → 2 high, 1 moderate, all three transitive dependencies of the `prisma` **CLI** package (`deepmerge-ts`, `mysql2` ×2) pulled in regardless of which database driver is actually configured. This project's datasource is `postgresql` (`schema.prisma`) — the `mysql2` advisories (credential downgrade, decompression-bomb DoS) describe a MySQL wire-protocol driver this app never invokes at runtime. `prisma`/`@prisma/client` are already pinned to `7.10.0`, the latest stable release; no newer version fixes these yet. **Accepted risk**, revisit on the next `prisma` release. |
| Avoid logging passwords, tokens, full student ID numbers, or raw private evidence | ✅ Pre-existing | Repo-wide `grep` finds no `console.log`; the only three `Logger` calls (`prisma.service.ts`, `storage.service.ts`, `all-exceptions.filter.ts`) log a connection message, the storage emulator's port/bucket name, and exception stack traces respectively — never a request body, header, or DB row |

## 5. §18.4 Privacy requirements

Most of this section was already decided in [0001-phase-0-mvp-scope.md §5](0001-phase-0-mvp-scope.md) ("Data classification") and §3 items 8, 9, 15, 16. This section closes the remaining open items and cross-references the rest rather than re-deciding them.

| Item | Status | Evidence / decision |
|---|---|---|
| Document each category of collected personal information | ✅ Already documented | [0001 §5](0001-phase-0-mvp-scope.md) — Public / Authenticated-private / Sensitive-private tiers with examples |
| Collect only information needed for a clear purpose | ✅ By design | Guardian/tutor profile DTOs only accept the fields enumerated in `docs/database_schema_and_prisma_models.md`; no freeform "additional info" field exists that could accumulate unneeded PII |
| Define consent requirements | ✅ Already documented | [0001 §3 item 8](0001-phase-0-mvp-scope.md) — contact sharing requires explicit, independently-recorded consent from both parties, enforced server-side (`ContactShare` rows), never inferred from an application status change |
| **Define retention periods** | ✅ **Decided this phase** | TRD §7.2 left this open ("Define the minimum necessary retention period... before launch"). Decision: verification evidence (ID images) is retained for **90 days after the verification request reaches a terminal state** (`APPROVED`, `REJECTED`, or `CANCELLED`), then the underlying object is deleted from storage while the request's outcome metadata is kept indefinitely (the outcome, not the evidence, is what the product needs long-term). Soft-deleted/anonymized accounts (per [0001 item 15](0001-phase-0-mvp-scope.md)) follow the same 90-day window for any evidence still attached to them. **Enforcement is not yet automated** — there is no scheduled job in this codebase today (no `@nestjs/schedule` or equivalent). Implementing the actual purge job is tracked as a follow-up task, not a blocker for this phase's documentation requirement, since no evidence has yet reached 90 days old in a system this young. |
| Define account deletion and anonymization behavior | ✅ Already documented | [0001 item 15](0001-phase-0-mvp-scope.md) — soft-delete to `PENDING_DELETION` → PII scrubbed, historical applications/conversations retained anonymized |
| Protect guardian emergency contacts | ⚠️ Policy documented, field not yet built | [0001 item 16](0001-phase-0-mvp-scope.md) decided the privacy rule (visible only to the guardian and safety-incident admins), but `GuardianProfile` in `schema.prisma` has no emergency-contact field at all yet (`id`, `userId`, `displayName`, `language` only) — the capture feature itself hasn't shipped. Nothing currently exposes it, which trivially satisfies "don't leak it," but this is an open implementation item, not a verified-enforced one. Flagging here so whoever builds the field applies [0001 item 16](0001-phase-0-mvp-scope.md)'s visibility rule from the start rather than as a retrofit. |
| Avoid exposing exact home addresses | ✅ Enforced by schema | `TuitionListing` (`schema.prisma`) only has `city` / `area` / `neighborhood` / `locationDescription` — there is no street-address field anywhere in the model, so no DTO or endpoint can leak one. Matches [0001 §5](0001-phase-0-mvp-scope.md)'s "general area, not exact address." |
| Make contact-sharing behavior understandable | ✅ Pre-existing | Frontend `contact-share-panel.tsx` shows each party's own consent state and what sharing will reveal before they act, rather than a silent/implicit reveal |
| **Document which administrators may access sensitive records and why** | ✅ **Documented this phase** | Three distinct elevated roles exist (`VERIFIER`, `MODERATOR`, `ADMIN`), each scoped narrowly: <br>• **`VERIFIER`** (or `ADMIN`) may view a tutor's verification evidence and decide the request — needed to confirm the claimed university affiliation (`verifications.service.ts`'s `REVIEWER_ROLES`, `admin-verifications.controller.ts`). <br>• **`MODERATOR`** (or `ADMIN`) may view the reports queue and act on a filed report — needed to action user-filed safety/policy reports (`admin-reports.controller.ts`). <br>• **`ADMIN`** alone may read the audit log, review/approve/reject pending listings, and change another user's account status (suspend/reactivate) — the most sensitive admin surfaces, deliberately withheld from `MODERATOR` and `VERIFIER` (`audit-log.controller.ts`: "ADMIN only, never MODERATOR"; `admin-listings.controller.ts`; `admin-users.controller.ts`). <br>Every admin action that changes state is written to the append-only `AuditLog` via `AuditLogService.record()`, itself only readable by `ADMIN`. |

## 6. Outcome

- Code changes: `helmet` added to the API's HTTP pipeline (`main.ts`).
- Test changes: two new auth-expiry tests in `auth.e2e-spec.ts`, and a new `security-unauthenticated-access.e2e-spec.ts` covering every controller route.
- Full suite: 224/224 e2e tests passing (`pnpm --filter api test:e2e`, run with `--maxWorkers=1` locally — see note below), `tsc --noEmit` clean, `eslint` clean.
- One accepted, documented dependency risk (§4, transitive `prisma` CLI advisories, not reachable at runtime).
- One tracked follow-up: automated evidence-purge job for the 90-day retention window decided in §5.

**Local test-runner note:** running the full `apps/api` e2e suite with Jest's default parallel workers against the single local Postgres container exhausts its connection pool and causes unrelated suites to fail with connection/teardown errors; the same run is reliable with `--maxWorkers=1`. This is a local-environment resource limit, not a defect introduced or found in this phase — CI runs the identical command successfully, and no application code change affects it.

No unresolved high-severity issue was found that blocks release.
