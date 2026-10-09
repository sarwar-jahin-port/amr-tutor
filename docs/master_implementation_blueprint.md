# Master Implementation Blueprint

## Free Home-Tuition Marketplace — Bangladesh

**Document version:** 1.0
**Date:** 9 October 2026
**Status:** Master implementation plan
**Product type:** Responsive web marketplace
**Initial market:** Bangladesh
**Primary users:** Tutors and parents/guardians
**Implementation approach:** Phased, testable, incremental delivery

---

# 1. Purpose of this document

This document defines how to build the complete first version of the home-tuition marketplace, from an empty repository to a deployed, tested, usable product.

It is intended to be the shared source of truth for developers, designers, QA engineers, and future contributors.

It must answer five questions for every phase:

1. What are we building?
2. Why are we building it?
3. What must already exist before we start?
4. How do we know the work is complete?
5. What must not be implemented yet?

This is an implementation plan, not simply a list of features. Work should proceed in dependency order, and each phase must produce a working, verifiable result.

## 1.1 Product objective

Build a platform that connects Bangladeshi parents looking for home tutors with tutors looking for tuition opportunities.

The platform should make it possible to:

* Discover suitable tutors.
* Publish tuition requirements.
* Find tuition opportunities based on academic and location preferences.
* Apply for opportunities.
* Review and manage applications.
* Communicate through the platform.
* Share contact details under an explicit privacy policy.
* Optionally verify student status.
* Report suspicious users or listings.
* Administer the marketplace safely.

## 1.2 Business model for the first release

The initial product will:

* Be free to use for parents and tutors.
* Not process tuition payments.
* Not collect a commission from tuition fees.
* Not operate a wallet or payout system.
* Not require tutors to purchase applications.
* Not make payment a condition of receiving visibility.

Advertising or other monetization may be considered later, but it must not compromise user trust or the neutrality of tutor discovery.

## 1.3 Definition of MVP

The minimum viable product is complete when a parent can publish a tuition listing, a tutor can discover and apply for it, the parent can review the application, and both parties can communicate under the platform's privacy rules.

Everything else should be prioritized according to whether it is necessary for this core journey, essential for safety, or valuable after launch.

---

# 2. Product and engineering principles

These principles apply to every implementation phase.

### Principle 1: Complete the journey before expanding the feature set

A complete parent-to-tutor workflow is more valuable than many disconnected screens.

### Principle 2: The backend owns business rules

The frontend may guide users, but it must not be trusted to enforce ownership, permissions, verification status, application transitions, or privacy.

### Principle 3: Every important state must be explicit

Listings, applications, verification requests, and conversations must have defined states and valid transitions.

### Principle 4: Privacy is part of the architecture

Public profile data, private contact information, guardian emergency contacts, and verification evidence must be treated as different categories of information.

### Principle 5: No silent failures

If an action fails, the user should understand what happened and how to recover. A loading spinner must not remain indefinitely.

### Principle 6: Design for real Bangladeshi users

Use BDT, relevant local locations, natural language, mobile-first layouts, and reliable Bangla typography. Test with realistic data rather than generic English placeholders alone.

### Principle 7: Do not build future complexity prematurely

Do not introduce payments, recommendation AI, microservices, complex event streaming, or a large analytics infrastructure into the first release without a demonstrated need.

---

# 3. Product requirements and technical source of truth

The project has several supporting documents. They must be maintained as one coherent specification set.

| Document                              | Responsibility                                          |
| ------------------------------------- | ------------------------------------------------------- |
| Product Requirements Document (PRD)   | What the product does and why                           |
| Technical Requirements Document (TRD) | Architecture and technology choices                     |
| Database Schema and Prisma Models     | Data entities, relationships, constraints               |
| API Specification                     | Endpoints, request/response DTOs, validation            |
| UI/UX Design Specification            | Design system, journeys, screens, accessibility         |
| Master Implementation Blueprint       | Implementation order, dependencies, acceptance criteria |

When a requirement changes, update the relevant document before or alongside the implementation.

**Conflict-resolution rule:** Security and privacy requirements cannot be overridden merely because a screen or endpoint is easier to implement another way. Resolve conflicting requirements explicitly instead of silently choosing one.

---

# 4. Recommended technology stack

The following is the baseline stack for this implementation. If the repository already has a working stack, confirm it before replacing anything.

| Layer                     | Recommended technology                                            |
| ------------------------- | ----------------------------------------------------------------- |
| Language                  | TypeScript                                                        |
| Package manager           | pnpm                                                              |
| Web frontend              | Next.js App Router                                                |
| UI                        | React, Tailwind CSS, reusable accessible components               |
| Form validation           | React Hook Form + Zod                                             |
| Server request validation | NestJS DTOs + class-validator                                     |
| API                       | NestJS REST API                                                   |
| Database                  | PostgreSQL                                                        |
| ORM                       | Prisma                                                            |
| API documentation         | OpenAPI / Swagger                                                 |
| Frontend server state     | TanStack Query                                                    |
| Lightweight client state  | React state or a small store when genuinely necessary             |
| Authentication            | Short-lived access tokens and secure refresh-token handling       |
| File storage              | Private object storage for verification evidence, if enabled      |
| Unit tests                | Vitest or Jest, according to the selected framework configuration |
| API/integration tests     | NestJS testing tools + a dedicated test database                  |
| End-to-end tests          | Playwright                                                        |
| CI                        | Automated linting, type checking, tests, and build                |
| Deployment                | A managed frontend host, backend runtime, and managed PostgreSQL  |

