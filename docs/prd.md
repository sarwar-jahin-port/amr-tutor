# PRD: A Free, Direct Home Tuition Marketplace for Bangladesh

## 1. Product Overview

**Working product name:** TBD
**Product category:** Two-sided education marketplace
**Initial market:** Bangladesh
**Primary users:** University students working as home tutors and parents or guardians seeking tutors
**Business model:** Free direct connections, with optional advertising considered in a later phase.

### Product vision

Build a trusted platform where university students can discover home tuition opportunities without paying an agency commission, while parents can find suitable tutors directly, compare their qualifications, and establish contact without an intermediary.

### Mission

Make home tuition opportunities more accessible, transparent, and affordable by removing unnecessary placement fees and giving tutors and parents control over their own decisions.

### Product principles

1. Free access to create profiles, publish tuition requirements, and apply.
2. No commission on the first month or subsequent months.
3. No mandatory payment processing through the platform.
4. Personal information is private by default.
5. Verification claims must be evidence-based.
6. Tutors and parents independently agree on fees, schedules, and employment arrangements.
7. The platform facilitates introductions but does not guarantee teaching outcomes or personal safety.

## 2. Problem Statement

### Problems faced by tutors

* Tuition media agencies may charge a substantial portion of the first month's earnings.
* Finding legitimate tuition opportunities often depends on personal networks, social media groups, or intermediaries.
* Students may struggle to demonstrate their university affiliation and academic qualifications.
* Tuition descriptions may omit important details, such as exact subjects, teaching days, location, or expected salary.
* Applicants may spend time pursuing expired or misleading listings.

### Problems faced by parents

* Finding a suitable tutor can require searching across multiple groups, websites, and personal contacts.
* It may be difficult to distinguish a genuine university student from someone making an unverified claim.
* Parents need to compare subject expertise, academic background, availability, location, and expected salary.
* Contacting multiple agencies or intermediaries can add friction.
* Families need privacy and practical safety measures when arranging home tuition.

### Proposed solution

Create a self-service marketplace with two primary workflows:

**Tutor:** Register → Build profile → Verify relevant credentials → Discover tuition listings → Apply → Connect directly with the parent.

**Parent:** Register → Post tuition requirements → Review tutor applications → Compare profiles → Connect directly with a tutor → Arrange tuition independently.

The platform will not negotiate on behalf of either party, collect tuition fees, or charge placement commissions.

## 3. Goals and Non-goals

### Goals

* Enable tutors to create detailed academic profiles.
* Allow parents to publish structured tuition requirements.
* Support searching, filtering, and applying for tuition opportunities.
* Introduce practical university-affiliation verification.
* Facilitate secure communication and consent-based contact sharing.
* Prevent spam, fake profiles, duplicate listings, and misuse of personal information.
* Validate whether a free marketplace can generate successful connections in a focused launch area.

### Non-goals for the MVP

* Collecting tuition payments or paying tutors.
* Taking a commission or placement fee.
* Employing tutors or acting as a staffing agency.
* Guaranteeing academic results or guaranteeing a tutor's conduct.
* Delivering video classes, course management, examinations, or an LMS.
* Offering AI-based tutor ranking or complex matching algorithms.
* Launching a nationwide mobile application before the website is validated.
* Selling personal information or charging for basic access.

## 4. User Roles

### A. Tutor

A university student who wants to find home tuition opportunities.

Permissions:

* Create and manage a tutor profile.
* Submit verification requests.
* Search and filter active tuition listings.
* Apply for suitable listings.
* Communicate with parents after an appropriate connection is established.
* Manage applications and availability.
* Report suspicious listings or users.
* Request account and personal-data deletion.

### B. Parent or Guardian

A person looking for a tutor for a child or student.

Permissions:

* Create a guardian account.
* Publish, edit, pause, and close tuition listings.
* Review and filter applicants.
* View tutor profiles and verification indicators.
* Accept or decline applications.
* Communicate with tutors and share contact information by choice.
* Report suspicious behavior and manage listings.

### C. University Verifier

An approved university-affiliated verifier or trusted community member.

Permissions:

* Review verification requests assigned to them.
* Inspect only the minimum information needed.
* Approve, reject, or request additional evidence.
* Provide a reason for a decision.
* Flag suspected fraudulent documents.
* Access an audit trail of their verification actions.

