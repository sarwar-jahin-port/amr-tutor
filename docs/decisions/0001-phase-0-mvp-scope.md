# Decision Record 0001 — Phase 0 MVP Scope and Product Decisions

**Status:** Draft — pending confirmation
**Date:** 2026-10-09
**Phase:** Phase 0 (Master Implementation Blueprint, §6)
**Supersedes:** None

## 1. Purpose

This record finalizes the Phase 0 decisions required before implementation begins. It resolves every item in the blueprint's §6.1 decision table, classifies data by privacy category, documents the core entity states, and lists what is explicitly out of scope for the first release.

Each decision below is a recommendation based on the blueprint, PRD, and TRD. Items marked **[CONFIRM]** are the ones most likely to need your input before Phase 1 starts — everything else follows the blueprint's own recommended defaults and can be revisited later without much rework.

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
| 10 | Listing moderation | **[CONFIRM]** Recommended: pre-publish automated checks (profanity/contact-info-in-text filter, required-field completeness) + post-publish reactive moderation via user reports. No manual pre-approval queue for every listing at launch — manual review only for reported listings. | Balances trust/safety against launch velocity. PRD lists `Pending Review` as a listing status, which this decision keeps available for manual escalation, but doesn't make it the default path. |
| 11 | Geographic scope | **[CONFIRM]** Recommended: launch in Dhaka only (by area/thana), with the location data model (Division → District → Area) built to extend nationally without a schema change. | No specific launch city is named in PRD/TRD; Dhaka is the largest and most liquid market for this use case. Confirm if a different city is intended. |
| 12 | Payment | Out of scope. No listing visibility, application limits, or feature gating tied to payment. | Matches blueprint §1.2 and §22. |
| 13 | Reviews and ratings | Deferred. No public ratings in MVP. | Matches blueprint §22; PRD §5.9 requires an abuse-resistant policy first, which doesn't exist yet. |
| 14 | Real-time messaging | Persisted messaging with short-interval polling (e.g., 10–15s) for new messages at launch. WebSockets added later only if polling proves insufficient. | Matches blueprint §9 ("begin with reliable persisted messaging and polling") and TRD §"Begin with REST-based message retrieval... Add WebSockets only when real-time messaging becomes a clear user requirement." |
| 15 | Account deletion | Soft-delete (`PENDING_DELETION` → anonymized) per TRD. Guardian/tutor profile PII is scrubbed; historical applications/conversations the other party relies on are retained in anonymized form rather than hard-deleted. | Matches TRD §"Soft deletion only where justified" and blueprint §8.4. Exact retention window is a Phase 2 schema task, not a Phase 0 blocker. |
| 16 | Guardian emergency contact | Private. Never included in any public or searchable projection. Visible only to the guardian themself and authorized admins handling a safety incident. | Matches blueprint §6.1 and Principle 4. |

---

## 4. Core entity states

### 4.1 Tuition Listing
`DRAFT → PENDING_REVIEW (optional, reported/flagged only) → PUBLISHED → PAUSED ⇄ PUBLISHED → FILLED / CLOSED`
Also: `REJECTED` (from `PENDING_REVIEW`, moderation only).

- Only `PUBLISHED` listings appear in public search.
- `CLOSED`/`FILLED` listings keep historical applications readable to their original parties.

### 4.2 Application
`PENDING → SHORTLISTED → ACCEPTED`
`PENDING → REJECTED`
`PENDING or SHORTLISTED → WITHDRAWN` (tutor-initiated only)

Transitions are owner/actor-restricted (see §5) and implemented as a dedicated service method, never a raw status PATCH.

### 4.3 Verification request
`REQUESTED → EVIDENCE_SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | MORE_INFO_REQUESTED (loops back to EVIDENCE_SUBMITTED)`

Public projection exposes only a boolean/enum outcome (e.g., `UNIVERSITY_AFFILIATION_VERIFIED`), never the evidence or reviewer identity.

### 4.4 Conversation / message
Conversations are created only in the context of an existing application (no cold-messaging in MVP). Messages have no edit/delete in MVP; only a read-state flag per participant.

### 4.5 Report
`SUBMITTED → UNDER_INVESTIGATION → RESOLVED | DISMISSED`

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
- [ ] **[CONFIRM]** Launch geography (§3 item 11) — defaulted to Dhaka
- [ ] **[CONFIRM]** Moderation policy for publish (§3 item 10) — defaulted to reactive/report-based

---

## 9. Open items requiring your confirmation

1. **Launch city/area** — proceed with Dhaka-only, or a different city/region?
2. **Pre-publish moderation** — reactive (report-based) as drafted, or require manual approval before every listing goes live?

Everything else in this record is safe to proceed on as written; it mirrors the blueprint's own recommended defaults. Once you confirm (or amend) items 1–2, this record is final and Phase 1 (repository + dev environment) can start.
