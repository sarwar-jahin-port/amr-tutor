# Technical Requirements Document (TRD)

## Free Home Tuition Marketplace — Bangladesh

**Document version:** 1.0
**Date:** 9 October 2026
**Status:** Proposed technical specification
**Product type:** Responsive web application
**Initial market:** Bangladesh
**Architecture:** Modular monolith with a REST API

---

# 1. Technical Overview

## 1.1 Purpose

This document defines the technical architecture, implementation requirements, database structure, API contracts, security controls, deployment strategy, and testing requirements for the home tuition marketplace.

The system connects university students seeking home tuition opportunities with parents or guardians looking for tutors.

The platform facilitates discovery and communication. It does not collect tuition payments, charge placement commissions, employ tutors, or negotiate agreements between users.

## 1.2 Technical objectives

The system must:

* Support separate tutor and parent experiences.
* Provide structured tutor profiles and tuition listings.
* Support university-affiliation verification.
* Allow tutors to search and apply for tuition opportunities.
* Allow parents to review applicants and manage listings.
* Facilitate consent-based contact sharing and private communication.
* Protect personal information, student IDs, and guardian contact details.
* Provide administrative tools for verification and moderation.
* Remain inexpensive to operate during the initial launch.
* Support future expansion without requiring a complete architectural rewrite.

## 1.3 Proposed technology stack

| Layer          | Technology                                                   | Purpose                                              |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Frontend       | Next.js + TypeScript                                         | Responsive website and dashboard                     |
| UI             | Tailwind CSS + shadcn/ui                                     | Accessible, reusable components                      |
| Backend        | NestJS + TypeScript                                          | API and business logic                               |
| API style      | REST + JSON                                                  | Communication between frontend and backend           |
| Database       | PostgreSQL                                                   | Persistent relational data                           |
| ORM            | Prisma                                                       | Schema management, migrations, typed database access |
| Validation     | Zod on frontend; DTO validation on backend                   | Input validation                                     |
| Authentication | Server-managed sessions or secure token-based authentication | User authentication                                  |
| File storage   | Private S3-compatible object storage                         | Verification evidence                                |
| Email          | Transactional email provider                                 | Account and application notifications                |
| SMS            | Bangladesh-compatible OTP provider, if selected              | Phone verification                                   |
| Testing        | Jest, Supertest, Playwright                                  | Unit, API integration, and browser testing           |
| Deployment     | Managed application hosting + managed PostgreSQL             | Initial production infrastructure                    |
| CI/CD          | GitHub Actions                                               | Automated checks and deployment                      |

**Technology selection principles**

* Use a modular monolith instead of microservices.
* Keep PostgreSQL as the primary source of truth.
* Do not introduce Redis, Kafka, Elasticsearch, or Kubernetes in the MVP unless a demonstrated requirement justifies them.
* Use a managed object-storage service instead of storing uploaded documents in the database or application filesystem.
* Select providers based on availability, regional payment and account requirements, security, cost, and data-processing terms.

## 1.4 Proposed repository structure

Use a pnpm monorepo to share types and validation contracts where useful.

```text
tuition-marketplace/
├── apps/
│   ├── web/                     # Next.js frontend
│   └── api/                     # NestJS backend
├── packages/
│   ├── contracts/               # Shared API schemas and types
│   ├── config/                  # Shared lint and TS configuration
│   └── ui/                      # Shared UI components, if needed
├── infrastructure/
│   └── docker/                  # Local development services
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── API.md
│   └── SECURITY.md
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Use a single repository initially. Avoid extracting packages until they have a real reuse requirement.

---

# 2. System Architecture

## 2.1 High-level architecture

```text
                 Users
           ┌──────┴──────┐
           │             │
         Tutors        Parents
           │             │
           └──────┬──────┘
                  │ HTTPS
                  ▼
          ┌───────────────┐
          │ Next.js Web   │
          │ Public Pages  │
          │ Dashboards    │
          └───────┬───────┘
                  │ REST / JSON
                  ▼
          ┌───────────────┐
          │ NestJS API    │
          │               │
          │ Auth          │
          │ Profiles      │
          │ Listings      │
          │ Applications  │
          │ Verification  │
          │ Messaging     │
          │ Moderation    │
          └───────┬───────┘
                  │
          ┌───────┴─────────┐
          ▼                 ▼
    PostgreSQL        Private Object
    Primary Data      Storage
          │
          ▼
    Managed Backups

          External Services
          ├── Email provider
          └── SMS provider, if enabled