A verifier must not automatically receive unrestricted access to private messages, guardian contacts, or unrelated user information.

### D. Platform Administrator

Permissions:

* Review and moderate accounts, listings, reports, and verification appeals.
* Suspend or restrict accounts under documented rules.
* Manage university and subject directories.
* Review suspicious activity.
* Resolve verification disputes.
* Manage content, support requests, and platform settings.
* View security and moderation audit logs.

Administrative actions must be permission-controlled and auditable.

## 5. Functional Requirements

### 5.1 Authentication and account management

**Priority: P0 — required for launch**

* Support registration and login using a verified mobile number or another suitable authentication method.
* Use OTP verification where a reliable SMS provider is available.
* Support password recovery if passwords are used.
* Allow a user to select the appropriate role: tutor or parent/guardian.
* Permit a parent to act as a guardian without requiring the child to create an account.
* Provide profile editing, account deactivation, and deletion-request functionality.
* Prevent repeated submissions and automated account creation through rate limits and abuse controls.
* Require acceptance of the terms, privacy notice, and relevant consent notices.

Role changes must not expose another role's private data or permissions.

### 5.2 Tutor profile management

**Priority: P0**

A tutor profile should include:

| Field                              | Requirement                              |
| ---------------------------------- | ---------------------------------------- |
| Full name                          | Required; not necessarily public in full |
| Profile photo                      | Optional                                 |
| University                         | Required                                 |
| Department or major                | Required                                 |
| Degree and current academic status | Required                                 |
| Academic year or semester          | Required where applicable                |
| Subjects offered                   | Required                                 |
| Classes or grades supported        | Required                                 |
| Curriculum familiarity             | Optional                                 |
| Academic results                   | Optional and clearly labelled            |
| Teaching experience                | Optional                                 |
| Preferred teaching locations       | Required                                 |
| Preferred teaching mode            | Home, online, or both                    |
| Expected monthly fee or fee range  | Optional                                 |
| Available days and times           | Required                                 |
| Languages                          | Optional                                 |
| Short introduction                 | Optional                                 |
| Verification status                | System-generated                         |
| Profile visibility                 | User-controlled                          |

**Requirements**

* Separate public profile data from private identity documents.
* Never display a student ID card or guardian's phone number on the public profile.
* Clearly label self-reported academic information.
* Let tutors pause their availability without deleting their accounts.
* Let tutors update their preferred locations, subjects, and schedule.
* Display the last-updated date to help parents assess whether a profile is current.

### 5.3 Student identity and university verification

**Priority: P0 for a pilot; scalable verification workflow required**

The proposed peer-verification idea is useful, but it must be implemented carefully.

#### Proposed verification levels

1. **Phone verified:** The user controls a verified phone number.
2. **University affiliation verified:** Evidence of current or recent affiliation with a specified university has been reviewed.
3. **Academic credentials reviewed:** A particular qualification or academic claim has been reviewed, where the platform offers this service.

These indicators must remain separate. University affiliation does not establish teaching competence, and reviewing a degree does not guarantee personal safety.

#### Verification workflow

1. Tutor selects their university and enters relevant academic details.
2. Tutor submits the minimum necessary evidence through a private upload flow.
3. The system creates a pending verification request.
4. An authorized verifier reviews the request using an approved checklist.
5. The verifier approves, rejects, or requests clarification.
6. The tutor receives the result and can appeal a rejection.
7. The platform records the decision, reviewer, date, and verification scope.

#### Peer verification rules

* Verifiers must have their own independently verified affiliation before reviewing others.
* Peer verification should be limited to institutions and verification methods the platform has explicitly approved.
* A verifier's approval is evidence of a completed review, not an absolute guarantee.
* Prevent self-verification and undisclosed conflicts of interest.
* Audit repeated approvals, suspicious patterns, and attempts to verify unrelated accounts.
* Allow professional review or official institutional confirmation where feasible.

**Important:** A student ID image should not be retained indefinitely. Prefer a verification method that minimizes stored documents, restricts access, and deletes evidence when it is no longer necessary. Where the verification outcome can be retained without the original document, store the outcome and its audit metadata instead.

### 5.4 Tuition listing creation

**Priority: P0**

Parents should be able to create a structured tuition listing using a guided form.

