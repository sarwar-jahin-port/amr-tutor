# Database Schema & Prisma Models

## Free Home Tuition Marketplace — Bangladesh

**Version:** 1.0
**Date:** 9 October 2026
**Database:** PostgreSQL
**ORM:** Prisma
**Language:** TypeScript
**Status:** Proposed MVP schema

---

## 1. Database Design Principles

The database must support the following core workflows:

1. User registration and role management.
2. Tutor academic profiles and teaching preferences.
3. Parent or guardian accounts.
4. University affiliation and academic credential verification.
5. Tuition listing creation, search, and management.
6. Applications and application status transitions.
7. Private conversations and consent-based contact sharing.
8. Notifications, reports, moderation, and audit logs.
9. Account deletion and data-retention workflows.

### Design rules

* Use UUID primary keys.
* Use PostgreSQL enums for stable status fields.
* Use foreign keys and unique constraints to protect relational integrity.
* Normalize subjects, curricula, and other reusable reference data.
* Keep identity documents in private object storage, not directly in PostgreSQL.
* Store only the storage key and necessary metadata for verification evidence.
* Never expose private database fields through public API responses.
* Enforce authorization and state transitions in NestJS services.
* Use database transactions for operations that change related records.

## 2. Entity Relationship Overview

```text
User
 ├── UserRole
 ├── TutorProfile
 │    ├── TutorSubject
 │    ├── TutorGrade
 │    ├── TutorCurriculum
 │    ├── TutorLocation
 │    ├── TutorAvailability
 │    ├── VerificationRequest
 │    │    └── VerificationEvidence
 │    └── Application
 │         └── Conversation
 │              ├── ConversationParticipant
 │              └── Message
 │
 ├── GuardianProfile
 ├── TuitionListing
 │    ├── ListingSubject
 │    ├── ListingUniversityPreference
 │    ├── ListingSchedule
 │    └── Application
 │
 ├── ContactShare
 ├── Report
 ├── Notification
 ├── ConsentRecord
 └── AuditLog

Reference data:
University, Subject, Curriculum
```

The diagram is conceptual. The Prisma models below define the actual relationships.

---

## 3. Prisma Project Setup

Suggested location:

`apps/api/prisma/schema.prisma`

### Initial configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This uses the conventional Prisma Client generator and datasource configuration. If the project uses a Prisma version with a different configuration convention, adapt the configuration to that installed version.

Example environment variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tuition_marketplace?schema=public"
```

Keep credentials in environment variables or a secrets manager. Never commit production credentials.

## 4. Enums

Add the following enums to `schema.prisma`.

```prisma
enum Role {
  TUTOR
  PARENT
  VERIFIER
  MODERATOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_DELETION
  DELETED
}

enum AcademicStatus {
  CURRENT_STUDENT
  GRADUATED
  OTHER
}

enum TeachingMode {
  HOME
  ONLINE
  BOTH
}

enum ListingStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  PAUSED
  FILLED
  CLOSED
  REJECTED
  EXPIRED
}

enum ApplicationStatus {
  SUBMITTED
  VIEWED
  SHORTLISTED
  CONTACT_REQUESTED
  ACCEPTED
  DECLINED
  WITHDRAWN
  CLOSED
}

enum VerificationType {
  UNIVERSITY_AFFILIATION
  ACADEMIC_CREDENTIAL
}

enum VerificationStatus {
  PENDING
  IN_REVIEW
  NEEDS_INFORMATION
  APPROVED
  REJECTED
  CANCELLED
}

enum EvidenceType {
  STUDENT_ID
  UNIVERSITY_DOCUMENT
  ACADEMIC_TRANSCRIPT
  OTHER
}

enum Weekday {
  SATURDAY
  SUNDAY
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
  RESTRICTED
}

enum ReportCategory {
  FAKE_IDENTITY
  FALSE_CREDENTIALS
  MISLEADING_LISTING
  HARASSMENT
  SCAM
  PRIVACY_VIOLATION
  SPAM
  UNSAFE_BEHAVIOR
  OTHER
}

enum ReportStatus {
  OPEN
  UNDER_REVIEW
  ACTION_TAKEN
  DISMISSED
}