```

## 2.2 Architecture rules

* The frontend must not access the database directly.
* All business operations must pass through the backend.
* The backend must enforce authorization independently of frontend visibility.
* Shared TypeScript types improve consistency but do not replace server-side validation.
* Uploaded identity documents must use private storage and controlled access.
* External service failures must not silently corrupt database state.
* The API must be versioned so that future clients can evolve safely.

## 2.3 Backend module boundaries

Organize NestJS by business domain.

```text
apps/api/src/
├── auth/
├── users/
├── tutor-profiles/
├── guardian-profiles/
├── universities/
├── verification/
├── tuition-listings/
├── applications/
├── conversations/
├── contact-sharing/
├── notifications/
├── reports/
├── moderation/
├── admin/
├── analytics/
├── audit/
├── common/
└── main.ts
```

Each module owns its validation, services, controllers, and domain-specific database operations where appropriate.

Avoid controllers that contain business logic. Controllers should handle HTTP concerns and delegate to application services.

---

# 3. Authentication and Authorization

## 3.1 Authentication requirements

The system must support:

* Account registration.
* Login and logout.
* Email or phone verification according to the chosen registration policy.
* Password recovery if passwords are used.
* Session invalidation.
* Account suspension and deletion.
* Authentication rate limits.
* Secure handling of authentication secrets.

### Recommended implementation

For a first-party website, prefer server-managed sessions using secure, HTTP-only cookies if the deployment architecture supports them cleanly.

If using access and refresh tokens instead, define token rotation, revocation, expiration, and secure storage explicitly. Do not store long-lived authentication tokens in browser local storage.

If OTP authentication is selected:

* Limit OTP requests and verification attempts.
* Expire codes quickly.
* Store only appropriately protected representations of codes.
* Prevent code reuse.
* Avoid revealing whether a particular phone number has an account.
* Apply cooldowns and abuse monitoring.

## 3.2 Authorization model

Use role-based access control combined with resource ownership checks.

Initial roles:

* `TUTOR`
* `PARENT`
* `VERIFIER`
* `MODERATOR`
* `ADMIN`

A user may have more than one permitted role only if the product explicitly supports and tests that arrangement.

### Permission examples

| Resource/action                       | Tutor                 | Parent      | Verifier            | Admin                 |
| ------------------------------------- | --------------------- | ----------- | ------------------- | --------------------- |
| Edit own tutor profile                | Yes                   | No          | No                  | By policy             |
| Create own tuition listing            | No                    | Yes         | No                  | By policy             |
| Apply to a listing                    | Yes                   | No          | No                  | No                    |
| Review applicants for own listing     | No                    | Yes         | No                  | No                    |
| Review assigned verification requests | No                    | No          | Yes                 | Yes                   |
| Process reports                       | Report only           | Report only | Limited             | Yes                   |
| Access private identity evidence      | Own submission status | No          | Assigned cases only | Explicitly authorized |

Every protected endpoint must enforce permissions on the server.

A frontend route guard alone is insufficient.

---

# 4. Database Requirements

## 4.1 Database conventions

Use PostgreSQL with Prisma.

General conventions:

* UUID primary keys.
* UTC timestamps in storage.
* Explicit database constraints and indexes.
* Foreign keys for relational integrity.
* Transactions for operations that update related records.
* Soft deletion only where justified by a defined retention policy.
* Database migrations committed to version control.
* No production schema changes made through ad hoc manual editing.

Recommended shared fields:

```text
id          UUID PRIMARY KEY
createdAt   TIMESTAMPTZ
updatedAt   TIMESTAMPTZ
```

Add these fields only to entities where they make sense. Not every table needs identical metadata.

## 4.2 Core entities

### User

```text
User
- id
- email                 nullable, unique when present
- phone                 nullable, unique when present
- passwordHash          nullable, depending on auth method
- status
- createdAt
- updatedAt
- deletedAt             nullable
```

Account status values:

* `ACTIVE`
* `SUSPENDED`
* `PENDING_DELETION`
* `DELETED`

Authentication identities and roles must be represented consistently. If users can hold multiple roles, use a related `UserRole` table instead of a single role column.

### TutorProfile

```text
TutorProfile
- id
- userId                unique FK
- fullName
- universityId          FK
- department
- degreeProgram
- academicStatus
- academicYear          nullable
- introduction          nullable
- profilePhotoKey       nullable
- preferredFeeMin       nullable
- preferredFeeMax       nullable
- feeCurrency           default BDT
- isAvailable
- createdAt
- updatedAt
```

Additional normalized relations:

* `TutorSubject`
* `TutorGrade`
* `TutorCurriculum`
* `TutorLocation`
* `TutorAvailability`
* `TutorLanguage`

Avoid storing multiple subjects, areas, or availability slots in comma-separated text fields.

### GuardianProfile

```text
GuardianProfile
- id
- userId                unique FK
- displayName
- preferredLanguage     nullable
- createdAt
- updatedAt
```

Phone numbers should remain associated with the protected user account or an appropriately restricted contact record. They should not be copied into public listing fields.

### University

```text
University
- id
- name
- normalizedName
- isActive
- createdAt
- updatedAt
```

Use a unique constraint on the normalized institution name or a suitable stable identifier.

### VerificationRequest

```text
VerificationRequest
- id
- tutorProfileId        FK
- verificationType
- status
- evidenceStorageKey   private reference
- assignedVerifierId   nullable FK
- reviewedAt           nullable
- decisionReason       nullable
- createdAt
- updatedAt
```

Verification statuses:

* `PENDING`
* `IN_REVIEW`
* `NEEDS_INFORMATION`
* `APPROVED`
* `REJECTED`
* `CANCELLED`

A separate `VerificationEvidence` table can support multiple documents or evidence items where needed.

Do not expose `evidenceStorageKey` through public APIs.

### TuitionListing

```text
TuitionListing
- id
- parentUserId         FK
- title
- description
- classLevel
- curriculumId         nullable FK
- neighborhoodId       nullable FK
- locationDescription  nullable
- latitude             nullable
- longitude            nullable
- salaryMin            nullable
- salaryMax            nullable
- currency             default BDT
- daysPerWeek
- preferredGender      nullable
- teachingMode
- startDate            nullable
- status
- publishedAt          nullable
- expiresAt            nullable
- createdAt
- updatedAt
- closedAt             nullable
```

Additional normalized relations:

* `ListingSubject`
* `ListingUniversityPreference`
* `ListingSchedule`
* `ListingRequirement`

The exact address of a family must not be included in the public listing.

Coordinates, if supported, must represent a sufficiently coarse location and must not expose a home's exact position.

### Application

```text
Application
- id
- listingId            FK
- tutorProfileId       FK
- introduction         nullable
- status
- submittedAt
- updatedAt
```

Create a unique constraint on `(listingId, tutorProfileId)` to prevent duplicate applications.

Application statuses:

* `SUBMITTED`
* `VIEWED`
* `SHORTLISTED`
* `CONTACT_REQUESTED`
* `ACCEPTED`
* `DECLINED`
* `WITHDRAWN`
* `CLOSED`

Use server-side state-transition rules so that clients cannot arbitrarily change application statuses.

### Conversation

```text
Conversation
- id
- applicationId        unique FK
- status
- createdAt
- updatedAt
```

For the initial version, one conversation per application is sufficient.

Conversation access must be restricted to its authorized participants and authorized moderation workflows.

### ConversationParticipant

```text
ConversationParticipant
- id
- conversationId       FK
- userId               FK
- joinedAt
- lastReadAt           nullable
```

Use a unique constraint on `(conversationId, userId)`.

### Message

```text
Message
- id
- conversationId       FK
- senderUserId         FK
- body
- createdAt
- editedAt             nullable
- deletedAt            nullable
```

Apply length limits, rate limits, input validation, and appropriate moderation controls.

Messages must never be exposed to users outside the conversation.

### ContactShare

```text
ContactShare
- id
- applicationId        FK
- sharedByUserId       FK
- recipientUserId      FK
- sharedFields
- consentedAt
- revokedAt            nullable
```

Record deliberate contact-sharing actions. Revoking future access cannot guarantee deletion of information already seen or copied by the recipient; explain this to users.

### Report

```text
Report
- id
- reporterUserId       FK
- targetUserId         nullable FK
- listingId            nullable FK
- applicationId        nullable FK
- category
- description
- status
- assignedModeratorId  nullable FK
- resolution           nullable
- createdAt
- resolvedAt           nullable
```

At least one valid report target must be supplied.

### Notification

```text
Notification
- id
- userId               FK
- type
- payload              minimal non-sensitive data
- readAt               nullable
- createdAt
```

Notifications should avoid including identity documents, sensitive personal information, or private message contents unnecessarily.

### AuditLog

```text
AuditLog
- id
- actorUserId          nullable FK
- action
- targetType
- targetId
- outcome
- metadata             minimized JSON
- createdAt
```

Audit logs should be append-only to ordinary application users. Restrict access and avoid logging secrets or full identity documents.

## 4.3 Relationships

```text
User 1 ─── 0..1 TutorProfile
User 1 ─── 0..1 GuardianProfile