Required fields:

* Class or grade.
* Curriculum or education board, where relevant.
* Subjects to be taught.
* Preferred tutor gender, if requested by the family.
* Preferred university or academic background, if relevant.
* General teaching location or neighborhood.
* Number of teaching days per week.
* Preferred days and time window.
* Expected monthly salary or a salary range.
* Desired start date.
* Teaching mode: home tuition, online, or either.
* Additional academic requirements.

Optional fields:

* Student's learning goals.
* Whether the tutor should help with homework, exam preparation, or specific topics.
* Preferred teaching language.
* Whether prior experience is required.
* A short description of the student's academic needs.

**Privacy requirements**

* Do not require the child's full name, exact birth date, school ID, or other unnecessary identifying details.
* Do not display a family's exact home address publicly.
* Show a neighborhood or approximate location in public listings.
* Keep guardian contact information private until the guardian chooses to share it.
* Warn users not to include sensitive information in public descriptions.

Each listing must have a unique ID, publication date, last-updated date, status, and owner.

Listing statuses: Draft, Pending Review, Published, Paused, Filled, Closed, and Rejected.

### 5.5 Search and discovery

**Priority: P0**

Tutors must be able to search tuition listings using:

* City and area.
* Class or grade.
* Subject.
* University preference.
* Tutor gender preference, as stated by the parent.
* Teaching mode.
* Days per week.
* Time availability.
* Salary range.
* Listing publication date.
* Listing status.

Parents should be able to browse tutor profiles and filter by:

* University.
* Department or academic background.
* Subjects taught.
* Supported classes.
* Verification indicators.
* Teaching location.
* Availability.
* Teaching experience.

**Ranking rules**

* Prioritize relevance to the selected filters.
* Show newly published and recently updated listings appropriately.
* Do not make payment a condition of appearing in search.
* Do not imply that a verified profile is necessarily a better teacher.
* Provide an honest empty state and suggest broadening filters when results are limited.

### 5.6 Applications

**Priority: P0**

* Tutors can apply to a published listing.
* An application can include a short introduction and relevant experience.
* The system prevents duplicate active applications from the same tutor to the same listing.
* Tutors can withdraw applications.
* Parents can review applicants and their profiles.
* Parents can shortlist, decline, or accept an applicant.
* Both parties receive a notification when application status changes.
* A listing owner can close a listing after finding a suitable tutor.

Application statuses: Submitted, Viewed, Shortlisted, Contact Requested, Accepted, Declined, Withdrawn, and Closed.

An accepted application means the parent wishes to continue the conversation. It does not constitute a guarantee that the parties have entered into a tuition agreement.

### 5.7 Communication and contact sharing

**Priority: P0 for a controlled launch; full messaging may follow after the pilot**

The platform should support two communication paths:

**Initial MVP:** In-app application messages or a structured contact-request workflow.

**Later enhancement:** Real-time private messaging with blocking, reporting, spam detection, and notification controls.

Rules:

* Do not expose phone numbers or guardian contacts to anonymous visitors.
* Require an intentional contact-sharing action.
* Explain to users what information will be shared and with whom.
* Provide a clear way to block and report another user.
* Avoid automatically revealing contact information when someone applies.
* Restrict unsolicited bulk messages and repeated contact requests.
* For minors, use guardian-aware communication rules and additional protections.

The platform should facilitate direct communication without requiring a paid introduction or an intermediary's approval.

### 5.8 Notifications

**Priority: P0 for basic notifications**

Notify users about:

* New applications.
* Application status changes.
* Contact requests and responses.
* Verification decisions.
* Listing expiry or closure.
* New listings matching saved preferences, where enabled.
* Account security events.
* Reports and moderation outcomes, when appropriate.

Email, in-app notifications, and SMS can be introduced incrementally. Do not send promotional messages without the appropriate consent.

### 5.9 Reviews and reputation

**Priority: P1 — after successful pilot connections**

Reviews may help users build trust, but unmoderated ratings can be manipulated.

For the initial version, collect optional feedback after both parties voluntarily confirm that a tuition arrangement started.

Later, consider:

* Separate feedback from tutors and parents.
* Reporting and moderation for abusive or fraudulent reviews.
* A transparent process for disputes and appeals.
* Limits on duplicate reviews.
* Clear distinction between platform verification and user reviews.