enum NotificationType {
  APPLICATION_RECEIVED
  APPLICATION_UPDATED
  CONTACT_REQUESTED
  MESSAGE_RECEIVED
  VERIFICATION_UPDATED
  LISTING_UPDATED
  SECURITY_ALERT
  REPORT_UPDATED
  SYSTEM
}

enum ConsentType {
  TERMS_OF_SERVICE
  PRIVACY_POLICY
  CONTACT_SHARING
  MARKETING
}
```

---

## 5. Core Identity Models

### 5.1 User

Represents the account and authentication identity.

```prisma
model User {
  id           String     @id @default(uuid()) @db.Uuid
  email        String?    @unique
  phone        String?    @unique
  passwordHash String?
  status       UserStatus @default(ACTIVE)

  emailVerifiedAt DateTime?
  phoneVerifiedAt DateTime?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  roles UserRole[]

  tutorProfile    TutorProfile?
  guardianProfile GuardianProfile?

  ownedListings TuitionListing[] @relation("ListingOwner")

  assignedVerifications VerificationRequest[] @relation("AssignedVerifier")

  messages Message[] @relation("MessageSender")
  conversationParticipants ConversationParticipant[]

  contactSharesGiven     ContactShare[] @relation("ContactSharer")
  contactSharesReceived  ContactShare[] @relation("ContactRecipient")

  reportsFiled    Report[] @relation("ReportReporter")
  reportsAgainst  Report[] @relation("ReportTargetUser")
  assignedReports Report[] @relation("ReportAssignee")

  notifications Notification[]
  consents      ConsentRecord[]

  auditLogs AuditLog[] @relation("AuditActor")

  @@index([status])
  @@index([createdAt])
}
```

**Rules**

* At least one permitted authentication method must be configured.
* Validate normalized email addresses and phone numbers in the application.
* Do not allow deleted or suspended users to perform restricted actions.
* If a user can have multiple roles, use the `UserRole` model.
* A `passwordHash` is nullable to support alternative authentication methods.

### 5.2 UserRole

```prisma
model UserRole {
  userId String @db.Uuid
  role   Role

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  createdAt DateTime @default(now())

  @@id([userId, role])
  @@index([role])
}
```

A user may have both tutor and parent roles if the product permits it. Administrative roles must only be granted through an authorized administrative process.

### 5.3 GuardianProfile

```prisma
model GuardianProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @db.Uuid
  displayName String
  language    String?  @default("bn")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )
}
```

A parent may publish listings using their authenticated account. The guardian profile is not a public directory entry.

---

## 6. Academic Reference Models

### 6.1 University

```prisma
model University {
  id             String   @id @default(uuid()) @db.Uuid
  name           String
  normalizedName String   @unique
  isActive       Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tutorProfiles       TutorProfile[]
  listingPreferences ListingUniversityPreference[]

  @@index([isActive])
}
```

`normalizedName` should be generated consistently by the backend to prevent duplicate institution records caused by differences in capitalization or whitespace.

### 6.2 Subject

```prisma
model Subject {
  id             String   @id @default(uuid()) @db.Uuid
  name           String
  normalizedName String   @unique
  isActive       Boolean  @default(true)

  tutorSubjects   TutorSubject[]
  listingSubjects ListingSubject[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Examples include Mathematics, Physics, Chemistry, English, and Biology.

Avoid using arbitrary free-text subjects as the primary search mechanism. Allow administrators to manage the subject directory.

### 6.3 Curriculum

```prisma
model Curriculum {
  id             String   @id @default(uuid()) @db.Uuid
  name           String
  normalizedName String   @unique
  isActive       Boolean  @default(true)

  tutorCurricula TutorCurriculum[]
  listings       TuitionListing[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Examples may include the Bangladesh national curriculum, English-medium curricula, and other supported curricula. The directory should be extensible rather than hardcoding a fixed list in application code.

---

## 7. Tutor Profile Models

### 7.1 TutorProfile

```prisma
model TutorProfile {
  id           String         @id @default(uuid()) @db.Uuid
  userId       String         @unique @db.Uuid
  universityId String         @db.Uuid

  fullName       String
  department     String
  degreeProgram  String
  academicStatus AcademicStatus
  academicYear   String?

  introduction  String? @db.Text
  profilePhotoKey String?

  preferredFeeMin Int?
  preferredFeeMax Int?
  feeCurrency     String @default("BDT")

  isAvailable Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  university University @relation(
    fields: [universityId],
    references: [id],
    onDelete: Restrict
  )

  subjects      TutorSubject[]
  grades        TutorGrade[]
  curricula     TutorCurriculum[]
  locations     TutorLocation[]
  availability  TutorAvailability[]

  verificationRequests VerificationRequest[]
  applications         Application[]

  @@index([universityId])
  @@index([isAvailable])
  @@index([academicStatus])
}
```

The API must validate that fee values are non-negative and that `preferredFeeMin` does not exceed `preferredFeeMax` when both are supplied.

### 7.2 TutorSubject

```prisma
model TutorSubject {
  tutorProfileId String @db.Uuid
  subjectId      String @db.Uuid

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Cascade
  )

  subject Subject @relation(
    fields: [subjectId],
    references: [id],
    onDelete: Restrict
  )

  @@id([tutorProfileId, subjectId])
  @@index([subjectId])
}
```

### 7.3 TutorGrade

```prisma
model TutorGrade {
  id             String @id @default(uuid()) @db.Uuid
  tutorProfileId String @db.Uuid
  gradeLevel     String

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([tutorProfileId, gradeLevel])
  @@index([gradeLevel])
}
```

Use normalized grade values, such as `CLASS_6`, `CLASS_7`, `CLASS_8`, or a consistently defined equivalent.

### 7.4 TutorCurriculum

```prisma
model TutorCurriculum {
  tutorProfileId String @db.Uuid
  curriculumId   String @db.Uuid

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Cascade
  )

  curriculum Curriculum @relation(
    fields: [curriculumId],
    references: [id],
    onDelete: Restrict
  )

  @@id([tutorProfileId, curriculumId])
  @@index([curriculumId])
}
```

### 7.5 TutorLocation

```prisma
model TutorLocation {
  id             String @id @default(uuid()) @db.Uuid
  tutorProfileId String @db.Uuid

  city       String
  area       String
  neighborhood String?

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Cascade
  )

  @@index([city, area])
  @@index([tutorProfileId])
}
```

Store general teaching areas, not a tutor's residential address.

### 7.6 TutorAvailability

```prisma
model TutorAvailability {
  id             String  @id @default(uuid()) @db.Uuid
  tutorProfileId String  @db.Uuid
  day            Weekday

  startMinute Int
  endMinute   Int

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Cascade
  )

  @@index([tutorProfileId, day])
}
```

Store local time as minutes after midnight. For example, 6:30 PM is `1110` and 8:00 PM is `1200`.

Validate that start time is earlier than end time and both values fall between `0` and `1439`. Add explicit handling if overnight availability is ever supported.

---

## 8. Verification Models

### 8.1 VerificationRequest

```prisma
model VerificationRequest {
  id             String             @id @default(uuid()) @db.Uuid
  tutorProfileId String             @db.Uuid

  type   VerificationType
  status VerificationStatus @default(PENDING)

  assignedVerifierId String? @db.Uuid

  decisionReason String? @db.Text
  submittedAt    DateTime  @default(now())
  reviewedAt     DateTime?
  expiresAt      DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Restrict
  )

  assignedVerifier User? @relation(
    "AssignedVerifier",
    fields: [assignedVerifierId],
    references: [id],
    onDelete: SetNull
  )

  evidence VerificationEvidence[]

  @@index([status, createdAt])
  @@index([tutorProfileId, type])
  @@index([assignedVerifierId, status])
}
```

### 8.2 VerificationEvidence

```prisma
model VerificationEvidence {
  id                   String      @id @default(uuid()) @db.Uuid
  verificationRequestId String      @db.Uuid

  type EvidenceType

  storageKey String
  originalFileName String?
  mimeType   String
  sizeBytes  Int

  uploadedAt DateTime @default(now())
  deletedAt  DateTime?

  verificationRequest VerificationRequest @relation(
    fields: [verificationRequestId],
    references: [id],
    onDelete: Cascade
  )

  @@index([verificationRequestId])
}
```

**Security requirements**

* `storageKey` must reference a private object-storage location.
* Do not return the storage key or permanent file URL to public clients.
* Generate short-lived access URLs only after authorization.
* Validate file size, actual content type, and permitted file formats.
* Delete unnecessary identity documents according to the retention policy.
* Keep verification results distinct from the underlying evidence.
* Ensure a reviewer is authorized to process the assigned request before making a decision.

The backend should also prevent unauthorized users from approving their own verification requests.

---

## 9. Tuition Listing Models

### 9.1 TuitionListing

```prisma
model TuitionListing {
  id           String @id @default(uuid()) @db.Uuid
  parentUserId String @db.Uuid

  title       String
  description String? @db.Text

  classLevel String
  curriculumId String? @db.Uuid

  city             String
  area             String
  neighborhood     String?
  locationDescription String? @db.Text

  salaryMin  Int?
  salaryMax  Int?
  currency   String @default("BDT")

  daysPerWeek   Int
  preferredGender String?
  teachingMode  TeachingMode @default(HOME)

  startDate DateTime?
  publishedAt DateTime?
  expiresAt DateTime?
  closedAt DateTime?

  status ListingStatus @default(DRAFT)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parentUser User @relation(
    "ListingOwner",
    fields: [parentUserId],
    references: [id],
    onDelete: Restrict
  )

  curriculum Curriculum? @relation(
    fields: [curriculumId],
    references: [id],
    onDelete: Restrict
  )

  subjects              ListingSubject[]
  universityPreferences ListingUniversityPreference[]
  schedules             ListingSchedule[]

  applications Application[]
  reports      Report[]

  @@index([status, publishedAt])
  @@index([parentUserId, status])
  @@index([city, area, status])
  @@index([classLevel, status])
  @@index([curriculumId])
  @@index([expiresAt])
}
```

**Validation requirements**

* `daysPerWeek` must be between `1` and `7`.
* Salary values must be non-negative.
* If both salary values exist, the minimum must not exceed the maximum.
* A listing must meet the required fields before publication.
* Only authorized users can edit or close a listing.
* Expired or closed listings must not accept new applications.
* Public listings must not include a family's exact home address or private phone number.

The `preferredGender` field should use a controlled set of supported values rather than accepting arbitrary text. This field is a preference, not an identity-verification claim.

### 9.2 ListingSubject

```prisma
model ListingSubject {
  listingId String @db.Uuid
  subjectId String @db.Uuid

  listing TuitionListing @relation(
    fields: [listingId],
    references: [id],
    onDelete: Cascade
  )

  subject Subject @relation(
    fields: [subjectId],
    references: [id],
    onDelete: Restrict
  )

  @@id([listingId, subjectId])
  @@index([subjectId])
}
```

### 9.3 ListingUniversityPreference

```prisma
model ListingUniversityPreference {
  listingId   String @db.Uuid
  universityId String @db.Uuid

  listing TuitionListing @relation(
    fields: [listingId],
    references: [id],
    onDelete: Cascade
  )

  university University @relation(
    fields: [universityId],
    references: [id],
    onDelete: Restrict
  )

  @@id([listingId, universityId])
  @@index([universityId])
}
```

This supports listings such as "prefer a student from the University of Chittagong" without storing the preference as arbitrary text.

### 9.4 ListingSchedule

```prisma
model ListingSchedule {
  id        String  @id @default(uuid()) @db.Uuid
  listingId String  @db.Uuid
  day       Weekday

  startMinute Int?
  endMinute   Int?

  listing TuitionListing @relation(
    fields: [listingId],
    references: [id],
    onDelete: Cascade
  )

  @@index([listingId, day])
}
```

If exact times are supplied, validate both values and ensure the start time is earlier than the end time. Both may be null when the parent has not specified a time for that day.

---

## 10. Application Model

### Application

```prisma
model Application {
  id             String @id @default(uuid()) @db.Uuid
  listingId      String @db.Uuid
  tutorProfileId String @db.Uuid

  introduction String? @db.Text
  status       ApplicationStatus @default(SUBMITTED)

  submittedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt

  listing TuitionListing @relation(
    fields: [listingId],
    references: [id],
    onDelete: Restrict
  )

  tutorProfile TutorProfile @relation(
    fields: [tutorProfileId],
    references: [id],
    onDelete: Restrict
  )

  conversation Conversation?
  contactShares ContactShare[]
  reports       Report[]

  @@unique([listingId, tutorProfileId])
  @@index([tutorProfileId, status])
  @@index([listingId, status, submittedAt])
}
```

The unique constraint ensures a tutor cannot submit duplicate applications to the same listing.

The application service must enforce role, listing status, ownership, account status, and allowed state transitions.

---

## 11. Messaging Models

### 11.1 Conversation

```prisma
model Conversation {
  id            String @id @default(uuid()) @db.Uuid
  applicationId String @unique @db.Uuid

  status ConversationStatus @default(ACTIVE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  application Application @relation(
    fields: [applicationId],
    references: [id],
    onDelete: Restrict
  )

  participants ConversationParticipant[]
  messages     Message[]

  @@index([status, updatedAt])
}
```

The MVP can create one conversation per application, but only when the approved application workflow permits contact.

### 11.2 ConversationParticipant

```prisma
model ConversationParticipant {
  id             String @id @default(uuid()) @db.Uuid
  conversationId String @db.Uuid
  userId         String @db.Uuid

  joinedAt   DateTime @default(now())
  lastReadAt DateTime?

  conversation Conversation @relation(
    fields: [conversationId],
    references: [id],
    onDelete: Cascade
  )

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Restrict
  )

  @@unique([conversationId, userId])
  @@index([userId, joinedAt])
}
```

The backend must ensure that only the actual tutor and listing owner can become participants, unless a documented moderation workflow grants narrowly scoped access.

### 11.3 Message

```prisma
model Message {
  id             String @id @default(uuid()) @db.Uuid
  conversationId String @db.Uuid
  senderUserId   String @db.Uuid

  body String @db.Text

  createdAt DateTime @default(now())
  editedAt  DateTime?
  deletedAt DateTime?

  conversation Conversation @relation(
    fields: [conversationId],
    references: [id],
    onDelete: Cascade
  )

  sender User @relation(
    "MessageSender",
    fields: [senderUserId],
    references: [id],
    onDelete: Restrict
  )

  @@index([conversationId, createdAt])
  @@index([senderUserId, createdAt])
}
```

Before creating a message, verify that the sender is an authorized participant and the conversation is active.

Use pagination for message retrieval. Do not return an entire conversation history in a single request.

---

## 12. Contact-Sharing Model

### ContactShare

```prisma
model ContactShare {
  id              String @id @default(uuid()) @db.Uuid
  applicationId   String @db.Uuid
  sharedByUserId  String @db.Uuid
  recipientUserId String @db.Uuid

  sharedFields Json

  consentedAt DateTime @default(now())
  revokedAt   DateTime?

  application Application @relation(
    fields: [applicationId],
    references: [id],
    onDelete: Restrict
  )

  sharedBy User @relation(
    "ContactSharer",
    fields: [sharedByUserId],
    references: [id],
    onDelete: Restrict
  )

  recipient User @relation(
    "ContactRecipient",
    fields: [recipientUserId],
    references: [id],
    onDelete: Restrict
  )

  @@index([applicationId, consentedAt])
  @@index([recipientUserId, revokedAt])
}
```

`sharedFields` records which contact categories were consented to, such as `PHONE`. It must not itself contain phone numbers or other private contact values.

The backend must verify that both users are associated with the same application and that the recipient is authorized to receive the selected information.

Revoking sharing must prevent future platform-mediated access where possible. It cannot undo information the recipient has already seen or copied.

---

## 13. Reports and Moderation

### Report

```prisma
model Report {
  id             String @id @default(uuid()) @db.Uuid
  reporterUserId String @db.Uuid

  targetUserId  String? @db.Uuid
  listingId     String? @db.Uuid
  applicationId String? @db.Uuid

  category    ReportCategory
  description String? @db.Text
  status      ReportStatus @default(OPEN)

  assignedModeratorId String? @db.Uuid
  resolution           String? @db.Text

  createdAt  DateTime @default(now())
  resolvedAt DateTime?

  reporter User @relation(
    "ReportReporter",
    fields: [reporterUserId],
    references: [id],
    onDelete: Restrict
  )

  targetUser User? @relation(
    "ReportTargetUser",
    fields: [targetUserId],
    references: [id],
    onDelete: SetNull
  )

  listing TuitionListing? @relation(
    fields: [listingId],
    references: [id],
    onDelete: SetNull
  )

  application Application? @relation(
    fields: [applicationId],
    references: [id],
    onDelete: SetNull
  )

  assignedModerator User? @relation(
    "ReportAssignee",
    fields: [assignedModeratorId],
    references: [id],
    onDelete: SetNull
  )

  @@index([status, createdAt])
  @@index([assignedModeratorId, status])
  @@index([targetUserId])
}
```

The service must validate that a report references at least one valid target and that the reporter is authorized to report the selected resource.

Avoid storing unnecessary sensitive evidence in free-text descriptions. If evidence uploads are supported, implement a separate private evidence model with controlled access and retention.

---

## 14. Notification Model

### Notification

```prisma
model Notification {
  id     String @id @default(uuid()) @db.Uuid
  userId String @db.Uuid

  type    NotificationType
  payload Json?

  readAt DateTime?
  createdAt DateTime @default(now())

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  @@index([userId, readAt, createdAt])
}
```

Notification payloads should contain only the information required to render the notification. Resolve protected resources through authorized API calls rather than embedding private data.

For example, an application notification can contain the application ID and event type without including the tutor's phone number.

---

## 15. Consent and Audit Models

### 15.1 ConsentRecord

```prisma
model ConsentRecord {
  id String @id @default(uuid()) @db.Uuid

  userId        String @db.Uuid
  type          ConsentType
  policyVersion String

  acceptedAt DateTime @default(now())
  revokedAt  DateTime?

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Restrict
  )

  @@index([userId, type, acceptedAt])
}
```

Record consent to the relevant policy version and its subsequent withdrawal where applicable.

Do not use one generic acceptance flag as a substitute for distinct consent requirements. In particular, contact-sharing consent must be recorded against the actual contact-sharing event.

### 15.2 AuditLog

```prisma
model AuditLog {
  id String @id @default(uuid()) @db.Uuid

  actorUserId String? @db.Uuid
  action      String
  targetType  String
  targetId    String?
  outcome     String
  metadata    Json?

  createdAt DateTime @default(now())

  actor User? @relation(
    "AuditActor",
    fields: [actorUserId],
    references: [id],
    onDelete: SetNull
  )

  @@index([actorUserId, createdAt])
  @@index([targetType, targetId, createdAt])
  @@index([action, createdAt])
}
```

Audit sensitive actions such as:

* Verification approvals and rejections.
* Administrative account restrictions.
* Moderation decisions.
* Access to private evidence, where audit logging is appropriate.
* Changes to account roles.
* Data deletion requests and their completion.

Do not record passwords, OTP codes, session tokens, complete identity documents, or unnecessary message contents in audit metadata.

---

# 16. Important Database Constraints

Prisma schema declarations cannot express every business rule directly. Enforce these rules in backend services and, where appropriate, PostgreSQL constraints.

| Rule                                            | Enforcement                                                  |
| ----------------------------------------------- | ------------------------------------------------------------ |
| One tutor profile per user                      | Unique `TutorProfile.userId`                                 |
| One guardian profile per user                   | Unique `GuardianProfile.userId`                              |
| No duplicate application to a listing           | Unique `[listingId, tutorProfileId]`                         |
| No duplicate role assignment                    | Composite primary key on `UserRole`                          |
| No duplicate subject assignment                 | Composite primary keys                                       |
| No invalid salary range                         | Backend validation and database constraint where appropriate |
| Valid schedule times                            | Backend validation and database constraints                  |
| At least one report target                      | Backend validation and optional database check constraint    |
| Only listing owners can manage their listings   | Backend authorization                                        |
| Only authorized users can view private evidence | Backend authorization and private storage                    |
| Only participants can read messages             | Backend authorization                                        |
| Only approved state transitions are permitted   | Application service                                          |
| Only authorized verifiers can decide requests   | Backend authorization                                        |
| No applications to closed listings              | Transaction-safe application service                         |

For critical invariants, use database constraints as a second layer of defense. A TypeScript validation function alone is not enough to protect against concurrent requests or other write paths.

---

# 17. Indexing and Search Strategy

Start with PostgreSQL's ordinary B-tree indexes for the main access patterns.

The initial listing search should support:

* Listing status.
* City and area.
* Class level.
* Subject.
* Curriculum.
* Preferred university.
* Publication date.
* Salary range.

Some filters involve related tables, so they cannot all be satisfied by a single index on `TuitionListing`.

Use Prisma query filters and relational joins initially. Measure slow queries with realistic sample data before adding advanced indexes.

Consider PostgreSQL full-text search later if searching listing descriptions becomes important. Do not introduce a dedicated search engine until the requirements justify it.

---

# 18. Database Migration Workflow

After the schema has been implemented in the repository, use this workflow for local development.

### Step 1: Install dependencies

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

### Step 2: Create the initial migration

```bash
pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