### Technology rules

* Use one consistent version of each framework across the project.
* Pin and maintain dependencies through the lockfile.
* Confirm the selected versions are compatible before installation.
* Keep secrets in environment variables or a secrets manager.
* Do not commit `.env` files containing credentials.
* Avoid adding dependencies for features that can be implemented safely with the existing stack.
* Use the same validation expectations on the frontend and backend, while treating backend validation as authoritative.

### Authentication clarification

For the web client, use a secure session strategy that keeps long-lived refresh credentials out of browser-accessible storage. Prefer an HttpOnly, Secure cookie with an appropriate SameSite policy. Access-token handling should be designed consistently with the selected authentication architecture.

If a browser cookie authenticates requests, protect state-changing endpoints against CSRF where applicable. Define CORS, cookie domains, token expiration, refresh rotation, revocation, and logout behavior before implementation.

---

# 5. Repository architecture

Use a modular monorepo if the project is being started from scratch.

```text
home-tuition-marketplace/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── tests/
│   │
│   └── api/
│       ├── src/
│       │   ├── common/
│       │   ├── config/
│       │   ├── database/
│       │   ├── modules/
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── test/
│
├── packages/
│   ├── contracts/
│   ├── config/
│   └── ui-tokens/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   ├── UI_UX_SPECIFICATION.md
│   ├── IMPLEMENTATION_BLUEPRINT.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   └── decisions/
│
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

This is a proposed structure, not a requirement to create every directory immediately.

## 5.1 Backend module structure

Organize the NestJS API by business domain.

```text
apps/api/src/modules/
├── auth/
├── users/
├── roles/
├── tutors/
├── guardians/
├── references/
├── listings/
├── applications/
├── conversations/
├── messages/
├── contact-sharing/
├── verifications/
├── notifications/
├── reports/
├── admin/
└── health/
```

A module should own its controller, service, DTOs, and tests. Shared code belongs in common infrastructure only when it is genuinely reusable.

Do not place all business logic in controllers or create one enormous service containing every domain.

## 5.2 Frontend feature structure

```text
apps/web/features/
├── auth/
├── tutor-profile/
├── guardian-profile/
├── tutor-search/
├── tuition-search/
├── listings/
├── applications/
├── conversations/
├── verification/
├── notifications/
├── reporting/
└── admin/
```

Each feature may contain its own components, schemas, API functions, hooks, types, and tests.

Shared visual components belong in the shared component layer. Domain-specific behavior should remain within its feature.

---

# 6. Phase 0 — Confirm scope and resolve product decisions

**Goal:** Remove ambiguities that would otherwise create expensive rework.

**Deliverable:** An approved MVP scope and a recorded set of product decisions.

Before writing substantial application code, resolve the following questions.

## 6.1 Decisions that must be finalized

| Decision                   | Recommended starting point                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Supported languages        | English initially, with architecture ready for Bangla                                      |
| Target devices             | Responsive web, mobile-first                                                               |
| Account roles              | Tutor and guardian; a user may hold both                                                   |
| Public browsing            | Allow users to browse published listings and safe tutor profiles without registration      |
| Application access         | Authentication required                                                                    |
| Listing creation           | Guardian role and completed minimum profile required                                       |
| Application uniqueness     | One application per tutor per listing                                                      |
| Contact sharing            | Explicit consent and server-enforced permissions                                           |
| Student verification       | Optional, not required for basic marketplace use                                           |
| Listing moderation         | Define initial moderation policy before publishing is enabled                              |
| Geographic scope           | Begin with the intended launch area; make location data extensible                         |
| Payment                    | Out of scope for MVP                                                                       |
| Reviews and ratings        | Defer until a fair, abuse-resistant review policy is defined                               |
| Real-time messaging        | Begin with reliable persisted messaging and polling; add real-time delivery when justified |
| Account deletion           | Define retention and deletion behavior before production                                   |
| Guardian emergency contact | Private and unnecessary for public discovery                                               |

These are recommendations, not facts about an existing implementation. Record the final decisions in `docs/decisions/`.

## 6.2 User journey diagrams

Create and review the following journeys before building the related pages:

1. Visitor → search tuition → view listing → register/sign in → apply.
2. Visitor → search tutors → view profile → take an appropriate next action.
3. Guardian → register → complete profile → create draft → review → publish.
4. Guardian → receive application → review tutor → shortlist or decide → communicate.
5. Tutor → register → build profile → find matching opportunities → apply → track status.
6. User → request verification → submit evidence → receive decision.
7. User → report a listing or account → receive confirmation.
8. Admin → investigate a report → take an authorized action → audit the result.

For each journey, identify loading, empty, failure, unauthorized, and success states.

## 6.3 Phase acceptance criteria

* MVP scope is written and approved.
* Core journeys have no unresolved blocking questions.
* Public and private data are classified.
* Application, listing, verification, and conversation states are documented.
* The contact-sharing policy is agreed.
* Out-of-scope features are explicitly listed.

**Do not proceed to full implementation while fundamental ownership, privacy, or state-transition rules remain ambiguous.**

---

# 7. Phase 1 — Repository and development foundation

**Goal:** Establish a reproducible local development environment.

### Tasks

1. Initialize the repository and pnpm workspace.
2. Create the web and API applications.
3. Configure TypeScript and shared linting rules.
4. Configure formatting and import conventions.
5. Configure environment-variable validation.
6. Add PostgreSQL for local development.
7. Configure Prisma and database connectivity.
8. Add health-check endpoints.
9. Configure API error handling.
10. Add CI for linting, type checking, tests, and builds.
11. Write the README with setup instructions.
12. Add `.env.example` without real credentials.

### Required scripts

Use consistent root-level commands for:

* `dev`
* `build`
* `lint`
* `typecheck`
* `test`
* `test:e2e`
* `db:generate`
* `db:migrate`
* `db:seed`

The exact scripts should reflect the final workspace configuration. A command must not be added unless it actually works.

### Health endpoints

Implement at least:

* `GET /api/v1/health` — application process health.
* `GET /api/v1/health/ready` — readiness, including required dependencies such as the database.

Do not expose database credentials, internal hostnames, or detailed infrastructure errors through public health responses.

### Acceptance criteria

* A new developer can follow the README and start the application.
* The web app can call the API.
* The API can connect to PostgreSQL.
* Database migrations work from a clean database.
* CI passes on a clean checkout.
* Secrets are not committed.
* Health checks correctly distinguish process health from readiness.

---

# 8. Phase 2 — Database and reference data

**Goal:** Implement the schema that supports the core product without building every business feature at once.

Use the separate Database Schema and Prisma Models document as the primary schema specification.

## 8.1 Implementation order

1. Configure the Prisma datasource and generated client.
2. Implement enums.
3. Implement `User` and `UserRole`.
4. Implement `University`, `Subject`, `Curriculum`, and other reference entities.
5. Implement `TutorProfile` and its subject, grade, curriculum, location, and availability relations.
6. Implement `GuardianProfile`.
7. Implement `TuitionListing` and its related subjects, preferences, and schedules.
8. Implement `Application`.
9. Implement `Conversation`, `ConversationParticipant`, and `Message`.
10. Implement contact-sharing records.
11. Implement verification request and evidence metadata.
12. Implement notifications, reports, consent records, and audit logs.
13. Add indexes and database constraints.
14. Review delete and retention behavior.
15. Generate migrations and test from a clean database.

The implementation order may be adjusted to satisfy Prisma relation dependencies, but the resulting model must preserve the approved relationships and constraints.

## 8.2 Reference data

Seed a small, maintainable set of reference records for development and testing.

Examples:

* Universities.
* Subjects.
* Curricula.
* Class levels.
* Supported teaching modes.
* Supported location hierarchy.

Do not seed fake real-user accounts into production.

Reference data should be idempotently seeded where possible: running the seed process again must not create duplicates.

## 8.3 Database rules

* Use UUIDs or the approved ID strategy consistently.
* Enforce unique email addresses.
* Enforce one profile of each type per user.
* Enforce one application per tutor per listing.
* Use foreign keys for relationships.
* Add indexes based on actual search and retrieval patterns.
* Avoid storing redundant information unless its consistency strategy is explicit.
* Define how suspended users and historical records are retained.
* Never store raw student ID documents in ordinary relational columns.

## 8.4 Important deletion review

Review every `Cascade`, `Restrict`, and `SetNull` relation.

The deletion of a user must not unexpectedly erase legally or operationally important records. Conversely, restrictive foreign keys must not make a legitimate account deletion impossible without a defined process.

Write and test explicit account deletion and anonymization behavior before launch.

## 8.5 Acceptance criteria

* Prisma schema validates using the installed Prisma version.
* Migrations apply from an empty database.
* Seed data is repeatable.
* Unique and foreign-key constraints behave as expected.
* Search indexes exist for approved access patterns.
* Test coverage includes invalid relationships and conflicting operations.
* Private evidence is stored outside public web access.

---

# 9. Phase 3 — Authentication and authorization

**Goal:** Establish a secure identity foundation before implementing protected marketplace features.

## 9.1 Backend endpoints

Implement the approved authentication contract:

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `GET /api/v1/auth/me`
* `PATCH /api/v1/users/me`
* Role-management endpoints as approved

## 9.2 Authentication requirements

* Hash passwords with a suitable modern password-hashing algorithm.
* Normalize emails before checking uniqueness.
* Use generic authentication errors where necessary to prevent account enumeration.
* Rate-limit registration and login.
* Implement access-token expiration.
* Implement secure refresh-token rotation and revocation.
* Revoke sessions on logout and appropriate security events.
* Never return password hashes or secret token material.
* Validate all environment configuration at startup.
* Never accept an account role or privilege directly from an untrusted request.

If email verification or password recovery is part of the launch requirements, implement the full flow, including token expiry, replay prevention, rate limiting, and safe responses. Do not present an unverified email as verified.

## 9.3 Authorization layers

Use distinct mechanisms for:

1. Authentication — who is making the request?
2. Role authorization — which general actions may this account perform?
3. Resource authorization — does the user own or participate in this particular resource?
4. State authorization — is the requested action allowed in the resource's current state?

A tutor role alone must not allow access to another tutor's private profile data.

## 9.4 Frontend requirements

Build:

* Registration.
* Login.
* Authentication loading state.
* Session restoration.
* Logout.
* Unauthorized-state handling.
* Role-aware navigation.
* Route protection where appropriate.

The frontend route guard is for usability. The API must independently enforce every permission.

## 9.5 Acceptance criteria

* Valid users can register and log in.
* Invalid credentials do not disclose unnecessary information.
* Expired and revoked sessions are rejected.
* Role changes take effect according to the session policy.
* Users cannot assign themselves administrative privileges.
* Resource ownership checks are covered by tests.
* Logging out invalidates the applicable refresh session.

---

# 10. Phase 4 — Design system and UI foundation

**Goal:** Translate the UI/UX Design Specification into reusable, production-quality components.

Do this before building every product screen independently.

## 10.1 Design tokens

Implement tokens for:

* Colors.
* Typography.
* Spacing.
* Borders and radii.
* Shadows and elevation.
* Breakpoints.
* Focus indicators.
* Motion duration.
* Layering and overlays.

The design tokens should reflect the approved Learning Commons visual direction: warm neutral surfaces, deep ink typography, botanical green, editorial hierarchy, and restrained motion.

Do not replace the design with default component-library styling.

## 10.2 Core components

Build and test these first:

* Button.
* Text input.
* Password input.
* Phone input.
* Select.
* Checkbox.
* Radio group.
* Textarea.
* Dialog.
* Drawer or sheet.
* Dropdown menu.
* Toast.
* Alert.
* Status badge.
* Loading skeleton.
* Empty state.
* Error summary.
* Pagination.
* Search bar.
* Filter chip.
* Responsive page container.

Every component should have documented behavior for default, hover, focus, pressed, disabled, loading, and error states as applicable.

## 10.3 Accessibility foundation

* Use semantic HTML.
* Use accessible names and descriptions.
* Implement visible keyboard focus.
* Connect form errors to inputs.
* Support reduced motion.
* Check color contrast.
* Test keyboard navigation.
* Verify responsive text behavior.
* Test Bangla glyphs and line wrapping if Bangla is enabled.

## 10.4 Acceptance criteria

* Tokens are implemented centrally.
* Forms use the same spacing and validation patterns.
* Buttons and inputs behave consistently.
* Components do not depend on page-specific styling hacks.
* Keyboard and screen-reader behavior has been tested.
* Mobile layouts do not overflow.
* Visual review confirms that the custom design direction is preserved.

---

# 11. Phase 5 — Public browsing and reference APIs

**Goal:** Allow visitors to explore the marketplace before creating an account.

### Backend

Implement:

* University reference endpoint.
* Subject reference endpoint.
* Curriculum and grade endpoints.
* Location endpoint.
* Public tutor search.
* Public tuition listing search.
* Public tutor profile.
* Public tuition detail.

### Frontend

Build:

* Homepage.
* Public navigation.
* Tutor search.
* Tuition search.
* Tutor profile page.
* Tuition detail page.
* Search filter sheet for mobile.
* Empty results.
* Loading and error states.
* Pagination or the approved continuation strategy.

### Search implementation rules

* Allowlist sortable fields.
* Validate filter values.
* Bound page size.
* Return only public response DTOs.
* Exclude drafts, rejected listings, and suspended content from public search.
* Preserve search state when returning from detail pages.
* Do not allow a client to request private fields by altering query parameters.

### Acceptance criteria

A visitor can search and inspect relevant published content without signing in. Private details remain inaccessible, and search remains usable on mobile.

---

# 12. Phase 6 — Tutor onboarding and profiles

**Goal:** Enable tutors to create useful profiles and become discoverable.

### Backend

Implement:

* Tutor profile creation.
* Tutor profile retrieval and update.
* Subject assignments.
* Grade assignments.
* Curriculum assignments.
* Location preferences.
* Availability.
* Expected rate range.
* Public profile projection.

### Frontend

Build the guided onboarding stages:

1. Academic background.
2. Teaching subjects and classes.
3. Teaching experience.
4. Areas and availability.
5. Expected rate.
6. Review profile.
7. Optional verification entry point.

### Validation

* Verify all reference IDs.
* Enforce approved numeric ranges.
* Reject duplicate assignment IDs.
* Ensure rate ranges are logically valid.
* Validate schedule time ranges.
* Prevent users from updating fields that require administrative authority.
* Keep profile fields optional where the product requirements permit it.

### Acceptance criteria

* Tutors can create and edit profiles.
* Public profiles expose only approved information.
* Tutors can update their subject, grade, curriculum, location, and availability lists.
* Invalid IDs or ranges are rejected.
* A partially completed profile is represented accurately.
* A tutor can return to onboarding without losing saved data.

---

# 13. Phase 7 — Guardian onboarding and tuition listing creation

**Goal:** Enable parents to publish clear and useful tuition requirements.

### Backend

Implement:

* Guardian profile creation.
* Guardian profile update.
* Tuition listing creation.
* Draft retrieval and editing.
* Listing publication.
* Listing search and detail.
* Listing closure.
* Listing ownership checks.
* Listing moderation state where required.

### Frontend

Implement the guided listing flow:

1. Class and subjects.
2. Location.
3. Schedule.
4. Budget and preferences.
5. Description and additional context.
6. Preview.
7. Publish.

### Business rules

* The backend derives the owner from the authenticated account.
* A listing cannot be published if required fields are missing.
* A closed listing cannot receive new applications.
* Public results contain only published, open listings.
* Exact residential addresses must not be required in public listing content.
* Listing edits follow the approved moderation policy.
* Closing a listing preserves historical applications.
* The salary range is expressed consistently in BDT and monthly terms.

### Acceptance criteria

A guardian can create a draft, leave and return, correct validation errors, preview the public listing, and publish it without re-entering completed information.

---

# 14. Phase 8 — Applications and status management

**Goal:** Connect tutors and guardians through a reliable application workflow.

### Backend

Implement:

* Application creation.
* Tutor application history.
* Listing owner's applicant list.
* Application detail.
* Application withdrawal.
* Owner-controlled status updates.
* Database uniqueness enforcement.
* Notifications for relevant state changes.

### Frontend

Tutor views:

* Matching opportunities.
* Tuition detail.
* Application form.
* Application confirmation.
* Application status list.

Guardian views:

* Applications for each listing.
* Applicant profile summary.
* Shortlist action.
* Accept/reject actions where permitted.
* Status history and notifications.

### State machine

Define and implement valid transitions for the selected application statuses.

The initial model may include:

`PENDING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.