Do not publish unverified allegations or treat a lack of reviews as evidence of poor conduct.

### 5.10 Reporting, moderation, and account safety

**Priority: P0**

Users must be able to report:

* Fake identity or university claims.
* Fraudulent or misleading tuition listings.
* Harassment or inappropriate messages.
* Requests for money in exchange for a platform introduction.
* Attempts to misuse identity documents or contact information.
* Suspicious or unsafe conduct.
* Spam, impersonation, or repeated abuse.

The platform must provide:

* A report submission form.
* A moderation queue.
* Severity levels and response procedures.
* Evidence handling with restricted access.
* Temporary restrictions when appropriate.
* Appeal mechanisms.
* Audit logs for consequential moderation actions.

Publish clear safety guidance for home tuition. Encourage families and tutors to verify arrangements, agree on expectations before the first class, and involve a trusted adult where appropriate.

### 5.11 Administration dashboard

**Priority: P0**

Required features:

* Account and role management.
* Tutor verification queue.
* Tuition listing moderation.
* Reports and abuse management.
* University directory management.
* Subject and curriculum management.
* Listing and application analytics.
* Account restriction and appeal management.
* Data deletion requests.
* Audit logs and operational reporting.

Administrator access should follow least-privilege principles. Not every administrator needs access to identity documents or private conversations.

## 6. Core User Journeys

### Tutor journey

1. Visits the website.
2. Creates an account and verifies their phone number.
3. Completes their academic and teaching profile.
4. Requests university-affiliation verification.
5. Browses published tuition listings.
6. Filters listings by location, class, subject, salary, and schedule.
7. Applies to a suitable listing.
8. Receives application updates.
9. Communicates with the parent after the appropriate contact step.
10. Independently agrees on the tuition arrangement.

### Parent journey

1. Visits the website.
2. Creates a parent or guardian account.
3. Publishes a tuition requirement.
4. Reviews incoming applications.
5. Filters applicants by academic background, subjects, location, and verification status.
6. Shortlists suitable tutors.
7. Requests contact or starts a private conversation.
8. Arranges a meeting or introductory discussion.
9. Independently agrees on the fee, schedule, and teaching arrangements.
10. Closes the listing when no longer needed.

### Verification journey

1. Tutor submits a request.
2. The platform checks required fields and evidence.
3. An authorized verifier reviews the request.
4. The platform records the decision.
5. The tutor receives an explanation.
6. The tutor can correct errors or appeal.
7. Evidence is retained or deleted according to the approved retention policy.

## 7. Business Model

### Phase 1: Free marketplace

* No registration fee.
* No tutor application fee.
* No first-month commission.
* No recurring tuition commission.
* No mandatory paid verification.
* No compulsory paid account.
* No fee for basic parent listings.

The free model is part of the product promise, not merely a temporary promotional offer.

### Phase 2: Optional advertising

Potential revenue sources:

* Clearly labelled display advertising.
* Relevant education-related sponsorships.
* Optional partnerships that do not influence verification decisions.

Advertising must not obscure tuition details, mislead users, or expose private personal information to advertisers.

### Future revenue principles

If monetization expands, keep core matching free and disclose any paid features clearly. Do not introduce a hidden placement fee or a pay-to-win ranking system that undermines the mission.

## 8. MVP Scope and Prioritization

### P0 — launch requirements

* Authentication and account management.
* Tutor profiles.
* Parent tuition listings.
* Basic university-affiliation verification.
* Listing search and filters.
* Applications and application statuses.
* Basic contact-request or private messaging workflow.
* Notifications.
* Reporting and moderation.
* Admin dashboard.
* Privacy controls, terms, and data deletion workflow.
* Analytics for successful connections and marketplace activity.

### P1 — after initial validation

* Saved searches and matching alerts.
* Advanced profile filters.
* Optional post-connection feedback.
* Listing recommendations.
* Improved university-verification partnerships.
* Better spam and duplicate-listing detection.
* Multilingual interface improvements based on user feedback.

### P2 — only if justified by demand

* Native mobile applications.
* Advanced recommendation systems.
* Optional verified academic-document badges.
* Institution-specific partnerships.
* Expanded geographic coverage.
* Carefully designed, clearly labelled advertising.

