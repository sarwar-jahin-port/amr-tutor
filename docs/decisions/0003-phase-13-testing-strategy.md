# Decision Record 0003 — Phase 13 Testing Strategy

**Status:** Final
**Date:** 2026-10-10
**Phase:** Phase 13 (Master Implementation Blueprint, §19)
**Supersedes:** None. Extends [0002-phase-12-security-privacy-review.md](0002-phase-12-security-privacy-review.md), which already added the authorization-focused e2e coverage this record's §2 (integration tests) and §4 (unauthorized-access journey) build on.

## 1. Purpose

Blueprint §19 breaks testing into five layers (unit, integration, end-to-end/browser, UI & accessibility, performance) plus a release test gate. This record states what exists for each layer, what was added this phase, and — where something is genuinely out of reach without more infrastructure or a later phase — says so plainly rather than claiming coverage that isn't there.

## 2. §19.1 Unit tests

New isolated unit tests (mocked Prisma/collaborators, no database), one file per service, covering the exact bullet list the blueprint names:

| Business rule | Test file |
|---|---|
| Application state transitions, ownership checks, role checks | `applications.service.spec.ts` |
| Duplicate application handling | `applications.service.spec.ts` ("apply" → P2002 → 409) |
| Listing state transitions | `listing-owner.service.spec.ts` ("submit", "close") |
| Rate-range validation (salaryMin/salaryMax) | `listing-owner.service.spec.ts` |
| Contact-sharing authorization (mutual-consent reveal) | `contact-share.service.spec.ts` |
| Verification decisions (self-approval block, assignment claiming, decision→status mapping) | `verifications.service.spec.ts` |
| Notification creation | `notifications.service.spec.ts` |
| Search filter validation | `listing-search-query.dto.spec.ts` (runs `class-validator` directly against the DTO, the same pipeline `main.ts`'s global `ValidationPipe` runs) |

92/92 unit tests pass (`pnpm --filter api test`). These complement, not replace, the integration suite below — a unit test here proves the rule in isolation; the integration suite proves it still holds with a real database and real HTTP plumbing in front of it.

## 3. §19.2 Integration tests

Every item the blueprint lists was already covered before this phase, by the existing `apps/api/test/*.e2e-spec.ts` suite (real Postgres, real NestJS app, `supertest`). This phase didn't need to add anything here — it's recorded for completeness:

| Item | Test file |
|---|---|
| User registration and uniqueness | `auth.e2e-spec.ts`; `database.e2e-spec.ts` ("enforces no duplicate role assignment") |
| Profile relations | `database.e2e-spec.ts` ("enforces one tutor/guardian profile per user") |
| Listing creation and publication | `guardian-listings.e2e-spec.ts` (draft→pending→published visibility, admin-gated publish) |
| Application uniqueness | `database.e2e-spec.ts`; `applications.e2e-spec.ts` (concurrent-request race) |
| Listing closure and concurrent applications | `applications.e2e-spec.ts` ("allows only one of two concurrent applications... to succeed"); `guardian-listings.e2e-spec.ts` ("closes the listing, idempotently") |
| Conversation creation | `messaging.e2e-spec.ts` |
| Message authorization | `messaging.e2e-spec.ts`; `security-unauthenticated-access.e2e-spec.ts` (Phase 12) |
| Contact-sharing permissions | `messaging.e2e-spec.ts` |
| Verification state updates | `verifications.e2e-spec.ts` |
| Account suspension | `moderation.e2e-spec.ts` (suspend mid-session, refresh-token revocation, can't self-suspend, can't suspend the last admin) |
| Referential integrity | `database.e2e-spec.ts` ("restricts deleting a user who still owns a listing", "cascades... to tutor profile and role assignments", "nulls out the assigned verifier when deleted") |

224/224 e2e tests pass (`pnpm --filter api test:e2e`, see the local-runner note in decision record 0002 §6 about `--maxWorkers=1`).

## 4. §19.3 End-to-end (Playwright) tests

Added Playwright specs for all four named journeys, in `apps/web/tests/e2e/`:

- `journey-tutor.spec.ts` — Journey A (register → tutor profile → search → apply → status → conversation)
- `journey-guardian.spec.ts` — Journey B (register → guardian profile → create/publish a listing → review an application → status update → message the tutor)
- `journey-verification.spec.ts` — Journey C (request verification → submit evidence → reviewer decision → public profile shows only the permitted status)
- `journey-unauthorized-access.spec.ts` — Journey D (cross-user access attempt → denied, no data leak)

Two of these journeys need a privileged (`ADMIN`/`VERIFIER`) account to approve a listing or decide a verification — and by design (decision record 0001) there is no self-service way to become one through the product itself. Rather than skip that step or fake it, a small `apps/web/tests/e2e/db-test-utils.ts` helper grants the role directly in the test database (the same kind of direct-Prisma fixture setup `apps/api/test/*.e2e-spec.ts` already uses, e.g. suspending an account). That's the one deliberate shortcut; everything downstream of it — logging in as that account, approving the listing, deciding the verification — goes through the real browser UI, not further database writes.

[TODO — fill in once the implementing session's run completes: pass/fail status, and the text of §19.3's "Status" row below.]

**Status:** _pending verification run._

## 5. §19.4 UI and accessibility testing

Added `apps/web/tests/e2e/accessibility.spec.ts`:

- **Automated accessibility scans** (`@axe-core/playwright`) against the homepage, login, register, tuition search, tutor search, and how-it-works pages — fails on any `serious`/`critical` violation.
- **Keyboard-only navigation** — the login form is filled and submitted via `Tab`/`type`/`Enter` alone, no pointer events.
- **Focus indicators** — a focused field is checked for a visible outline or focus box-shadow (not `none`).
- **Form validation and error recovery** — submitting the register form empty, then successfully completing it in the same session, proving the form doesn't get stuck after a validation error.
- **Narrow mobile / tablet / desktop viewports** — checked for horizontal overflow at 375px/768px/1440px widths, and that primary actions (brand link, sign-in, create-account) stay reachable at mobile width.
- **Reduced-motion preference** — `prefers-reduced-motion: reduce` is emulated and the homepage is confirmed to still render correctly.
- **Long content / overflow** — the public search page is checked for overflow at mobile width (covers "long text and long names" and "empty search results," the latter already covered by the pre-existing `browsing.spec.ts`).

**Known gap found while writing these tests (not fixed in this phase, tracked separately):** `components/site-header.tsx`'s public nav links ("Find tuition", "Find tutors", "How it works") are `hidden md:flex` with **no mobile replacement** — below the `md` breakpoint they are genuinely unreachable from the header, not just restyled. The new mobile-viewport test documents this current behavior explicitly (asserting the links are *not* visible, with a comment explaining why) rather than silently passing a false claim of "mobile works." A follow-up task is queued (see the chip from this session, "Add mobile nav menu to SiteHeader") to add a hamburger/drawer menu and then flip that one test to assert the links *are* reachable.

**Explicitly out of scope / not automatable here:**
- **Actual screen-reader testing** (VoiceOver/NVDA/TalkBack). Axe catches many of the same issues (missing labels, ARIA misuse, contrast) but is not a substitute for a human pass with a real screen reader before launch.
- **Bangla rendering.** Per decision record 0001 item 1, Bangla is explicitly deferred post-MVP — there's no Bangla content to test yet.
- **Slow network / failed-request simulation.** Playwright can throttle network conditions (`page.route` with artificial delay, or `context.route().abort()`), but doing this meaningfully requires knowing which specific loading/error states the product intends for each surface, which hasn't been designed yet beyond the generic error states `browsing.spec.ts`'s 404 tests already cover. Flagging as a gap rather than writing a shallow test around it.

## 6. §19.5 Performance testing

**Not performed in this phase, and nothing here should be read as implying it was.** The blueprint's own instruction is direct: "Do not claim the system scales to a particular number of users until testing supports that claim." Meaningful performance testing (search response times under representative data volume, message-pagination behavior at scale, Core Web Vitals under real asset weights, resource consumption under expected launch traffic) requires:

1. A representative data volume seeded into a non-trivial dataset (the current `prisma/seed.ts` only seeds reference data — subjects/curricula/universities — not thousands of listings/users/messages).
2. A load-testing tool (e.g. k6, autocannon) and a deployed/staging environment to point it at, which doesn't exist yet (that's Phase 14).
3. A defined "expected launch traffic" figure to test against, which is a product/business input, not something this session can decide.

This is tracked as deferred to closer to Phase 14/15 (deployment and beta launch), not silently skipped. No performance claim is made anywhere in this codebase's documentation as a result of this phase.

## 7. Release test gate (§19.3 closing checklist)

| Criterion | Status |
|---|---|
| All critical journey tests pass | _Pending — see §4._ |
| No unresolved high-severity security defects | ✅ Per decision record 0002 — one accepted, documented, unreachable-at-runtime dependency risk; nothing else open. |
| No known data-leak issue | ✅ Per decision record 0002 §3/§4 and this record's Journey D coverage. |
| No broken core journey on supported mobile and desktop browsers | ⚠️ Core journeys pass (pending §4); one documented mobile-navigation gap (§5) is tracked, not blocking (it affects discoverability of secondary browse links, not any of the four critical journeys, which were written to not depend on the header nav). |
| Database migrations and rollback/recovery procedures have been reviewed | ❌ Not yet — this is Phase 14 (Deployment and operations) scope. |
| Production environment configuration has been checked | ❌ Not yet — Phase 14 scope. |

The last two items are intentionally left unchecked here rather than marked done — they belong to Phase 14, which hasn't been worked yet.