### Step 3: Inspect the database

Use Prisma Studio locally:

```bash
pnpm exec prisma studio
```

Review the generated tables, relationships, constraints, and sample records.

### Step 4: Test the migration

* Run migrations against a clean test database.
* Verify all foreign keys and unique constraints.
* Test deletion behavior.
* Test duplicate applications.
* Test concurrent application submissions.
* Verify that private data is not exposed through API serialization.
* Confirm that migrations can be applied from a clean checkout.

### Step 5: Production deployment

Use reviewed migrations in production:

```bash
pnpm exec prisma migrate deploy
```

Do not use `prisma migrate dev` against production. Do not use `prisma db push` as the production migration strategy.

Commit migration files to version control.

---

# 19. Seed Data

Create a development seed script for reference data:

* Universities.
* Subjects.
* Curricula.
* Any controlled lists required by the application.

Example initial subjects:

* Mathematics.
* English.
* Physics.
* Chemistry.
* Biology.
* Bangla.
* ICT.

The university directory should include the institutions needed for the pilot and be maintainable through the admin interface.

Do not create fake verified tutors or fictitious tuition listings in production. Development fixtures must be clearly identified as test data.

---

# 20. Data Retention and Account Deletion

Implement deletion as a workflow, not merely a `deletedAt` update.