## 9. Non-functional Requirements

### Security and privacy

* Encrypt traffic using HTTPS.
* Encrypt sensitive stored data where appropriate.
* Keep private documents in access-controlled storage.
* Use role-based access controls.
* Avoid putting sensitive information in application logs.
* Apply rate limits to login, applications, messaging, and reporting.
* Protect against common web application vulnerabilities.
* Use secure session management and appropriate CSRF protections.
* Maintain audit trails for verification and moderation decisions.
* Define retention and deletion schedules before collecting identity documents.
* Establish a security incident response process.

### Performance and reliability

Initial targets:

* Main listing and profile pages should load quickly on typical mobile connections.
* Search should return useful results without unnecessary delay.
* The interface should work on common mobile browsers and low-cost smartphones.
* Forms should preserve entered data when recoverable errors occur.
* Errors should provide understandable messages and a way to retry.
* The service should monitor uptime, failed requests, and notification delivery.

Performance targets should be measured in real usage rather than treated as guarantees.

### Accessibility and usability

* Mobile-first responsive layout.
* Clear forms with helpful validation.
* Readable typography and adequate contrast.
* Keyboard-accessible controls.
* Support for Bangla and English.
* Avoid requiring users to upload unnecessary documents just to browse.
* Keep the most important actions easy to find.

## 10. Suggested Information Architecture

Public pages:

* Home
* Find Tuition
* Find Tutors
* How It Works
* Verification Policy
* Safety Guidelines
* About
* FAQ
* Terms of Service
* Privacy Policy
* Contact and Report Abuse

Tutor dashboard:

* My Profile
* Verification
* Browse Tuitions
* My Applications
* Messages or Contact Requests
* Saved Listings
* Availability
* Account Settings

Parent dashboard:

* My Tuition Listings
* Applicants
* Shortlisted Tutors
* Messages or Contact Requests
* Account Settings

Admin dashboard:

* Overview
* Users
* Verification Requests
* Tuition Listings
* Reports
* Appeals
* Universities and Subjects
* Analytics
* Audit Logs
* Data Requests

## 11. Data Model — Initial Entities

The backend should support these core entities:

* **User:** authentication identity, role, account status, consent records.
* **TutorProfile:** academic background, subjects, locations, schedule, introduction.
* **GuardianProfile:** guardian account information and communication preferences.
* **University:** institution name and approved verification methods.
* **VerificationRequest:** evidence references, status, reviewer, decision, timestamps.
* **TuitionListing:** requirements, location area, salary range, schedule, owner, status.
* **Application:** tutor, listing, introduction, status, timestamps.
* **Conversation:** participants, linked application, access rules.
* **Message:** sender, conversation, content, timestamps, moderation state.
* **ContactShare:** consented contact-sharing event and disclosed fields.
* **Report:** reporter, target, category, evidence, status, outcome.
* **Notification:** recipient, type, read status, timestamps.
* **AuditLog:** security-sensitive actions, actor, target, time, and outcome.

Keep verification evidence separate from public profile data. Avoid copying guardian contact details or identity documents into multiple records.

## 12. Success Metrics

### North-star metric

**Successful direct connections:** the number of unique tutor-parent pairs who voluntarily confirm that they have established contact regarding a tuition opportunity.

This measures actual marketplace value better than total sign-ups.

### Marketplace metrics

* Number of active, complete tutor profiles.
* Number of active tuition listings.
* Percentage of listings receiving at least one suitable application.
* Median time from listing publication to first application.
* Application-to-contact conversion rate.
* Percentage of listings marked filled after a confirmed connection.
* Tutor and parent return rates.
* Percentage of listings that expire without a connection.

### Trust and safety metrics

* Percentage of tutor profiles with verified university affiliation.
* Verification turnaround time.
* Number of suspicious accounts detected.
* Reports per active user.
* Moderation response time.
* Confirmed cases of identity misuse.
* Data deletion request completion.
* User-reported confidence in profile accuracy and privacy.

### Mission-impact metrics

* Total tutor-parent connections made without a placement fee.
* Number of tutors reporting that they avoided an agency commission.
* Self-reported amount of commission avoided, where voluntarily provided.
* Parent satisfaction with transparency and choice.
* Tutor satisfaction with the fairness of access to opportunities.

