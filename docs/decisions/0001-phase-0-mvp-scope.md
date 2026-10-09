# Decision Record 0001 — Phase 0 MVP Scope and Product Decisions

**Status:** Final
**Date:** 2026-10-09
**Phase:** Phase 0 (Master Implementation Blueprint, §6)
**Supersedes:** None

## 1. Purpose

This record finalizes the Phase 0 decisions required before implementation begins. It resolves every item in the blueprint's §6.1 decision table, classifies data by privacy category, documents the core entity states, and lists what is explicitly out of scope for the first release.

Items 10 and 11 below were confirmed directly; every other decision follows the blueprint's own recommended defaults.

---

## 2. MVP definition (restated)

The MVP is complete when: a guardian can publish a tuition listing → a tutor can discover and apply for it → the guardian can review the application → both parties can communicate under the platform's contact-sharing rules.

No payments, commissions, wallets, AI matching, reviews, or native apps in this release.

---

## 3. Finalized decisions

| # | Decision | Final answer | Rationale |
|---|----------|--------------|-----------|
| 1 | Supported languages | English at launch. Architecture (i18n-ready strings, UTF-8, font stack) supports Bangla from day one; Bangla translation is a post-MVP addition. | PRD §5 lists Bangla+English as a later-stage goal, not launch-blocking. Avoids translation overhead before the core journey is proven. |
| 2 | Target devices | Responsive web, mobile-first. No native apps. | Matches blueprint §22 (native apps deferred) and Bangladesh's mobile-majority usage pattern. |
| 3 | Account roles | `TUTOR` and `GUARDIAN`. A single user account may hold both roles concurrently. | Matches blueprint §6.1 and TRD role model. |
| 4 | Public browsing | Visitors may browse published listings and public (safe) tutor profiles without registering. | Matches blueprint §6.1 and Phase 5 scope. |
| 5 | Application access | Authentication required to apply, message, or manage listings. | Matches blueprint. |
| 6 | Listing creation | Requires `GUARDIAN` role + a completed minimum guardian profile (name, verified contact, at least one location). | Matches blueprint. "Minimum profile" fields to be finalized in Phase 7 DTO design. |
| 7 | Application uniqueness | One application per tutor per listing, enforced by a DB unique constraint on `(tutorId, listingId)`. | Matches blueprint §8.3 and §14 concurrency requirements. |
| 8 | Contact sharing | Explicit, logged consent from both parties before private contact info (phone/email) is exchanged. Server-enforced; never inferred from an application status change alone. | Matches blueprint Principle 4 and Phase 9 scope. |
| 9 | Student verification | **Optional** for MVP. Not required to browse, apply, publish, or message. Peer/university-affiliation verification per PRD §5.3, implemented in Phase 10, after the core journey works. | Matches blueprint §16 ("after the main marketplace works unless essential to launch policy") — nothing in PRD marks it launch-blocking. |
| 10 | Listing moderation | **Confirmed.** Every listing goes through mandatory pre-publish admin review. A guardian submits a listing (`DRAFT → PENDING_REVIEW`); it only reaches `PUBLISHED` after an admin approves it. An admin may `REJECT` it back to the guardian with a reason, or editing and resubmitting returns it to `PENDING_REVIEW`. Automated pre-checks (profanity/contact-info-in-text filter, required-field completeness) still run first to triage the queue, but they assist the admin decision — they never auto-publish or auto-reject on their own. | User instruction: "final call should be admin's." Automated checks are kept as a queue-triage aid only, consistent with Principle 2 (the backend/admin owns business rules, not an automated heuristic). |
| 11 | Geographic scope | **Confirmed.** All of Bangladesh's administrative divisions (Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh) are enabled at launch, using the Division → District → Area location hierarchy. Dhaka is the default/pre-selected division in search and profile/listing location pickers, but any user can manually switch to another division, district, or area. | User instruction: Dhaka as default, but users can manually select other divisions. No schema distinction between "launch" and "future" divisions is needed since all are enabled from day one. |
| 12 | Payment | Out of scope. No listing visibility, application limits, or feature gating tied to payment. | Matches blueprint §1.2 and §22. |
| 13 | Reviews and ratings | Deferred. No public ratings in MVP. | Matches blueprint §22; PRD §5.9 requires an abuse-resistant policy first, which doesn't exist yet. |
| 14 | Real-time messaging | Persisted messaging with short-interval polling (e.g., 10–15s) for new messages at launch. WebSockets added later only if polling proves insufficient. | Matches blueprint §9 ("begin with reliable persisted messaging and polling") and TRD §"Begin with REST-based message retrieval... Add WebSockets only when real-time messaging becomes a clear user requirement." |
| 15 | Account deletion | Soft-delete (`PENDING_DELETION` → anonymized) per TRD. Guardian/tutor profile PII is scrubbed; historical applications/conversations the other party relies on are retained in anonymized form rather than hard-deleted. | Matches TRD §"Soft deletion only where justified" and blueprint §8.4. Exact retention window is a Phase 2 schema task, not a Phase 0 blocker. |
| 16 | Guardian emergency contact | Private. Never included in any public or searchable projection. Visible only to the guardian themself and authorized admins handling a safety incident. | Matches blueprint §6.1 and Principle 4. |