The workflow should:

1. Verify the account owner's request.
2. Restrict account access where appropriate.
3. Determine which data must be deleted and which records must be retained for a defined legal or operational purpose.
4. Remove unnecessary identity documents from private storage.
5. Delete or anonymize eligible profile and personal data.
6. Handle related messages, reports, and audit records according to the approved retention policy.
7. Record completion without retaining unnecessary personal information.
8. Apply the same retention rules to backups and derived data as they expire.

The use of `onDelete: Restrict` on certain relationships is intentional: it prevents accidental cascading deletion of records that may require a controlled retention or cleanup process.

---

# 21. Required Tests Before Production

At minimum, automated tests must verify:

* A user cannot create multiple tutor profiles.
* A tutor cannot apply twice to the same listing.
* A tutor cannot apply to their own listing.
* A suspended account cannot perform restricted actions.
* A parent cannot view another parent's private applicant data.
* A tutor cannot modify another tutor's profile.
* An unassigned verifier cannot review a restricted verification request.
* A user cannot download another user's identity documents.
* A non-participant cannot read a conversation.
* A user cannot share contact information on behalf of another user.
* An application cannot be submitted to a closed listing.
* Invalid application state transitions are rejected.
* Reports cannot be submitted without a valid target.
* Unauthorized users cannot access administrator endpoints.
* Deletion workflows handle related data safely.