Do not claim that a connection saved a particular amount unless the user provides a credible comparison.

## 13. Launch Strategy

### Stage 1: Validate the problem

Interview university students who work as tutors and parents who have recently searched for tutors.

Investigate:

* Actual commission amounts and how frequently they are charged.
* Where tutors and parents currently find each other.
* Which verification signals parents trust.
* Which information tutors are comfortable publishing.
* How much friction exists in the current process.
* What prevents users from trying a new platform.

### Stage 2: Build a concentrated pilot

Choose one launch city or a small number of connected university communities. Recruit genuine tutors and collect legitimate tuition listings before opening the marketplace broadly.

Do not manufacture listings, invent testimonials, or inflate registration numbers.

### Stage 3: Run a controlled beta

Invite a small cohort of tutors and parents. Manually monitor verification requests, applications, contact success, and reports. Resolve the most common problems before scaling.

### Stage 4: Public launch

Expand only after the pilot shows that:

* Parents can find relevant applicants.
* Tutors receive genuine opportunities.
* Users understand that the platform charges no commission.
* Verification and moderation are operationally manageable.
* The service protects personal information appropriately.

### Stage 5: Improve using evidence

Use actual conversion and feedback data to prioritize features. Expand by area and university community rather than assuming national coverage is immediately useful.

## 14. Key Risks and Mitigations

**Fake university credentials:** Use approved evidence-review procedures, independent verifier eligibility, audits, and appeals.

**Insufficient listings:** Launch in a concentrated area and recruit both sides before broad marketing.

**Low-quality or misleading listings:** Require structured fields, provide reporting tools, and expire stale posts.

**Spam and contact harvesting:** Rate-limit actions, restrict visibility, and require deliberate consent for contact sharing.

**Safety concerns around home tuition:** Publish clear safety guidance, minimize unnecessary data collection, provide reporting and blocking, and use guardian-aware protections.

**Privacy breaches:** Minimize stored data, restrict document access, encrypt sensitive records, define retention periods, and prepare an incident response plan.

**Commission model reappearing through paid features:** Make the no-commission policy explicit and prohibit hidden placement fees in the product's business rules.

**Unsustainable operating costs:** Keep the initial product lean, measure infrastructure and moderation costs, and postpone monetization until the marketplace has demonstrated value.

## 15. Legal and Policy Readiness

Before public launch, obtain Bangladesh-specific legal advice on applicable privacy, child-data, consumer, digital-commerce, and online-service obligations.

The Personal Data Protection Act, 2026 should be reviewed directly when designing consent, processing, security, retention, and children's-data workflows. The Ministry of Commerce also publishes the Digital Commerce Operation Guidelines, 2021. Applicability and current requirements should be confirmed by qualified local counsel rather than assumed from a product template.

The platform should publish:

* Terms of Service.
* Privacy Policy.
* Verification Policy.
* Community Standards.
* Safety Guidelines.
* Reporting and Appeal Policy.
* Data Retention and Deletion Policy.
* A transparent explanation of the no-commission model.

## 16. Acceptance Criteria for MVP Launch

The MVP is ready for a controlled pilot when:

* A tutor can register, create a profile, and request verification.
* An authorized verifier can approve or reject a request with an audit trail.
* A parent can create, edit, pause, and close a tuition listing.
* Tutors can search and apply using relevant filters.
* Parents can review applicants and change application statuses.
* Both parties can establish contact without paying the platform.
* Contact details and identity documents are not publicly exposed.
* Users can report abuse and administrators can process reports.
* Administrators can moderate listings and restrict accounts.
* Users can request account and personal-data deletion.
* Privacy, safety, and platform policies are published.
* Basic analytics track listing activity, applications, and confirmed connections.
* Testing covers access control, privacy leakage, abuse scenarios, and critical user flows.

## 17. Final Product Definition

The first release is a free, mobile-friendly website that helps university students find home tuition opportunities and helps parents find suitable tutors through structured listings, evidence-based verification, applications, and direct communication.

Its competitive advantage is not merely that it charges less. It is that **it does not charge a placement commission at all**, while giving both sides useful information and more control over the matching process.

The initial product should prove that a focused, trustworthy marketplace can create genuine tutor-parent connections before adding advanced features, monetization, or nationwide scale.