---

## 4. Core entity states

> **Phase 2 update (2026-10-09):** the states below were written before the detailed schema existed and used placeholder names. `docs/database_schema_and_prisma_models.md` is the authoritative source for entity states (per blueprint §3's document hierarchy) and is now implemented verbatim in `prisma/schema.prisma`, with one deliberate rename: its `Role.PARENT` is renamed to `Role.GUARDIAN` for consistency with item 3 above and the blueprint's own terminology. The sections below are updated to match the implemented enums; nothing about the underlying product decision (who can act, when) changes.

### 4.1 Tuition Listing — `ListingStatus`
`DRAFT → PENDING_REVIEW → PUBLISHED → PAUSED ⇄ PUBLISHED → FILLED / CLOSED / EXPIRED`
Also: `REJECTED` (from `PENDING_REVIEW`, admin decision; guardian may edit and resubmit to `PENDING_REVIEW`).

- Submitting a draft (`DRAFT → PENDING_REVIEW`) is the only way to request publication — there is no direct `DRAFT → PUBLISHED` or guardian-triggered publish.
- Only an admin action moves a listing from `PENDING_REVIEW` to `PUBLISHED` or `REJECTED`.
- A `PUBLISHED` listing a guardian edits in a way that affects public content returns to `PENDING_REVIEW` before the change goes live (exact field list to be finalized in Phase 7).
- `EXPIRED` is reached automatically once `expiresAt` passes on a `PUBLISHED` listing (added in the Phase 2 schema; not in the original Phase 0 sketch, but a natural extension of "closed listings preserve historical applications").
- Only `PUBLISHED` listings appear in public search.
- `CLOSED`/`FILLED`/`EXPIRED` listings keep historical applications readable to their original parties.

### 4.2 Application — `ApplicationStatus`
The Phase 2 schema uses a more granular state machine than the Phase 0 sketch (`SUBMITTED`/`VIEWED` distinguish "not yet opened" from "guardian has seen it," and `CONTACT_REQUESTED` gives contact-sharing its own step before `ACCEPTED`):

`SUBMITTED → VIEWED → SHORTLISTED → CONTACT_REQUESTED → ACCEPTED`
`SUBMITTED | VIEWED | SHORTLISTED → DECLINED`
`SUBMITTED | VIEWED | SHORTLISTED | CONTACT_REQUESTED → WITHDRAWN` (tutor-initiated only)
`any non-terminal state → CLOSED` (e.g., the listing itself closes or fills via another applicant)

Transitions are owner/actor-restricted and implemented as a dedicated service method in Phase 8, never a raw status PATCH.

### 4.3 Verification request — `VerificationStatus`
`PENDING → IN_REVIEW → APPROVED | REJECTED | NEEDS_INFORMATION` (loops back to `PENDING` once more evidence is submitted), plus `CANCELLED` (requester-initiated withdrawal).

Public projection exposes only a boolean/enum outcome (e.g., "university affiliation verified"), never the evidence or reviewer identity.

### 4.4 Conversation / message — `ConversationStatus`
`ACTIVE ⇄ ARCHIVED`, plus `RESTRICTED` (moderation hold, e.g. after a report). Conversations are created only in the context of an existing application (no cold-messaging in MVP). Messages have no edit/delete in MVP; only a read-state flag per participant.

### 4.5 Report — `ReportStatus`
`OPEN → UNDER_REVIEW → ACTION_TAKEN | DISMISSED`

---

## 5. Data classification

| Category | Examples | Visible to |
|---|---|---|
| Public | Display name, headline, subjects/grades/curricula taught, general area (not exact address), expected rate range, verification badges (outcome only), listing content (class, subjects, schedule, budget, general area, description) | Anyone, including unauthenticated visitors |
| Authenticated-private | Full application history, message content, exact scheduling notes, draft listings | The owning user and counter-parties in an authorized relationship (e.g., an applicant and the listing owner) |
| Sensitive-private | Phone number, email, exact address, guardian emergency contact, verification evidence (ID images), moderation/report notes | The owning user (where applicable) and authorized admins/reviewers only; never in public or search responses |

Contact-sharing moves specific sensitive-private fields (phone/email only — never address or emergency contact) into the authenticated-private tier for the other party, upon explicit mutual consent recorded in a `ContactShare` audit record.

---

## 6. Out-of-scope for this release (restated from blueprint §22)

Online payments, platform commission, wallet/payouts, AI tutor matching, AI profile writing, ratings/reviews, recommendation engine, native mobile apps, multi-service/microservice architecture, WebSocket real-time infra, paid promotion, large analytics platform.

None of these are to be scaffolded "for later" (no empty payment tables, no stubbed AI endpoints) — they are simply absent until a documented need promotes them onto the roadmap.

---

## 7. User journeys to validate against (blueprint §6.2)

These eight journeys must each be walked through (informally, as part of Phase 5–9 implementation) with explicit loading/empty/failure/unauthorized/success states before their phase is marked done:

1. Visitor → search tuition → view listing → register/sign in → apply
2. Visitor → search tutors → view profile → next action
3. Guardian → register → complete profile → draft listing → review → publish
4. Guardian → receive application → review tutor → shortlist/decide → communicate
5. Tutor → register → build profile → find matching opportunities → apply → track status
6. User → request verification → submit evidence → receive decision
7. User → report a listing/account → receive confirmation
8. Admin → investigate report → take authorized action → audit result

No separate diagram file is created in Phase 0; each journey's states are implemented and verified when its owning phase is built (Phase 5 for 1–2, Phase 7 for 3, Phase 8 for 4–5, Phase 10 for 6, Phase 11 for 7–8).

---

## 8. Phase 0 acceptance checklist (blueprint §6.3)

- [x] MVP scope written (§2 above)
- [x] Public/private data classified (§5)
- [x] Listing, application, verification, conversation, report states documented (§4)
- [x] Contact-sharing policy agreed (§3 item 8, §5)
- [x] Out-of-scope features listed (§6)
- [x] Launch geography confirmed (§3 item 11) — all divisions enabled, Dhaka default
- [x] Moderation policy for publish confirmed (§3 item 10) — mandatory admin pre-publish review

All Phase 0 items are resolved. Phase 1 (repository + dev environment) can start.

---

## 10. Phase 3 scoping decisions (2026-10-09)

Two gaps surfaced between `docs/api_spec.md`'s illustrative DTOs and what Phase 0–2 had already settled. Both were confirmed directly rather than assumed:

| # | Decision | Final answer | Rationale |
|---|----------|--------------|-----------|
| 17 | Registration's `fullName` field | **Dropped.** `POST /auth/register` takes only `email`, `phone?`, `password`, `roles`. A user's display name is captured later, when they create a `TutorProfile` (`fullName`) or `GuardianProfile` (`displayName`) in Phase 6/7. | The Phase 2 `User` model deliberately has no name field — per its own doc, identity/auth and display-name data are different categories. `api_spec.md`'s example DTO included `fullName` inconsistently with the schema it's supposed to sit on top of; the schema wins per the blueprint's document hierarchy (§3). |
| 18 | Password reset / email-phone verification | **Deferred entirely.** `POST /auth/password/forgot`, `POST /auth/password/reset`, `POST /auth/verify-phone` from `api_spec.md` are not implemented in Phase 3. `User.emailVerifiedAt`/`phoneVerifiedAt` remain columns with no write path yet. | Blueprint §9.2 makes these conditional on launch requirements, and Phase 0's decision table never named them as required. They need a chosen email/SMS provider, which doesn't exist yet in this repo. Half-building a security-sensitive flow without that infrastructure is worse than not building it; revisit once a provider is chosen. |

Everything else Phase 3 needed beyond `api_spec.md` and the Phase 2 schema — a `RefreshToken` model for rotation/revocation, and the choice of argon2 + JWT access tokens + an HttpOnly rotated refresh cookie — follows directly from the blueprint's and TRD's own authentication requirements (§9, TRD §3.1) and is documented in the Phase 3 commit rather than repeated here.