University 1 ─── N TutorProfile
TutorProfile 1 ─── N VerificationRequest

Guardian/User 1 ─── N TuitionListing
TuitionListing 1 ─── N Application
TutorProfile 1 ─── N Application

Application 1 ─── 0..1 Conversation
Conversation 1 ─── N Message
Conversation 1 ─── N ConversationParticipant

Application 1 ─── N ContactShare
User 1 ─── N Report
User 1 ─── N Notification
```

Implement additional constraints where necessary to prevent an application, conversation, or contact-share record from linking unrelated users.

## 4.4 Required indexes

At minimum, evaluate indexes for:

* `User.email`
* `User.phone`
* `TutorProfile.userId`
* `TutorProfile.universityId`
* `TuitionListing.status`
* `TuitionListing.parentUserId`
* `TuitionListing.publishedAt`
* `TuitionListing.classLevel`
* `TuitionListing.neighborhoodId`
* `Application.listingId`
* `Application.tutorProfileId`
* `Application.status`
* `ConversationParticipant.userId`
* `Message.conversationId, createdAt`
* `VerificationRequest.status, createdAt`
* `Report.status, createdAt`

Use composite and partial indexes where query patterns justify them. Confirm index choices using real query plans rather than indexing every field.

---

# 5. REST API Specification

## 5.1 General conventions

Base path:

`/api/v1`

Request and response format: JSON.

Use standard HTTP methods and appropriate status codes.

Common requirements:

* Validate all input on the server.
* Reject unexpected or invalid fields where appropriate.
* Return consistent error objects.
* Paginate listing and application results.
* Enforce authorization on every protected operation.
* Never return private database fields by default.
* Document endpoints using OpenAPI/Swagger.
* Apply rate limits to sensitive endpoints.

Example error response:

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "You are not allowed to perform this action."
}
```