Do not implement transitions as arbitrary string updates. Use a dedicated service method that validates the current state, actor, and target state.

### Concurrency requirements

Two simultaneous requests must not create duplicate applications.

Concurrent acceptance, rejection, withdrawal, or listing closure must produce a consistent final state. Use database constraints and transactions as appropriate.

### Acceptance criteria

* A tutor can apply once to an eligible listing.
* A duplicate application returns a consistent conflict response.
* Only authorized users can review or modify an application.
* State transitions are validated.
* The listing owner sees applicants for their own listings only.
* Relevant users receive appropriate status notifications.
* Closing a listing prevents new applications.

---

# 15. Phase 9 — Messaging and contact sharing

**Goal:** Enable safe, reliable communication without introducing payment infrastructure.

### Backend

Implement:

* Conversation creation.
* Conversation listing.
* Conversation participant verification.
* Message creation.
* Cursor-based message retrieval.
* Read state.
* Contact-sharing consent.
* Private contact retrieval under the approved policy.
* Reporting and blocking controls as scoped for launch.

### Frontend

Build:

* Conversation list.
* Conversation view.
* Message composer.
* Sending and failure states.
* Retry behavior.
* Read state where supported.
* Contact-sharing confirmation.
* Report or safety action.

### Messaging requirements

* Only participants can access a conversation.
* Only participants can send messages.
* Message length is bounded.
* Sending is rate-limited.
* Message history is paginated.
* Duplicate conversation creation is controlled.
* Contact sharing is enforced by the backend.
* Private information is not embedded in public notification payloads.

