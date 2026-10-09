# API Specification — Free Home Tuition Marketplace

Version: 1.0 Backend: NestJS + PostgreSQL + Prisma API style: REST, JSON, versioned under `/api/v1` Authentication: Access token + refresh-token flow Core principle: The platform connects parents and tutors without collecting tuition payments or charging commissions.

This specification follows the database design from the previous document. It defines endpoints, request/response DTOs, validation rules, authorization, and important business rules. Private contact information and student ID evidence must remain protected even when a user has a public profile.

## 1. API conventions

### Base URL and response format

Example successful response:

JSON

```
{
  "data": {
    "id": "uuid",
    "status": "ACTIVE"
  }
}
```

Example validation error:

JSON

```
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "messages": ["email must be a valid email address"]
    }
  ],
  "timestamp": "2026-10-09T08:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

Use consistent HTTP status codes:

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `200`  | Successful read or update                  |
| `201`  | Resource created                           |
| `204`  | Successful operation with no response body |
| `400`  | Invalid input or invalid state transition  |
| `401`  | Missing or invalid authentication          |
| `403`  | Authenticated but not authorized           |
| `404`  | Resource not found or intentionally hidden |
| `409`  | Duplicate application or conflicting state |
| `429`  | Rate limit exceeded                        |

### Global validation

Configure NestJS `ValidationPipe` with:

* `whitelist: true`

* `forbidNonWhitelisted: true`

* `transform: true`

* Reject invalid DTOs instead of silently accepting unexpected fields.

* Use UUID validation for resource IDs.

* Normalize emails to lowercase and trim strings where appropriate.

* Never accept `userId`, `role`, `isVerified`, `status`, or other privileged fields from a normal user when the server should determine them.

## 2. Authentication and account endpoints

| Method   | Endpoint                | Access        | Purpose                      |
| -------- | ----------------------- | ------------- | ---------------------------- |
| `POST`   | `/auth/register`        | Public        | Create account               |
| `POST`   | `/auth/login`           | Public        | Sign in                      |
| `POST`   | `/auth/refresh`         | Refresh token | Refresh access token         |
| `POST`   | `/auth/logout`          | Authenticated | Revoke refresh session       |
| `GET`    | `/auth/me`              | Authenticated | Get current account          |
| `PATCH`  | `/users/me`             | Authenticated | Update basic account details |
| `POST`   | `/users/me/roles`       | Authenticated | Add an allowed account role  |
| `DELETE` | `/users/me/roles/:role` | Authenticated | Remove a role if safe        |

### `POST /auth/register`

Request DTO:

JSON

```
{
  "fullName": "Rahim Ahmed",
  "email": "rahim@example.com",
  "phone": "01712345678",
  "password": "StrongPassword123!",
  "roles": ["TUTOR"]
}
```

Validation:

* `fullName`: required, trimmed, 2–100 characters.

* `email`: valid email, normalized to lowercase, unique.

* `phone`: optional; validate using Bangladesh phone rules if supplied.

* `password`: required, 8–128 characters; use a modern password hash such as Argon2id or bcrypt.

* `roles`: one or more allowed roles, such as `TUTOR` or `GUARDIAN`. Never permit users to self-assign `ADMIN`.

* Do not accept verification status or account status from the client.

Response (`201`):

JSON

```
{
  "data": {
    "id": "user-uuid",
    "fullName": "Rahim Ahmed",
    "email": "rahim@example.com",
    "roles": ["TUTOR"],
    "status": "ACTIVE"
  }
}
```

Never return the password hash, refresh token, private verification evidence, or guardian-only contact details in this response.

### `POST /auth/login`

Request:

JSON

```
{
  "email": "rahim@example.com",
  "password": "StrongPassword123!"
}
```

Response:

JSON

```
{
  "data": {
    "accessToken": "short-lived-access-token",
    "expiresIn": 900,
    "user": {
      "id": "user-uuid",
      "fullName": "Rahim Ahmed",
      "roles": ["TUTOR"]
    }
  }
}
```

Prefer an `HttpOnly`, `Secure`, appropriately `SameSite` refresh-token cookie for browser clients. Do not put long-lived refresh tokens in local storage. For mobile clients, use secure platform storage.

### Account role rules

* One user may have both tutor and guardian roles.

* Role assignment is server-controlled and limited to permitted roles.

* A tutor role does not automatically mean a tutor profile exists; profile setup may still be required.

* Removing a role must not silently delete applications, listings, or conversation history.

## 3. Reference data endpoints

Reference data should be available before users create profiles or tuition listings.

| Method | Endpoint                   | Purpose                                                       |
| ------ | -------------------------- | ------------------------------------------------------------- |
| `GET`  | `/references/universities` | List universities                                             |
| `GET`  | `/references/subjects`     | List subjects                                                 |
| `GET`  | `/references/curricula`    | List curricula, such as national curriculum or English medium |
| `GET`  | `/references/grades`       | List supported classes/grades                                 |
| `GET`  | `/references/locations`    | List supported areas and location hierarchy                   |

Example:

`GET /references/subjects?search=math&page=1&limit=20`

Response:

JSON

```
{
  "data": [
    {
      "id": "subject-uuid",
      "name": "Mathematics"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Validation: `page` must be an integer of at least `1`; `limit` must be an integer between `1` and `100`; search strings must be trimmed and length-limited.

Only administrators can create, update, deactivate, or delete reference records.

## 4. Tutor profile endpoints

| Method  | Endpoint                  | Access                   |
| ------- | ------------------------- | ------------------------ |
| `POST`  | `/tutors/me/profile`      | Tutor                    |
| `GET`   | `/tutors/me/profile`      | Own profile              |
| `PATCH` | `/tutors/me/profile`      | Own profile              |
| `PUT`   | `/tutors/me/subjects`     | Tutor                    |
| `PUT`   | `/tutors/me/grades`       | Tutor                    |
| `PUT`   | `/tutors/me/curricula`    | Tutor                    |
| `PUT`   | `/tutors/me/locations`    | Tutor                    |
| `PUT`   | `/tutors/me/availability` | Tutor                    |
| `GET`   | `/tutors/:id`             | Public, safe fields only |
| `GET`   | `/tutors`                 | Public tutor search      |

### `POST /tutors/me/profile`

Request DTO:

JSON

```
{
  "universityId": "university-uuid",
  "department": "Computer Science",
  "academicStatus": "UNDERGRADUATE",
  "studyYear": 3,
  "bio": "I teach mathematics and science.",
  "experienceMonths": 12,
  "teachingMode": "IN_PERSON",
  "expectedMinRate": 300,
  "expectedMaxRate": 600
}
```

Validation:

* `universityId`: optional valid UUID referencing an active university.

* `department`: optional, maximum 100 characters.

* `academicStatus`: allowed enum value only.

* `studyYear`: optional integer in the supported range, e.g. 1–10.

* `bio`: optional, maximum 1,000 characters; sanitize output when rendering.

* `experienceMonths`: integer from `0` to `600`.

* `teachingMode`: a defined enum, not arbitrary text.

* Rates: non-negative integers; minimum cannot exceed maximum.

* `isVerified`, `verificationStatus`, and user IDs are server-controlled.

Response (`201`):

JSON

```
{
  "data": {
    "id": "tutor-profile-uuid",
    "academicStatus": "UNDERGRADUATE",
    "experienceMonths": 12,
    "teachingMode": "IN_PERSON",
    "expectedMinRate": 300,
    "expectedMaxRate": 600,
    "verificationStatus": "NOT_VERIFIED"
  }
}
```

### Subject, grade, curriculum and location DTOs

For each `PUT` endpoint, accept a complete replacement list, validate every reference ID, remove duplicates, and apply the update in a transaction.

Example `PUT /tutors/me/subjects`:

JSON

```
{
  "subjectIds": [
    "subject-uuid-1",
    "subject-uuid-2"
  ]
}
```

Validation: arrays must have a reasonable maximum length, such as 30; every ID must be a UUID and refer to an active record. Invalid IDs should reject the entire request rather than partially update it.

For availability:

JSON

```
{
  "slots": [
    {
      "weekday": "SATURDAY",
      "startTime": "09:00",
      "endTime": "12:00"
    }
  ]
}
```

Validate `weekday` against the enum, times against strict `HH:mm` format, and require `startTime` to be earlier than `endTime`. Document that times use Bangladesh Standard Time unless the product later supports multiple time zones.

### `GET /tutors` search parameters

```
GET /tutors?subjectId=uuid&universityId=uuid&areaId=uuid&academicStatus=UNDERGRADUATE&page=1&limit=20
```

Supported filters should include subject, class/grade, curriculum, university, area, academic status, teaching mode, and optionally expected rate range.

Response should contain only public fields:

JSON

```
{
  "data": [
    {
      "id": "tutor-profile-uuid",
      "displayName": "Rahim Ahmed",
      "university": {
        "id": "university-uuid",
        "name": "Example University"
      },
      "subjects": [
        {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      ],
      "experienceMonths": 12,
      "verificationStatus": "VERIFIED"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Never expose student ID numbers, ID-card images, guardian emergency contacts, private phone numbers, email addresses, or internal moderation notes in public tutor search.

## 5. Tuition listing endpoints

| Method  | Endpoint                | Access                   |
| ------- | ----------------------- | ------------------------ |
| `POST`  | `/listings`             | Guardian                 |
| `GET`   | `/listings`             | Public                   |
| `GET`   | `/listings/:id`         | Public, safe fields only |
| `PATCH` | `/listings/:id`         | Listing owner            |
| `POST`  | `/listings/:id/publish` | Listing owner            |
| `POST`  | `/listings/:id/close`   | Listing owner            |
| `GET`   | `/users/me/listings`    | Listing owner            |

### `POST /listings`

Request DTO:

JSON

```
{
  "title": "Mathematics tutor for Class 9",
  "description": "Looking for a tutor for weekly mathematics lessons.",
  "areaId": "area-uuid",
  "locationDescription": "Near the main market",
  "classGradeIds": ["grade-uuid"],
  "subjectIds": ["subject-uuid"],
  "curriculumId": "curriculum-uuid",
  "preferredUniversityIds": ["university-uuid"],
  "preferredTutorGender": "NO_PREFERENCE",
  "teachingMode": "IN_PERSON",
  "daysPerWeek": 3,
  "salaryMin": 4000,
  "salaryMax": 6000,
  "schedule": [
    {
      "weekday": "SUNDAY",
      "startTime": "17:00",
      "endTime": "18:00"
    }
  ]
}
```

Validation rules:

* `title`: required, 5–150 characters.

* `description`: required, 20–3,000 characters.

* `areaId`: valid active area ID.

* `locationDescription`: optional, maximum 200 characters; warn users not to post full home addresses publicly.

* `classGradeIds`: one or more valid IDs, within configured maximum.

* `subjectIds`: one or more valid IDs, within configured maximum.

* `curriculumId`: optional valid ID.

* `preferredUniversityIds`: optional array of valid IDs; reject duplicates.

* `preferredTutorGender`: controlled enum, including `NO_PREFERENCE` where applicable.

* `teachingMode`: valid enum.

* `daysPerWeek`: integer within the product's supported range, for example `1–7`.

* `salaryMin` and `salaryMax`: non-negative integer BDT amounts; minimum must not exceed maximum.

* `schedule`: optional; if supplied, validate each weekday and time range. Apply a documented policy on whether schedule slots must agree with `daysPerWeek`.

* Do not accept `ownerId`, `status`, `createdAt`, or application counts from the client.

Response (`201`):

JSON

```
{
  "data": {
    "id": "listing-uuid",
    "title": "Mathematics tutor for Class 9",
    "status": "DRAFT",
    "salaryMin": 4000,
    "salaryMax": 6000,
    "createdAt": "2026-10-09T08:00:00.000Z"
  }
}
```

Create listings as `DRAFT` first if the product needs moderation or a preview step. Publishing should be a separate authorized state transition.

### `GET /listings` search parameters

```
GET /listings?areaId=uuid&subjectId=uuid&classGradeId=uuid&universityId=uuid&salaryMin=3000&salaryMax=8000&daysPerWeek=3&page=1&limit=20
```

Support filters for area, subject, class, curriculum, preferred university, tutor gender preference, teaching mode, salary range, days per week, and listing status. Public requests should only return published and open listings.

Response:

JSON

```
{
  "data": [
    {
      "id": "listing-uuid",
      "title": "Mathematics tutor for Class 9",
      "area": {
        "id": "area-uuid",
        "name": "Example Area"
      },
      "subjects": [
        {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      ],
      "salaryMin": 4000,
      "salaryMax": 6000,
      "daysPerWeek": 3,
      "status": "OPEN",
      "createdAt": "2026-10-09T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### Listing state transitions

Recommended lifecycle:

`DRAFT → OPEN → CLOSED`

An administrator may also mark a listing `REJECTED` or `SUSPENDED` if those states exist in the database.

* Only the owner can publish, edit, or close their listing.

* Closed listings cannot receive new applications.

* An edit to a published listing should not silently bypass moderation if moderation is enabled.

* A close operation should be idempotent where practical.

* Do not delete historical applications merely because a listing is closed.

## 6. Application endpoints

| Method  | Endpoint                     | Access                     |
| ------- | ---------------------------- | -------------------------- |
| `POST`  | `/listings/:id/applications` | Tutor                      |
| `GET`   | `/users/me/applications`     | Applying tutor             |
| `GET`   | `/listings/:id/applications` | Listing owner              |
| `GET`   | `/applications/:id`          | Applicant or listing owner |
| `PATCH` | `/applications/:id/withdraw` | Applicant                  |
| `PATCH` | `/applications/:id/status`   | Listing owner              |

### `POST /listings/:id/applications`

Request:

JSON

```
{
  "coverMessage": "I have experience teaching this subject and am available on weekends."
}
```

Validation:

* Require the authenticated user to have the `TUTOR` role and a tutor profile.

* `coverMessage`: optional, maximum 1,000 characters.

* The listing must exist, be published/open, and accept applications.

* The tutor cannot apply to their own listing.

* Prevent duplicate applications for the same tutor and listing with a database unique constraint.

* Enforce any eligibility restrictions configured for the listing.

* Do not accept the applicant's ID, application status, or timestamps from the client.

Response (`201`):

JSON

```
{
  "data": {
    "id": "application-uuid",
    "listingId": "listing-uuid",
    "status": "PENDING",
    "createdAt": "2026-10-09T08:00:00.000Z"
  }
}
```

Return `409 Conflict` for duplicate applications or other conflicting application states.

### `GET /listings/:id/applications`

Only the listing owner, or an authorized administrator, may access the applicant list.

Response:

JSON

```
{
  "data": [
    {
      "id": "application-uuid",
      "status": "PENDING",
      "coverMessage": "I have experience teaching this subject.",
      "tutor": {
        "id": "tutor-profile-uuid",
        "displayName": "Rahim Ahmed",
        "universityName": "Example University",
        "experienceMonths": 12,
        "verificationStatus": "VERIFIED"
      },
      "createdAt": "2026-10-09T08:00:00.000Z"
    }
  ]
}
```

### `PATCH /applications/:id/status`

Request:

JSON

```
{
  "status": "SHORTLISTED"
}
```

Suggested application statuses:

`PENDING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.

Rules:

* Only the listing owner can shortlist, accept, or reject an applicant.

* Only the applicant can withdraw their own application.

* Validate each transition on the server; do not allow a client to change `WITHDRAWN` back to `PENDING`.

* If a listing closes, prevent new applications. Define explicitly whether existing applications can still be reviewed.

* An accepted application does not imply payment, employment, or a guarantee of a successful tuition arrangement.

## 7. Contact sharing and conversations

The platform does not process payments. Its main conversion event is a tutor and parent choosing to communicate.

| Method  | Endpoint                          | Access                 |
| ------- | --------------------------------- | ---------------------- |
| `POST`  | `/applications/:id/contact-share` | Authorized participant |
| `GET`   | `/applications/:id/contact-share` | Authorized participant |
| `POST`  | `/applications/:id/conversation`  | Authorized participant |
| `GET`   | `/conversations`                  | Participant            |
| `GET`   | `/conversations/:id/messages`     | Participant            |
| `POST`  | `/conversations/:id/messages`     | Participant            |
| `PATCH` | `/conversations/:id/read`         | Participant            |

### Contact sharing

Request:

JSON

```
{
  "sharePhone": true,
  "shareEmail": false
}
```

The server must derive the user's identity from the authenticated session, not from a submitted `userId`.

Rules:

* Contact details are private by default.

* Only participants authorized by the application/contact-sharing policy can request or view shared contact details.

* Record who shared what and when in `ContactShare`.

* Return only the specific contact fields permitted by the consent record.

* Do not return guardian emergency contacts or student ID information as part of ordinary contact sharing.

* Rate-limit contact-share requests and log suspicious access attempts.

Response:

JSON

```
{
  "data": {
    "applicationId": "application-uuid",
    "shared": {
      "phone": true,
      "email": false
    },
    "sharedAt": "2026-10-09T08:00:00.000Z"
  }
}
```

Important product decision: Decide whether contact sharing requires the guardian to approve a tutor first, or whether both parties can share details after an application is submitted. The API should enforce that policy consistently.

### Create a conversation

Request:

JSON

```
{
  "applicationId": "application-uuid"
}
```

Response (`201`):

JSON

```
{
  "data": {
    "id": "conversation-uuid",
    "applicationId": "application-uuid",
    "status": "ACTIVE"
  }
}
```

Create at most one conversation per application unless the product explicitly supports multiple threads. Verify that the authenticated user is the applicant or listing owner.

### Send a message

Request:

JSON

```
{
  "body": "Hello, I would like to discuss the tuition schedule."
}
```

Validation:

* `body`: required, trimmed, 1–5,000 characters.

* The sender must be an active participant in the conversation.

* The conversation must permit messaging.

* Do not accept `senderId`, `conversationId` from the body, or server timestamps as trusted values.

* Rate-limit sends and apply spam/reporting controls.

* If attachments are added later, validate MIME type, file size, upload authorization, and malware scanning separately.

Response (`201`):

JSON

```
{
  "data": {
    "id": "message-uuid",
    "conversationId": "conversation-uuid",
    "body": "Hello, I would like to discuss the tuition schedule.",
    "createdAt": "2026-10-09T08:00:00.000Z"
  }
}
```

Message history should be paginated using a stable cursor such as `createdAt` plus message ID. Do not fetch an unlimited conversation history in one request.

## 8. Student verification endpoints

Verification is optional. A student should be able to use the marketplace without uploading a student ID unless a particular feature explicitly requires verification.

| Method | Endpoint                             | Access                           |
| ------ | ------------------------------------ | -------------------------------- |
| `POST` | `/verifications`                     | Authenticated user               |
| `GET`  | `/verifications/me`                  | Applicant                        |
| `GET`  | `/verifications/:id`                 | Applicant or authorized reviewer |
| `POST` | `/verifications/:id/evidence-upload` | Applicant                        |
| `POST` | `/verifications/:id/submit`          | Applicant                        |
| `GET`  | `/admin/verifications`               | Authorized reviewer              |
| `POST` | `/admin/verifications/:id/decision`  | Authorized reviewer              |

### `POST /verifications`

Request:

JSON

```
{
  "type": "UNIVERSITY_STUDENT",
  "universityId": "university-uuid"
}
```

Validation:

* `type` must be a supported verification type.

* `universityId` must refer to an active university.

* A user may not create unlimited duplicate pending verification requests.

* The server sets the initial status, typically `PENDING` or `DRAFT`.

### Evidence upload

Use a private object-storage upload flow, preferably a short-lived signed upload URL. The evidence endpoint should not accept an arbitrary public URL and trust it.

Example request:

JSON

```
{
  "evidenceType": "STUDENT_ID",
  "contentType": "image/jpeg",
  "fileSizeBytes": 850000
}
```

The server should verify:

* Allowed content type and file-size limit.

* Upload authorization and ownership.

* Evidence is stored in a private bucket.

* The stored object is scanned or otherwise checked before reviewer access.

* The evidence key and metadata are associated with the correct verification request.

* The actual file type is checked independently of the client-provided MIME type.

The API must never expose signed upload URLs, private storage keys, or raw student ID files in public tutor responses.

### `POST /admin/verifications/:id/decision`

Request:

JSON

```
{
  "decision": "APPROVE",
  "reason": "University enrollment evidence checked."
}
```

Allowed decisions: `APPROVE`, `REJECT`, and, if supported, `REQUEST_MORE_INFO`.

Rules:

* Only authorized reviewers can decide.

* The reviewer ID is derived from the authenticated account.

* Record the decision, reviewer, timestamp, and reason in the audit log.

* Never allow a user to approve their own verification.

* Use a transaction to update the verification request and corresponding profile verification status.

* Return generic public verification status; keep reviewer notes and evidence private.

Response:

JSON

```
{
  "data": {
    "id": "verification-uuid",
    "status": "APPROVED",
    "decidedAt": "2026-10-09T08:00:00.000Z"
  }
}
```

Only display a verified badge if the relevant verification is approved and still valid under the platform's policy.

## 9. Guardian profile and private contact information

| Method  | Endpoint                | Access      |
| ------- | ----------------------- | ----------- |
| `POST`  | `/guardians/me/profile` | Guardian    |
| `GET`   | `/guardians/me/profile` | Own profile |
| `PATCH` | `/guardians/me/profile` | Own profile |

Example request:

JSON

```
{
  "relationshipToStudent": "PARENT",
  "emergencyContactName": "Example Contact",
  "emergencyContactPhone": "01712345678"
}
```

Validation:

* Relationship must be a defined enum.

* Contact name is optional and limited to 100 characters.

* Contact phone must follow the configured phone validation rules.

* Do not return guardian profile details from public listing endpoints.

* Emergency contacts must only be accessible to the guardian and explicitly authorized workflows or personnel.

* Collect consent before storing or processing personal information, and define retention/deletion rules.

The public listing should contain enough information for a tutor to evaluate the opportunity without exposing the guardian's private phone number or exact home address.

## 10. Reports, notifications, and moderation

### Report endpoints

| Method  | Endpoint                    | Access               |
| ------- | --------------------------- | -------------------- |
| `POST`  | `/reports`                  | Authenticated        |
| `GET`   | `/users/me/reports`         | Reporter             |
| `GET`   | `/admin/reports`            | Authorized moderator |
| `PATCH` | `/admin/reports/:id/status` | Authorized moderator |

Request:

JSON

```
{
  "targetType": "LISTING",
  "targetId": "listing-uuid",
  "category": "SPAM",
  "description": "This listing appears to be spam."
}
```

Validation:

* `targetType` and `category` must be defined enum values.

* `targetId` must reference a supported resource.

* `description`: optional, maximum 2,000 characters.

* Prevent duplicate or excessive reports from the same user against the same target within the configured policy.

* Only moderators can change report status.

* Store the reporter ID from the session; never trust a supplied reporter ID.

### Notifications

| Method  | Endpoint                      | Access             |
| ------- | ----------------------------- | ------------------ |
| `GET`   | `/notifications`              | Authenticated      |
| `GET`   | `/notifications/unread-count` | Authenticated      |
| `PATCH` | `/notifications/:id/read`     | Notification owner |
| `PATCH` | `/notifications/read-all`     | Authenticated      |

Response:

JSON

```
{
  "data": [
    {
      "id": "notification-uuid",
      "type": "NEW_APPLICATION",
      "title": "New tutor application",
      "body": "A tutor has applied to your listing.",
      "readAt": null,
      "createdAt": "2026-10-09T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Only the notification owner can read or mark a notification as read. Keep notification content free of sensitive contact details.

## 11. Admin endpoints

Admin APIs must be protected by server-side role guards and, where relevant, explicit permissions.

| Method  | Endpoint                            | Purpose                                 |
| ------- | ----------------------------------- | --------------------------------------- |
| `GET`   | `/admin/users`                      | Search accounts                         |
| `GET`   | `/admin/users/:id`                  | View authorized account details         |
| `PATCH` | `/admin/users/:id/status`           | Suspend or reactivate account           |
| `GET`   | `/admin/listings`                   | Review listings                         |
| `PATCH` | `/admin/listings/:id/status`        | Moderate listings                       |
| `GET`   | `/admin/reports`                    | Review user reports                     |
| `PATCH` | `/admin/reports/:id/status`         | Resolve reports                         |
| `GET`   | `/admin/verifications`              | Review verification requests            |
| `POST`  | `/admin/verifications/:id/decision` | Decide verification                     |
| `GET`   | `/admin/audit-logs`                 | Review sensitive administrative actions |

### Suspend or reactivate an account

Request:

JSON

```
{
  "status": "SUSPENDED",
  "reason": "Repeated policy violations."
}
```

Validation and rules:

* `status` must be an allowed account status.

* `reason` should be required for suspensions and limited to 1,000 characters.

* Only authorized administrators may change account status.

* Record the actor, reason, target, and timestamp.

* A suspended user must not be able to create applications, publish listings, or send messages.

* Revoking active sessions should be part of the suspension workflow.

* Protect against administrators suspending their own account or removing the last active administrator.

## 12. Common DTO and validation rules

Use DTO classes with `class-validator` and `class-transformer`. The following patterns are suitable for NestJS.

### Example: registration DTO

TypeScript

```
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ArrayUnique,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserRole {
  TUTOR = 'TUTOR',
  GUARDIAN = 'GUARDIAN',
}

export class RegisterDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}
```

The phone expression accepts common Bangladesh mobile formats, with or without the country prefix. If international phone numbers are required, use a phone-number parsing library instead.

The DTO is only the first validation layer. The service must still enforce email uniqueness, account creation rules, and password hashing.

### Example: pagination DTO

TypeScript

```
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
```

Use a shared pagination response format across listing, tutor, application, notification, and admin endpoints.

### Example: configure global validation

TypeScript

```
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Use separate DTOs for creation, updates, and privileged administrative operations. Do not reuse an unrestricted Prisma model as an API request DTO.

## 13. Cross-cutting business and security rules

These rules apply across the API, not just individual endpoints.

1. Authentication: Require authentication for all private operations. Use guards for authentication and roles, followed by resource-level authorization checks.

2. Ownership: Check that the user owns the listing, application, profile, conversation, or notification they are attempting to access.

3. Data exposure: Use explicit response DTOs. Never serialize entire Prisma records when they contain private fields or relations.

4. Race conditions: Use database unique constraints and transactions for applications, verification decisions, contact sharing, and other concurrent operations.

5. Rate limiting: Apply limits to login attempts, registration, application creation, messages, reports, and contact sharing.

6. Search: Allowlist filter and sort fields. Bound pagination, query length, and result size.

7. Audit logging: Log security-sensitive administrative actions and verification decisions without logging passwords, tokens, or raw ID documents.

8. Privacy: Minimize collection of student and guardian information. Provide clear consent, retention, deletion, and account suspension policies.

9. Errors: Return consistent error shapes. Avoid revealing whether a private account or resource exists when doing so could expose personal information.

10. No payment processing: Do not introduce payment, commission, wallet, or payout endpoints into the MVP.

## 14. Database constraints that support the API

Enforce important rules at both the service and database layers where possible.

| Rule                                  | Enforcement                                                     |
| ------------------------------------- | --------------------------------------------------------------- |
| Unique account email                  | Unique database constraint                                      |
| One tutor profile per user            | Unique `TutorProfile.userId`                                    |
| One guardian profile per user         | Unique `GuardianProfile.userId`                                 |
| One application per tutor per listing | Composite unique constraint                                     |
| Valid salary range                    | DTO and service validation; database constraint where supported |
| Valid schedule range                  | DTO and service validation                                      |
| No duplicate subject assignments      | Composite unique constraints                                    |
| Only authorized contact access        | Service authorization and consent records                       |
| Valid application transitions         | Service state machine and transaction                           |
| Private verification evidence         | Private object storage and access-controlled retrieval          |

Remember that application-level checks alone can fail when two requests execute simultaneously. Unique constraints and transactions are especially important for duplicate applications and verification decisions.

## 15. Recommended implementation order

Phase 1 — Foundation

Authentication, users, roles, reference data, tutor profiles, guardian profiles, and authorization guards.

Phase 2 — Marketplace

Tuition listings, tutor search, filters, applications, and listing state transitions.

Phase 3 — Communication

Contact sharing, conversations, messaging, notifications, and reporting.

Phase 4 — Trust and administration

Student verification, moderation, account suspension, audit logs, privacy controls, and security tests.

Before implementation, validate the DTOs against the actual Prisma enums and relations. The specification describes the intended API contract; it is not a substitute for testing the endpoints against the generated Prisma Client and real authorization rules.

One decision is particularly worth settling before writing the services: when should phone numbers become visible to the other party?

Choose the contact-sharing rule so the API can enforce the intended privacy behavior.

Choose contact policy