## 5.2 Authentication endpoints

| Method | Endpoint                | Purpose                                      |
| ------ | ----------------------- | -------------------------------------------- |
| POST   | `/auth/register`        | Create an account                            |
| POST   | `/auth/login`           | Authenticate                                 |
| POST   | `/auth/logout`          | End session                                  |
| POST   | `/auth/refresh`         | Refresh credentials, if token-based          |
| POST   | `/auth/verify-phone`    | Verify phone, if OTP is enabled              |
| POST   | `/auth/password/forgot` | Start password recovery                      |
| POST   | `/auth/password/reset`  | Complete password recovery                   |
| GET    | `/auth/me`              | Return current user's permitted account data |

Select the actual authentication endpoints based on the chosen session or token design.

## 5.3 Tutor endpoints

| Method | Endpoint                   | Purpose                           |
| ------ | -------------------------- | --------------------------------- |
| GET    | `/tutors/me`               | Get own profile                   |
| PUT    | `/tutors/me`               | Create or update profile          |
| PATCH  | `/tutors/me/availability`  | Update availability               |
| GET    | `/tutors`                  | Search public tutor profiles      |
| GET    | `/tutors/:id`              | Get permitted public profile data |
| POST   | `/tutors/me/verifications` | Submit verification request       |
| GET    | `/tutors/me/verifications` | View own verification history     |

Private evidence must be uploaded through a separate authorized flow.

## 5.4 Tuition listing endpoints

| Method | Endpoint                | Purpose                        |
| ------ | ----------------------- | ------------------------------ |
| GET    | `/listings`             | Search published listings      |
| GET    | `/listings/:id`         | View permitted listing details |
| POST   | `/listings`             | Create a listing               |
| PATCH  | `/listings/:id`         | Update own listing             |
| POST   | `/listings/:id/publish` | Publish a listing              |
| POST   | `/listings/:id/pause`   | Pause a listing                |
| POST   | `/listings/:id/close`   | Close a listing                |

Listing publication must enforce required fields and moderation rules.

## 5.5 Application endpoints