Start with a simple, reliable delivery strategy. Add WebSockets or another real-time transport only after persisted messaging, authorization, and failure handling are correct.

### Acceptance criteria

Both parties can communicate in an authorized conversation. Unauthorized users cannot read messages or obtain private contact information. Failed message sends are clearly presented and recoverable.

---

# 16. Phase 10 — Student verification

**Goal:** Provide an optional, transparent verification process.

This feature should be implemented after the main marketplace works unless verification is essential to the agreed launch policy.

### Backend

Implement:

* Verification request creation.
* Evidence-upload authorization.
* Private evidence storage.
* Evidence metadata.
* Submission.
* Authorized review queue.
* Approve, reject, or request-more-information actions.
* Audit history.
* Public verification status projection.

### Frontend

Build:

* Verification explanation.
* Request creation.
* Evidence submission.
* Pending state.
* Reviewer decision state.
* Rejection or additional-information explanation.
* Admin review interface.

### Security requirements

* Upload only to private storage.
* Restrict file size and accepted types.
* Verify file type independently.
* Use short-lived upload URLs where applicable.
* Scan uploaded files where the storage pipeline supports it.
* Restrict evidence retrieval to authorized reviewers.
* Prevent self-approval.
* Record review decisions.
* Never publish student ID images or numbers.
* Define evidence retention and deletion behavior.