Tests must run against a test database with production-like constraints enabled.

---

# 22. Final Implementation Checklist

* [ ] Create the NestJS Prisma module.
* [ ] Add the complete schema to `schema.prisma`.
* [ ] Format and validate the schema against the selected Prisma version.
* [ ] Generate the initial PostgreSQL migration.
* [ ] Review the generated SQL.
* [ ] Add reference-data seed scripts.
* [ ] Create service-level validation for cross-field rules.
* [ ] Implement role-based and resource-level authorization.
* [ ] Implement private verification file storage.
* [ ] Implement application state transitions.
* [ ] Implement contact-sharing consent.
* [ ] Implement audit logging.
* [ ] Add database integration tests.
* [ ] Add API security tests.
* [ ] Verify account deletion and retention behavior.
* [ ] Document the production migration and recovery process.

## Final Recommendation

Use this schema as the initial data model for the free tuition marketplace, but do not treat the first draft as automatically production-ready.

The most important implementation priorities are:

1. Correct tutor-parent relationships and application state transitions.
2. Strict access controls around university verification evidence.
3. Privacy-preserving contact sharing.
4. Database constraints against duplicate and inconsistent records.
5. Safe account deletion and documented data retention.

These foundations will let you launch the core marketplace without introducing unnecessary infrastructure or monetization complexity.