| Method | Endpoint                     | Purpose                                   |
| ------ | ---------------------------- | ----------------------------------------- |
| POST   | `/listings/:id/applications` | Apply to a listing                        |
| GET    | `/applications/me`           | Get own applications                      |
| GET    | `/listings/:id/applications` | Review applicants for an owned listing    |
| GET    | `/applications/:id`          | View an authorized application            |
| PATCH  | `/applications/:id/status`   | Update status through allowed transitions |
| POST   | `/applications/:id/withdraw` | Withdraw own application                  |

The backend must check listing ownership before returning an applicant list.

## 5.6 Messaging and contact-sharing endpoints

| Method | Endpoint                           | Purpose                                     |
| ------ | ---------------------------------- | ------------------------------------------- |
| GET    | `/conversations`                   | List accessible conversations               |
| GET    | `/conversations/:id/messages`      | Fetch paginated messages                    |
| POST   | `/conversations/:id/messages`      | Send a message                              |
| POST   | `/applications/:id/contact-share`  | Share selected contact details with consent |
| GET    | `/applications/:id/contact-shares` | View authorized contact-sharing records     |

Only participants may access a conversation. Contact-sharing requests must validate the relationship between the application and both users.

## 5.7 Verification and moderation endpoints

| Method | Endpoint                            | Purpose                                |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/admin/verifications`              | List authorized review requests        |
| POST   | `/admin/verifications/:id/assign`   | Assign a verifier                      |
| POST   | `/admin/verifications/:id/decision` | Approve, reject, or request evidence   |
| POST   | `/reports`                          | Submit a report                        |
| GET    | `/admin/reports`                    | List reports for authorized moderators |
| POST   | `/admin/reports/:id/resolve`        | Record a moderation outcome            |
| POST   | `/admin/users/:id/suspend`          | Restrict an account                    |
| POST   | `/admin/users/:id/restore`          | Restore an account where permitted     |

Every sensitive administrative action must be authorized, recorded, and auditable.

## 5.8 Search and pagination

Example request:

`GET /api/v1/listings?classLevel=8&subject=mathematics&daysPerWeek=4&page=1&limit=20`

Example response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

The actual implementation must validate filter values, constrain page sizes, and use stable ordering.

For frequently changing datasets, cursor pagination may be preferable.

---

# 6. Business Logic and Data Integrity

## 6.1 Listing publication

Before publishing a listing, validate:

* Required academic and teaching details.
* Salary range consistency.
* Valid teaching days and schedule.
* Valid location data.
* Listing ownership.
* Applicable moderation restrictions.
* The account's active status.

Reject invalid requests without partially publishing a listing.

## 6.2 Application submission

An application can be created only if:

1. The user has an eligible tutor profile.
2. The tutor account is active.
3. The listing is published and accepting applications.
4. The tutor has not already applied to that listing.
5. The listing owner is not the applicant.
6. The application passes abuse and rate-limit checks.

Use a database uniqueness constraint as well as application-level validation.

## 6.3 Application state transitions

Implement an explicit transition map rather than accepting arbitrary status changes.

Examples:

* `SUBMITTED → VIEWED`
* `VIEWED → SHORTLISTED`
* `SHORTLISTED → CONTACT_REQUESTED`
* `SHORTLISTED → DECLINED`
* `CONTACT_REQUESTED → ACCEPTED`
* `SUBMITTED → WITHDRAWN`
* `VIEWED → WITHDRAWN`

The exact map should distinguish the tutor's actions from the parent's actions.

For example, a tutor must not be able to accept their own application on behalf of a parent. Invalid transitions should return a conflict response.

## 6.4 Listing closure

When a listing is filled or closed:

* Prevent new applications.
* Preserve historical application records according to the retention policy.
* Notify relevant users when appropriate.
* Allow authorized administrators to reopen a listing if justified.
* Avoid silently deleting conversations or reports related to the listing.

## 6.5 Verification decisions

* Only authorized reviewers may decide verification requests.
* Decisions must reference the correct request.
* Approval must not be possible if required evidence or checks are incomplete.
* Record decision timestamps and reviewer identity.
* Notify the tutor of the outcome.
* Keep public verification indicators synchronized with the latest valid decision.
* Support re-verification or expiry if the verification policy requires it.

## 6.6 Transactions and concurrent requests

Use database transactions where multiple changes must succeed together.

Examples:

* Creating an application and its associated records.
* Updating related listing and application states.
* Recording a verification decision and its audit event.
* Creating a conversation when the appropriate application state is reached.

Handle concurrent requests so that two users cannot create conflicting states through simultaneous operations.

---

# 7. File Uploads and Verification Evidence

## 7.1 Requirements

* Store evidence in a private object-storage bucket.
* Permit uploads only from authenticated and authorized users.
* Restrict accepted file types and maximum sizes.
* Verify actual file content rather than trusting the filename or MIME type alone.
* Generate random object keys.
* Do not expose permanent public URLs.
* Use short-lived signed upload or download URLs where appropriate.
* Prevent executable content from being served to users.
* Apply malware scanning or equivalent inspection where feasible.
* Log authorized access to sensitive evidence.

## 7.2 Retention policy

Define the minimum necessary retention period for verification evidence before launch.

When the review is complete:

* Retain only the evidence necessary for a defined operational or legal purpose.
* Delete unnecessary original documents.
* Keep a minimal verification decision record if justified.
* Ensure deletion policies cover object storage and any derived copies.
* Restrict backups according to a documented backup-expiry policy.

Do not use uploaded student IDs for unrelated profiling, advertising, or public display.

---

# 8. Messaging and Notifications

## 8.1 Initial messaging implementation

Begin with REST-based message retrieval and submission. Add WebSockets only when real-time messaging becomes a clear user requirement.

Messaging must include:

* Conversation membership validation.
* Message length limits.
* Rate limits and abuse prevention.
* Pagination.
* Read-state tracking if needed.
* Blocking and reporting workflows.
* Safe notification previews.
* Defined retention and moderation access rules.

## 8.2 Notification processing

For the initial version, simple database-backed notifications and a reliable email provider may be sufficient.

If notification volume grows, introduce a background job queue.

Notifications must be retryable without creating duplicate user-visible events. Use idempotency keys or an equivalent deduplication strategy where appropriate.

External service failures must not invalidate an otherwise successful database transaction.

---

# 9. Security Requirements

## 9.1 Application security

The system must implement:

* HTTPS everywhere.
* Secure cookie attributes when cookie-based authentication is used.
* CSRF protection where applicable.
* Content Security Policy and other suitable security headers.
* Server-side input validation.
* Output encoding and safe rendering.
* Protection against SQL injection through parameterized database access.
* Rate limiting and brute-force protection.
* Secure password hashing using a modern password-hashing algorithm.
* Secret management outside source control.
* Dependency vulnerability monitoring.
* Restricted CORS configuration.
* Safe error messages without internal stack traces.
* Protection against unauthorized object access and insecure direct object references.
* Administrative access controls and audit logs.

Use least privilege for application database credentials, storage access, and deployment credentials.

## 9.2 Privacy requirements

* Keep private user information out of public API responses.
* Do not expose guardian phone numbers by default.
* Do not expose exact home addresses.
* Separate verification evidence from profile data.
* Collect only necessary information about children.
* Provide privacy notices and suitable consent workflows.
* Support account and data deletion requests.
* Establish a documented data-retention policy.
* Restrict access to messages and reports.
* Avoid sending sensitive information to analytics or advertising systems.

## 9.3 Abuse prevention

Introduce reasonable limits for:

* Account creation.
* OTP requests.
* Failed authentication.
* Listing creation.
* Applications.
* Contact-sharing requests.
* Message sending.
* Report submissions.
* Verification requests.

Monitor suspicious activity without assuming that every high-volume user is malicious.

## 9.4 Legal readiness

Before production launch, review applicable Bangladesh requirements for personal data, children's data, electronic services, and online marketplace operations with qualified local counsel.

The system architecture must support the approved legal and operational policies; legal compliance cannot be established by code alone.

---

# 10. Frontend Requirements

## 10.1 Rendering strategy

Use Next.js rendering based on the page's needs:

* Server-render public tutor profiles and public listings where appropriate.
* Use client-side interactivity for filters, forms, dashboards, and messaging.
* Avoid placing private profile data in publicly cacheable responses.
* Use deliberate cache-control policies for authenticated and sensitive content.
* Revalidate public listing data when a listing changes status.

## 10.2 Main application routes

```text
/
├── /find-tutors
├── /find-tuition
├── /tutors/[id]
├── /listings/[id]
├── /login
├── /register
├── /how-it-works
├── /safety
├── /privacy
├── /terms
├── /dashboard
│   ├── /tutor/profile
│   ├── /tutor/verifications
│   ├── /tutor/applications
│   ├── /parent/listings
│   ├── /parent/applicants
│   ├── /messages
│   └── /settings
└── /admin
    ├── /users
    ├── /verifications
    ├── /listings
    ├── /reports
    └── /audit-logs