### Acceptance criteria

A user can request verification, submit evidence securely, and see their own status. Authorized reviewers can make auditable decisions. Public users see only the approved verification result, not the evidence itself.

---

# 17. Phase 11 — Notifications, reporting, and moderation

**Goal:** Give users feedback and give the platform basic operational control.

### Notifications

Implement:

* New application.
* Application status change.
* New message.
* Verification decision.
* Relevant moderation outcome.

Use a shared notification service so that different modules do not invent inconsistent notification behavior.

### Reports

Implement:

* Report submission.
* Report history for the reporter.
* Admin report queue.
* Report status updates.
* Resolution notes with appropriate access control.

### Admin moderation

Implement:

* User search.
* Listing review.
* Account suspension.
* Listing suspension or rejection.
* Verification review.
* Report investigation.
* Audit-log access.

### Authorization requirements

* Every admin route requires explicit server-side authorization.
* The backend derives the acting administrator's identity.
* Administrative actions are audited.
* Suspensions revoke or invalidate relevant sessions according to the security policy.
* A moderator cannot approve their own verification.
* Sensitive investigation notes are never exposed to ordinary users.
* Protect against removal or suspension of the last active administrator.

### Acceptance criteria

Users receive accurate notifications, suspicious behavior can be reported, and authorized administrators can investigate and take controlled action with an audit trail.

---

# 18. Phase 12 — Security and privacy review

**Goal:** Ensure the product is not merely functional but safe to operate.

This phase begins during foundational development and must be completed before production release.

## 18.1 Authentication security

Test:

* Invalid login.
* Expired access token.
* Expired refresh token.
* Reused rotated refresh token.
* Logout followed by refresh attempt.
* Suspended account attempting a protected action.
* Rate-limit behavior.
* Password-reset token expiration, if implemented.

## 18.2 Authorization security

Test every private resource for:

* Correct owner access.
* Wrong owner access.
* Unauthenticated access.
* User with an unrelated role.
* Suspended account access.
* Direct URL access.
* Modified resource IDs.
* Cross-user message access.
* Unauthorized contact retrieval.
* Unauthorized verification evidence retrieval.

## 18.3 Input and application security

* Validate all incoming DTOs.
* Prevent mass assignment of privileged fields.
* Bound query parameters and pagination.
* Escape untrusted content at the rendering boundary.
* Prevent unsafe file uploads.
* Configure security headers.
* Restrict CORS to approved origins.
* Protect cookie-authenticated mutations against CSRF.
* Avoid leaking stack traces and secrets.
* Review dependency vulnerabilities.
* Avoid logging passwords, tokens, full student ID numbers, or raw private evidence.

## 18.4 Privacy requirements

* Document each category of collected personal information.
* Collect only information needed for a clear purpose.
* Define consent requirements.
* Define retention periods.
* Define account deletion and anonymization behavior.
* Protect guardian emergency contacts.
* Avoid exposing exact home addresses.
* Make contact-sharing behavior understandable.
* Document which administrators may access sensitive records and why.

### Acceptance criteria

A documented security checklist has been completed, authorization tests pass, evidence remains private, and unresolved high-severity security issues block release.

---

# 19. Phase 13 — Testing strategy

Testing must be performed continuously, not postponed until the final week.

## 19.1 Unit tests

Test business rules in isolation:

* Rate-range validation.
* Listing state transitions.
* Application state transitions.
* Duplicate application handling.
* Role checks.
* Ownership checks.
* Contact-sharing authorization.
* Verification decisions.
* Notification creation.
* Search filter validation.

## 19.2 Integration tests

Test actual interaction with a dedicated test database:

* User registration and uniqueness.
* Profile relations.
* Listing creation and publication.
* Application uniqueness.
* Listing closure and concurrent applications.
* Conversation creation.
* Message authorization.
* Contact-sharing permissions.
* Verification state updates.
* Account suspension.
* Referential integrity.

## 19.3 End-to-end tests

Use Playwright to test critical journeys from the browser.

**Journey A — Tutor**

1. Register.
2. Complete a tutor profile.
3. Search tuition.
4. Open a listing.
5. Apply.
6. View application status.
7. Open an authorized conversation.

**Journey B — Guardian**

1. Register.
2. Complete a guardian profile.
3. Create a listing.
4. Publish it.
5. Review an application.
6. Update the application status.
7. Communicate with the tutor.

**Journey C — Verification**

1. Request verification.
2. Submit evidence through the authorized upload process.
3. Review the request as an authorized reviewer.
4. Approve or reject it.
5. Confirm that public profile data exposes only the permitted status.

**Journey D — Unauthorized access**

1. Sign in as one user.
2. Attempt to access another user's private resource.
3. Confirm the API denies access.
4. Confirm no sensitive data appears in the response.

## 19.4 UI and accessibility testing

Test:

* Narrow mobile viewport.
* Tablet viewport.
* Desktop viewport.
* Keyboard-only navigation.
* Focus indicators.
* Screen-reader labels.
* Form validation and error recovery.
* Long text and long names.
* Empty search results.
* Slow network and failed requests.
* Bangla rendering, when enabled.
* Reduced-motion preference.

## 19.5 Performance testing

Measure:

* Public search response times.
* Database query behavior.
* Listing search under representative data volume.
* Message history pagination.
* Frontend Core Web Vitals.
* Image and font loading.
* Resource consumption under expected launch traffic.

Do not claim the system scales to a particular number of users until testing supports that claim.

### Release test gate

* All critical journey tests pass.
* No unresolved high-severity security defects.
* No known data-leak issue.
* No broken core journey on supported mobile and desktop browsers.
* Database migrations and rollback/recovery procedures have been reviewed.
* Production environment configuration has been checked.

---

# 20. Phase 14 — Deployment and operations