```

Route guards improve navigation and user experience, but backend authorization remains mandatory.

## 10.3 UI requirements

* Mobile-first responsive design.
* Accessible form labels and validation messages.
* Reusable components for listings, tutor cards, status indicators, and application actions.
* Clear loading, empty, error, and success states.
* Confirmation for destructive actions.
* Clear distinction between self-reported and verified information.
* Bangla and English localization support.
* Avoid exposing sensitive information through page metadata or client-side logs.

---

# 11. Testing Strategy

## 11.1 Unit testing

Test individual services and functions:

* Listing validation.
* Application eligibility.
* Application state transitions.
* Verification eligibility.
* Permission checks.
* Contact-sharing rules.
* Notification generation.
* Moderation state transitions.

## 11.2 Integration testing

Test the backend against a test PostgreSQL database.

Important scenarios:

* Registration and authentication.
* Tutor profile creation and updates.
* Listing creation and publication.
* Search and filtering.
* Application submission and duplicate prevention.
* Parent ownership checks.
* Verification decisions.
* Conversation access.
* Contact sharing and revocation behavior.
* Account suspension.
* Report submission and resolution.
* Data deletion workflows.

## 11.3 End-to-end testing

Use Playwright to test real browser workflows:

1. A tutor registers and creates a profile.
2. A parent publishes a listing.
3. The tutor discovers and applies to the listing.
4. The parent reviews the application.
5. The users establish contact through the approved workflow.
6. A verifier processes a verification request.
7. An unauthorized user is denied access to private data.
8. A user submits a report and an administrator processes it.

## 11.4 Security testing

Include tests for:

* Accessing another user's profile-editing endpoint.
* Viewing applicants for another parent's listing.
* Reading another conversation's messages.
* Downloading verification evidence without authorization.
* Forging application state transitions.
* Submitting duplicate applications concurrently.
* Bypassing frontend validation.
* Uploading disallowed files.
* Enumerating accounts through authentication responses.
* Abusing rate-limited endpoints.
* Accessing suspended accounts.

Security tests must verify backend behavior, not merely whether buttons are hidden.

## 11.5 Release gates

Do not deploy a release if:

* Critical authentication or authorization tests fail.
* Private information is exposed to unauthorized users.
* Database migrations fail in the test environment.
* Core tutor-parent workflows are broken.
* Required security checks fail.
* A deployment cannot be rolled back or recovered safely.

---

# 12. Deployment and Infrastructure

## 12.1 Environments

Maintain separate environments:

* Local development.
* Automated testing.
* Staging.
* Production.

Production user data must not be copied into development or staging without a justified, approved process and appropriate safeguards.

## 12.2 Initial deployment architecture

Use:

* A managed Next.js-compatible web host.
* A managed NestJS-compatible application host.
* Managed PostgreSQL.
* Private object storage.
* Managed email and optional SMS providers.
* Automated backups.
* Centralized application logs and error reporting.

Docker can standardize local development and deployment packaging, but Kubernetes is not necessary for the initial scale.

## 12.3 CI/CD pipeline

For each pull request:

1. Install dependencies using the lockfile.
2. Run formatting and lint checks.
3. Run TypeScript checks.
4. Run unit tests.
5. Run integration tests where infrastructure is available.
6. Build frontend and backend.
7. Run dependency and secret scanning.

For production deployment:

1. Build an immutable application artifact.
2. Back up or otherwise protect recoverable database state as appropriate.
3. Apply reviewed, backward-compatible database migrations.
4. Deploy the application.
5. Run health checks.
6. Verify critical workflows.
7. Roll back the application release if necessary.

Database rollback requires care: rolling back application code does not automatically reverse a schema migration safely.

## 12.4 Database backup and recovery

Define recovery objectives before production launch.

The initial operating policy should include:

* Automated database backups.
* Backup encryption and restricted access.
* A defined retention period.
* Periodic restore tests.
* Monitoring for backup failures.
* A documented recovery procedure.

A backup is not proven usable until restoration has been tested.

---

# 13. Observability and Operational Monitoring

Collect:

* API request counts and latency.
* Server error rates.
* Authentication failures.
* Database connection and query performance.
* Failed background tasks.
* Notification delivery failures.
* Verification queue size and processing time.
* Application and listing creation rates.
* File-upload errors.
* Moderation backlog.
* Suspicious activity indicators.

Use structured logs and correlation IDs to trace requests across the frontend, backend, and external services.

Never log passwords, authentication tokens, OTP codes, private identity documents, or unnecessary message contents.

Configure alerts for service outages, database issues, repeated authorization failures, and unusual error rates.

---

# 14. Performance and Scalability

Initial performance requirements should focus on a reliable experience for mobile users on typical Bangladeshi internet connections.

Recommended initial targets, to be validated through measurement:

* Public page LCP: 2.5 seconds or less at the 75th percentile.
* API read operations: p95 below 500 ms for ordinary indexed queries.
* API write operations: p95 below 800 ms for ordinary operations, excluding external provider delays.
* No unbounded listing or message queries.
* No unpaginated administrator tables.
* No unnecessary full-table scans for common search operations.

These are engineering targets, not guaranteed results.

### Scaling strategy

1. Start with indexed PostgreSQL queries and pagination.
2. Measure actual traffic and slow queries.
3. Optimize database access and caching where justified.
4. Add background jobs for expensive asynchronous work.
5. Add Redis or a dedicated search service only when the measured workload requires it.
6. Separate services only when independent scaling, security boundaries, or operational needs justify the added complexity.

---

# 15. Analytics and Mission Measurement

The system should measure product outcomes without unnecessarily collecting personal data.

Track events such as:

* `tutor_profile_completed`
* `verification_requested`
* `verification_approved`
* `listing_published`
* `listing_viewed`
* `application_submitted`
* `application_shortlisted`
* `contact_shared`
* `connection_confirmed`
* `listing_closed`

Do not include phone numbers, identity documents, exact home addresses, or private message bodies in analytics events.

A confirmed connection should require an explicit confirmation workflow or another clearly defined, privacy-respecting signal.

The analytics system must distinguish between an application being accepted and a tuition arrangement actually beginning.

---

# 16. Implementation Phases

## Phase 1 — Foundation

* Repository and development environment.
* Next.js and NestJS applications.
* PostgreSQL and Prisma.
* Authentication and authorization.
* CI checks and database migrations.
* Base UI, navigation, and localization foundations.

## Phase 2 — Core marketplace

* Tutor profile management.
* Parent listing management.
* Public search and filtering.
* Applications and state transitions.
* Listing expiry and closure.

## Phase 3 — Trust and communication

* Verification workflows.
* Private evidence storage.
* Contact requests or private messaging.
* Notifications.
* Reporting and moderation.
* Administrative dashboard.

## Phase 4 — Production readiness

* Security and privacy review.
* End-to-end tests.
* Performance checks.
* Backup restoration test.
* Monitoring and alerts.
* Staging deployment.
* Controlled pilot release.

## Phase 5 — Improvement

* Search quality improvements.
* Saved listings and alerts.
* Optional feedback.
* University verification partnerships.
* Evidence-based scaling and future monetization.

---

# 17. Definition of Technical Completion

The initial production release is technically complete when:

* All core user journeys work end to end.
* Database constraints protect against duplicate and inconsistent records.
* Authorization is enforced server-side.
* Verification documents are private.
* Contact sharing requires deliberate user action.
* Reporting and moderation are functional.
* Account deletion and retention workflows are documented and implemented.
* Automated tests cover critical business and security rules.
* Production deployment is repeatable.
* Database backups and recovery have been tested.
* Monitoring and error reporting are operational.
* API documentation is available.
* Privacy, verification, and safety policies are published.
* The product can run without requiring a placement fee, tuition payment integration, or paid account.

---

# 18. Final Technical Recommendation

Build the platform as a **TypeScript-based modular monolith with Next.js, NestJS, PostgreSQL, and Prisma**.

Prioritize relational integrity, clear authorization boundaries, private verification evidence, consent-based contact sharing, and a reliable tutor-parent application workflow.

Keep the infrastructure simple until real usage justifies additional complexity. The technical design should help the marketplace earn trust and facilitate genuine connections, not create barriers to using a free service.

The no-commission policy should be enforced through product design and business rules: there must be no hidden placement charge, mandatory paid introduction, or requirement to process tuition payments through the platform.