**Goal:** Deploy a reproducible production system with monitoring and recovery procedures.

## 20.1 Environments

Maintain separate environments for:

* Local development.
* Automated testing.
* Staging.
* Production.

Use separate database credentials and secrets. Never let test automation run destructive operations against production.

## 20.2 CI/CD pipeline

A proposed pipeline:

1. Install dependencies from the lockfile.
2. Run linting.
3. Run type checking.
4. Validate the Prisma schema.
5. Generate the Prisma client.
6. Run unit tests.
7. Run integration tests against the test database.
8. Build the frontend and backend.
9. Run end-to-end tests in the appropriate pipeline stage.
10. Deploy to staging.
11. Run smoke tests.
12. Require the configured release approval.
13. Apply reviewed production migrations.
14. Deploy the application.
15. Run post-deployment health checks.

The exact ordering of database migrations and application deployment must be planned for compatibility. Use backward-compatible migrations where possible.

## 20.3 Database migration safety

* Never use a development migration-reset command on production.
* Review generated SQL for destructive changes.
* Back up production data before high-risk schema changes.
* Test migrations against a realistic staging database.
* Prefer additive schema changes followed by data migration and cleanup.
* Maintain a recovery procedure for failed deployments.
* Do not assume every database migration can be reversed automatically.

## 20.4 Observability

Implement:

* Structured application logs.
* Request correlation IDs.
* Error tracking.
* Database health monitoring.
* API latency metrics.
* Authentication and authorization failure monitoring.
* Rate-limit and abuse monitoring.
* Backup monitoring.
* Alerts for repeated failures.

Logs must not contain passwords, session tokens, raw verification evidence, or unnecessary personal data.

## 20.5 Backups and recovery

Define:

* Automated database backups.
* Backup retention.
* Restore procedures.
* Recovery Point Objective (RPO).
* Recovery Time Objective (RTO).
* Periodic restore testing.
* Incident response ownership.

A backup that has never been restored in a test is not a verified recovery plan.

## 20.6 Acceptance criteria

* Staging deployment is repeatable.
* Production secrets are correctly configured.
* Health checks work.
* Logs and alerts are operational.
* Backups are configured and restoration is tested.
* Deployment and recovery instructions are documented.
* The team knows how to disable a broken feature or roll back an application release.

---

# 21. Phase 15 — Beta launch and product validation

**Goal:** Confirm that real users can successfully complete the core journey.

Start with a controlled group of tutors and parents in the intended launch area rather than opening the platform broadly before operational problems are understood.

## 21.1 Beta activities

* Observe users searching for tuition.
* Observe guardians creating listings.
* Observe tutors applying.
* Identify confusion in application status.
* Verify that users understand contact-sharing rules.
* Review suspicious listings and reports.
* Monitor errors and search performance.
* Collect feedback on Bangla language and local usability.
* Fix high-impact usability issues before expanding access.

## 21.2 Beta metrics

Measure:

* Number of completed tutor profiles.
* Number of published tuition listings.
* Search-to-detail conversion.
* Listing-to-application conversion.
* Listing creation abandonment.
* Time until a listing receives its first application.
* Time until a guardian reviews an application.
* Messaging failures.
* Reports and moderation response time.
* Error rates and API latency.

Use these metrics to identify friction, not to create misleading marketing claims.

## 21.3 Launch criteria

The product is ready for a wider launch when:

* The core parent and tutor journeys are reliable.
* Users can understand the product without direct assistance.
* Privacy and authorization tests pass.
* Support and moderation procedures exist.
* Monitoring and recovery are operational.
* There is a clear process for handling reported abuse.
* The team can fix and deploy issues safely.

---

# 22. Deferred features

The following should not be part of the initial MVP unless a validated requirement changes their priority.

| Feature                           | Reason to defer                                                   |
| --------------------------------- | ----------------------------------------------------------------- |
| Online payments                   | Adds financial, refund, fraud, and compliance complexity          |
| Platform commission               | Conflicts with the initial free model                             |
| Wallet and payouts                | Unnecessary for a connection-only marketplace                     |
| AI tutor matching                 | Reliable rule-based filters should come first                     |
| AI profile writing                | Not required for the core journey                                 |
| Ratings and reviews               | Requires safeguards against fake reviews and retaliation          |
| Complex recommendation engine     | Needs sufficient real usage data                                  |
| Native mobile apps                | Responsive web should validate the product first                  |
| Multi-service architecture        | Adds operational complexity without an established need           |
| Advanced real-time infrastructure | Persisted messaging should work reliably first                    |
| Paid promotion                    | Can compromise fairness and trust if introduced carelessly        |
| Large analytics platform          | Basic, privacy-conscious product metrics are sufficient initially |

A deferred feature should be promoted into the roadmap only when there is a documented user need, a clear scope, and an implementation plan.

---

# 23. Definition of Done

A task is not complete merely because the code compiles or the UI looks correct.

Every task must satisfy the applicable criteria below.

## Backend task

* DTO validation implemented.
* Authentication and authorization implemented.
* Business rules implemented.
* Database constraints considered.
* Success and failure responses defined.
* Unit or integration tests added.
* API documentation updated.
* Sensitive data reviewed.
* Logs and errors handled appropriately.

## Frontend task

* Approved design system followed.
* Loading, empty, error, success, and disabled states implemented where applicable.
* Responsive layouts tested.
* Validation and error recovery implemented.
* Keyboard and accessibility behavior checked.
* API failures handled without indefinite loading.
* Relevant end-to-end tests added or updated.
* No private data exposed in rendered content or browser logs.

## Database task

* Schema validated.
* Migration reviewed.
* Constraints and indexes considered.
* Seed behavior checked.
* Delete behavior reviewed.
* Migration tested against a clean database.
* Production impact documented.

## Feature task

* All acceptance criteria pass.
* Authorization is tested.
* Relevant documentation is updated.
* The feature is tested in staging.
* No unresolved critical defect remains.
* The next phase can use the feature without undocumented assumptions.

---

# 24. Work management and progress tracking

Use GitHub Issues, Jira, or another issue tracker to break the phases into small, verifiable tasks.

Every task should include:

* A unique identifier.
* A short title.
* A phase and priority.
* Dependencies.
* Scope and expected behavior.
* Acceptance criteria.
* Testing requirements.
* Documentation impact.
* Completion status.

### Suggested labels

* `phase:foundation`
* `phase:database`
* `phase:auth`
* `phase:design-system`
* `phase:marketplace`
* `phase:applications`
* `phase:messaging`
* `phase:verification`
* `phase:security`
* `phase:deployment`
* `type:backend`
* `type:frontend`
* `type:database`
* `type:testing`
* `type:documentation`
* `priority:critical`
* `priority:high`
* `priority:normal`

### Work item template

**Title:** Implement guardian listing creation

**Purpose:** Allow an authenticated guardian to create a draft tuition listing.

**Dependencies:**

* Authentication.
* Guardian profile.
* Database listing models.
* Reference-data APIs.

**Scope:**

* Request DTO.
* Validation.
* Service method.
* Controller.
* Database persistence.
* Error handling.
* Unit and integration tests.
* API documentation.

**Acceptance criteria:**

* Only authorized guardians can create listings.
* The owner is derived from the authenticated account.
* Invalid reference IDs are rejected.
* Salary and schedule validation works.
* A valid request creates a draft listing.
* The response contains only approved fields.
* Tests cover unauthorized and invalid requests.

**Out of scope:**

* Listing publication.
* Search ranking.
* Payments.
* AI matching.

**Status:** Not started / In progress / In review / Blocked / Done

A task should be marked `Blocked` when a dependency or unresolved product decision prevents correct implementation. Do not hide uncertainty by marking incomplete work as done.

---

# 25. Dependency map

The implementation order matters because later features rely on earlier capabilities.

```text
Product decisions
       |
       v
Repository foundation
       |
       v
Database + reference data
       |
       v
Authentication + authorization
       |
       v
Design system
       |
       v
Public browsing
       |
       +----------------------+
       |                      |
       v                      v
Tutor profiles          Guardian profiles
       |                      |
       v                      v
Tutor search            Tuition listings
       |                      |
       +----------+-----------+
                  |
                  v
              Applications
                  |
                  v
         Conversations + messaging
                  |
                  v
       Contact sharing + notifications
                  |
                  v
       Verification + moderation
                  |
                  v
       Security + release validation
                  |
                  v
             Beta launch
```

Security, testing, documentation, and accessibility are cross-cutting activities. They must run throughout development rather than being postponed until their position in the diagram.

---

# 26. First implementation sprint

Do not begin by building the homepage, every dashboard, and every feature simultaneously.

Start with a small foundation that produces a reproducible system.

### Sprint goals

1. Finalize the MVP decisions in Phase 0.
2. Create the repository and workspace.
3. Configure the web and API applications.
4. Set up PostgreSQL and Prisma.
5. Add the first schema migration for users, roles, and reference data.
6. Add global API validation and error handling.
7. Configure CI.
8. Build the initial design tokens and core form components.
9. Document the local setup.
10. Verify that another developer can run the project from a clean checkout.

### Sprint exit criteria

* The project starts locally using documented commands.
* The API and frontend communicate successfully.
* Database migrations and seeding work.
* CI passes.
* The initial design system is in place.
* No secrets are committed.
* The next sprint's dependencies are understood.

Only after these conditions are met should the team begin implementing the complete authentication and profile journeys.

---

# 27. Final execution rule

**Implement one vertical slice at a time.**

A vertical slice includes the database work, API, validation, authorization, frontend, error states, and tests needed to complete one meaningful user journey.

For example, do not implement every backend endpoint first and leave all frontend work until the end. Complete a coherent feature, verify it, and then build on it.

The correct order is:

1. Understand the requirement.
2. Confirm dependencies.
3. Define the contract.
4. Implement the smallest complete version.
5. Test success and failure paths.
6. Review privacy and accessibility.
7. Update documentation.
8. Merge only when acceptance criteria pass.
9. Proceed to the next dependent task.

The project should be judged by completed, tested user journeys—not by the number of files, endpoints, screens, or lines of code.

**The first milestone is not a beautiful homepage. It is a reliable foundation from which the entire marketplace can be built without guesswork, unnecessary rework, or compromising user trust.**
