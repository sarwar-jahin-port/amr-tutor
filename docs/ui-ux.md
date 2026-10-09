# UI/UX Design Strategy & Product Experience Specification

## A distinctive, trust-first home-tuition marketplace for Bangladesh

**Document version:** 1.0
**Date:** 9 October 2026
**Product:** Free home-tuition marketplace
**Status:** Foundational design specification
**Audience:** Product designer, frontend developer, backend developer, QA, and future product team

---

# 1. The design thesis

## Make finding a tutor feel like finding the right person—not searching a directory.

The product serves two people with different anxieties.

A parent is asking:

* Can I trust this person with my child's education?
* Does this tutor understand the subject and class level?
* Will they be reliable, available, and affordable?
* Can I contact them without exposing my family's private information?

A tutor is asking:

* Is this opportunity genuine?
* Am I eligible to apply?
* What is expected of me?
* Will someone actually consider my application?
* Can I use the platform without paying an intermediary?

Most marketplaces answer these questions by displaying profiles, filters, ratings, and buttons. Our product should go further: **the interface should help people make a good decision, not merely give them more information.**

The design should feel calm, editorial, locally understandable, and quietly confident. It should borrow proven interaction principles from world-class products without copying another company's appearance.

### The three product promises

**Clarity:** Every screen makes the next sensible action obvious.

**Trust:** Every important claim has an understandable meaning. Verification is explained, privacy is visible, and uncertainty is never disguised.

**Agency:** People remain in control. They can review, edit, withdraw, go back, save progress, and decide when to share contact information.

The product must not use artificial urgency, manipulative engagement loops, fake scarcity, fabricated testimonials, or unverifiable trust badges.

# 2. Design references and what we should learn from them

This is a synthesis of established design practices—not an attempt to recreate a famous interface.

| Reference                                 | Principle to adopt                                                   | How it applies here                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Apple Human Interface Guidelines          | Clarity, user agency, purposeful detail, thoughtful motion           | Interfaces respond clearly to actions; users can recover from mistakes                      |
| Airbnb                                    | Trust and confidence in two-sided interactions                       | Tutor profiles explain who a person is, what is known, and what remains unverified          |
| GOV.UK Design System                      | Accessible forms, explicit errors, plain language                    | Listing creation and verification are understandable, recoverable processes                 |
| Nielsen Norman Group usability principles | Recognition over recall, consistent feedback, progressive disclosure | Users see relevant options and context instead of remembering previous steps                |
| Editorial and print design                | Strong hierarchy, readable measure, intentional whitespace           | Profiles and tuition opportunities are easy to scan without looking like generic SaaS cards |

References:

* Apple: [Human Interface Guidelines — Design Principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
* Airbnb: [Accessibility Statement](https://www.airbnb.com/help/article/3928)
* GOV.UK: [Error Message Pattern](https://design-system.service.gov.uk/components/error-message/)
* Nielsen Norman Group: [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
* Nielsen Norman Group: [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

The important distinction: adopt the *reason a pattern works*, not its exact visual expression.

# 3. The visual concept: “The Learning Commons”

## A visual identity built around openness, knowledge, and human connection

The platform should not look like a fintech dashboard, a school management system, or a discount marketplace.

Its visual character should combine:

* The warmth of a well-designed independent bookstore.
* The legibility and discipline of a high-quality editorial publication.
* The trust and restraint of a serious public service.
* The responsiveness of a modern consumer product.

Avoid making the interface feel childish. Parents and tutors are adults making an important educational decision.

### Signature design element: the learning line

Use a fine, continuous line as a subtle recurring motif in the interface.

It can connect related information—class, subject, schedule, and location—or show progress through a multi-step journey. It should be functional rather than decorative.

For example, a tuition listing might use a compact vertical sequence:

**Class 9 → Mathematics → 3 days/week → Nearby area**

This creates a recognizable design signature without relying on gradient backgrounds, oversized illustrations, or decorative blobs.

The line should never be the only indicator of progress or status; pair it with labels and clear visual states.

# 4. Color system

Use a warm, paper-inspired neutral foundation with a deep ink color and one distinctive botanical green.

The interface should feel trustworthy and human, not sterile. Green communicates positive progress, but it must not imply that a person is verified unless that is factually true.

| Token          | Hex       | Usage                                         |
| -------------- | --------- | --------------------------------------------- |
| Canvas         | `#F8F7F2` | Main page background                          |
| Surface        | `#FFFFFF` | Forms, profiles, menus                        |
| Ink            | `#202923` | Primary text and major headings               |
| Secondary ink  | `#59635B` | Supporting text                               |
| Primary        | `#245B45` | Main buttons, selected controls, links        |
| Primary hover  | `#194634` | Hover and pressed state                       |
| Soft green     | `#EAF2EB` | Selected filters and calm supporting surfaces |
| Border         | `#E2E5DE` | Dividers and input borders                    |
| Warm accent    | `#D99A56` | Occasional emphasis, never essential status   |
| Danger         | `#B42318` | Errors and destructive actions                |
| Danger surface | `#FDECEA` | Error backgrounds                             |
| Success        | `#246B45` | Confirmed successful actions                  |
| Information    | `#245D8C` | Informational messages                        |

### Color rules

1. Use the primary green for the most important action, not every clickable element.
2. Keep most of the interface neutral. A quiet interface makes meaningful states easier to notice.
3. Never rely on color alone to communicate verified, pending, rejected, or closed.
4. Verify text and control contrast against WCAG 2.2 AA requirements.
5. Do not turn every section into a tinted card. Reserve colored surfaces for grouping, selection, or meaningful status.

**Signature:** Warm canvas + deep ink + botanical green. No default purple gradient, no glassmorphism, no neon accent system.

# 5. Typography

Typography is a major part of the product's identity. Use a carefully paired bilingual type system rather than a random collection of fashionable fonts.

## Recommended type pairing

**English and Latin:** Inter
**Bangla:** Noto Sans Bengali

Both are widely available through established font distribution channels. Self-host production font files where licensing and deployment requirements permit.

The Bangla typeface is a first-class part of the design—not a fallback that gets tested at the end. Bengali shaping, conjuncts, vowel marks, and line wrapping must be tested in the real interface.

### Type scale

| Role            | Desktop | Mobile | Weight |
| --------------- | ------: | -----: | ------ |
| Display heading |   48 px |  36 px | 600    |
| Page heading    |   36 px |  30 px | 600    |
| Section heading |   24 px |  22 px | 600    |
| Card heading    |   18 px |  18 px | 600    |
| Body            |   16 px |  16 px | 400    |
| Supporting text |   14 px |  14 px | 400    |
| Small metadata  |   13 px |  13 px | 500    |
| Button label    |   15 px |  15 px | 600    |

These are starting values, not rigid rules. Adjust line height and spacing based on the actual font metrics.

### Typography rules

* Body text should generally use a line height around 1.5.
* Headings should have tighter line spacing, but not so tight that Bengali marks collide or feel cramped.
* Avoid long paragraphs that span the entire desktop viewport.
* Use sentence case, not all-caps navigation labels.
* Use tabular numerals for money, counts, and time where supported.
* Display currency clearly: `৳ 4,000–৳ 6,000 / month`.
* Never reduce important labels to tiny text to make a layout fit.
* Avoid using light font weights for essential information.

### Bilingual layout

The product should be designed to support both English and Bangla, even if the first release launches in one language.

Do not mix languages arbitrarily within the same label. Use natural language consistently. Preserve digits and currency conventions consistently within each locale.

The layout must tolerate longer translations without clipping, overlapping controls, or forcing users to zoom.

# 6. Layout and spatial system

Use an 8-point spacing system with a few deliberate 4-point adjustments for compact elements.

| Token    | Value | Typical usage               |
| -------- | ----: | --------------------------- |
| Space 1  |  4 px | Icon-to-label micro-spacing |
| Space 2  |  8 px | Compact related elements    |
| Space 3  | 12 px | Form label spacing          |
| Space 4  | 16 px | Standard component spacing  |
| Space 6  | 24 px | Section internals           |
| Space 8  | 32 px | Between related sections    |
| Space 12 | 48 px | Major section separation    |
| Space 16 | 64 px | Large editorial spacing     |

### Desktop

* Main content maximum width: approximately 1,200 px.
* Use a 12-column grid at wide breakpoints.
* Standard outer gutters: 32–48 px, depending on viewport.
* Long-form content should use a narrower reading column, approximately 640–760 px.
* Search results can use a main results column with a secondary filter/sidebar region.

### Mobile

* Use 16–20 px outer gutters.
* Prefer a single-column content flow.
* Keep primary actions reachable and visible without obscuring content.
* Filters should open in a full-height sheet or a dedicated screen when the filter set is complex.
* Never shrink a desktop two-column layout until its text becomes unreadable; change the structure instead.

### Surfaces and borders

* Use mostly square or softly rounded corners: 8–12 px for controls and 12–16 px for larger surfaces.
* Avoid giving every element a pill shape.
* Use subtle borders before adding shadows.
* Reserve stronger elevation for overlays, menus, and sheets.
* Keep card layouts editorial and varied by content; don't force every page into a uniform grid of identical cards.

# 7. Information architecture

The interface should reflect the two main journeys: finding tuition and finding a tutor.

## Public navigation

**Desktop navigation**

* Find tuition
* Find tutors
* How it works
* Sign in
* Create account

The primary navigation should stay compact. Do not put every product feature in the header.

**Authenticated tutor navigation**

* Opportunities
* My applications
* Messages
* My profile

**Authenticated guardian navigation**

* My listings
* Find tutors
* Messages
* Account

Use a role-aware navigation system. If one user has both roles, provide an explicit role switcher with clear labels. Do not silently change the meaning of the same screen based on hidden state.

## Route structure

Suggested route structure:

* `/` — Homepage
* `/tuition` — Tuition search
* `/tuition/:id` — Tuition details
* `/tutors` — Tutor search
* `/tutors/:id` — Public tutor profile
* `/register` — Account creation
* `/login` — Sign in
* `/onboarding/tutor` — Tutor setup
* `/onboarding/guardian` — Guardian setup
* `/dashboard/tutor` — Tutor overview
* `/dashboard/guardian` — Guardian overview
* `/applications` — Applications for the current role
* `/messages` — Conversations
* `/settings` — Account and privacy settings

A user should be able to navigate directly to a relevant page from a shared link and return to the previous context without losing search state.

# 8. Homepage: the first 10 seconds

The homepage must answer three questions immediately:

1. What is this platform?
2. Is it free to use?
3. What can I do here?

## Hero direction

Use a restrained editorial layout, not a giant generic gradient with a floating dashboard illustration.

**Suggested English headline:**

“Good teaching starts with the right connection.”

**Supporting copy:**

“Find a home tutor or discover tuition opportunities. Connect directly, without a tuition-matching commission.”

**Primary action:** Find a tutor
**Secondary action:** Find tuition

The wording must accurately reflect the platform's real business policy. If the platform is free for both parties, state that plainly.

### Hero composition

* Left: headline, one short explanation, two clear actions.
* Right: a purposeful visual showing a tutor and learner in an everyday study environment, or a typographic illustration of the matching process.
* Below: a short three-step explanation.
* Further down: relevant open opportunities or tutor discovery, followed by trust and safety explanations.

Avoid fabricated metrics such as “10,000 happy families” or made-up success rates.

### The distinctive interaction

The homepage should not immediately force a user to register. Let visitors begin by choosing their goal and exploring relevant content.

When a visitor selects “Find a tutor,” open a focused search experience. When they select “Find tuition,” open opportunities with a clear route to applying after signing in.

Registration should occur when the user wants to perform an action that actually requires an account.

# 9. Search: make the decision easier, not the screen busier

Search is the core product experience. Filters should reduce uncertainty, not become a wall of controls.

## Tuition search

Start with the highest-value filters:

* Area
* Subject
* Class or grade
* Monthly budget

Secondary filters can include university preference, curriculum, teaching schedule, days per week, and tutor gender preference.

### Search behavior

* Apply common filters immediately where performance allows.
* Display active filters as removable chips.
* Provide one obvious “Clear filters” action.
* Keep result counts and loading states accurate.
* Preserve filters when users open a listing and return.
* Offer an explicit empty state with ways to adjust the search.

On mobile, show a compact search summary and a “Filters” action that opens a dedicated sheet. Do not squeeze a sidebar into a narrow screen.

### Listing result design

A listing result should prioritize the information needed to judge fit:

**Mathematics tutor for Class 9**

Example Area · 3 days per week

Mathematics · National curriculum

**৳ 4,000–৳ 6,000 / month**

Schedule: evenings

[View tuition]

Keep the information hierarchy stable across results. The location, subject, class, salary, and schedule should be easy to compare without opening each listing.

Do not add decorative ratings, artificial “hot” labels, or urgency badges without reliable supporting data.

## Tutor search

Tutor results should prioritize:

* Name and profile photo, if provided
* University and academic status
* Subjects and grade levels
* Teaching experience
* Relevant availability
* Verification status, with an explanation

Do not rank tutors solely by payment, profile completion, or unverified popularity.

If ranking is introduced, document its logic and monitor whether it systematically disadvantages new tutors or particular groups.

# 10. Tutor profile: evidence before persuasion

A tutor profile should read like a concise professional introduction, not an advertising landing page.

## Recommended hierarchy

1. Name and relevant identity information
2. University and academic status
3. Subjects and classes taught
4. Experience and teaching approach
5. Availability and preferred areas
6. Expected tuition range
7. Verification explanation
8. Contact or application action

### Verification design

Use explicit labels:

* **Verified student** — the relevant student status has been checked under the platform's defined verification process.
* **Not verified** — the status has not been confirmed by that process.
* **Verification pending** — a submitted request is being reviewed.

Explain what was checked and what was not checked.

A university identity check does not prove teaching ability, reliability, background, or suitability for a particular child. The interface must never imply otherwise.

Do not publish student ID numbers, student ID images, private email addresses, or personal phone numbers in public profiles.

### Contact action

Use a primary action such as “Apply for this tuition” when viewing an opportunity, or “View tuition opportunities” when viewing a tutor profile.

Only show direct contact actions when the platform's contact-sharing policy permits them.

# 11. Tuition detail page: answer the parent's real questions

The detail page should help a tutor decide whether to apply.

### Content order

**First: essential facts**

* Class and subject
* Area
* Monthly budget
* Days per week
* Schedule
* Teaching mode

**Second: expectations**

* What the student needs help with
* Curriculum or learning context
* Preferred university or other eligibility requirements
* Any additional requirements

**Third: next action**

A clear “Apply for this tuition” action, plus a transparent explanation of what applying does.

For example:

“Applying sends your profile to the parent. Your phone number remains private unless contact details are shared under the platform's contact policy.”

The exact wording must match the implemented privacy behavior.

### Avoid

* Hiding the salary below a long description.
* Requiring registration just to see ordinary listing details.
* Using ambiguous labels such as “Get started” when “Apply for this tuition” is more specific.
* Presenting preferences as guaranteed selection criteria unless they actually are enforced.

# 12. Application flow: one clear commitment

Applying should feel simple and deliberate.

### Proposed sequence

1. Review tuition details.
2. Confirm the tutor's relevant profile information.
3. Add an optional introduction.
4. Review the application.
5. Submit.
6. Receive a clear confirmation and see the application status.

Do not require users to re-enter information already stored in their profiles.

### Application states

Use visible text labels, not color alone:

* Pending
* Shortlisted
* Accepted
* Not selected
* Withdrawn

Each state should explain what it means and whether the user needs to act.

Example:

**Application submitted**

“Your application has been sent to the parent. You can track its status from My applications.”

The confirmation page should offer one useful next action—not a collection of unrelated recommendations.

If an application is rejected, communicate the outcome respectfully. Do not imply that the tutor's personal worth or teaching ability has been judged universally.

# 13. Create a tuition listing: a guided conversation

This is one of the most important forms in the entire product. A parent may not know every field in advance.

Do not display a huge form with 15 fields at once.

Use a short, saveable, multi-step flow. Show progress and let users move backward without losing information.

### Step 1 — Who needs tutoring?

* Class or grade
* Curriculum
* Subjects

### Step 2 — Where?

* Area
* Approximate location description

Tell users not to enter a full home address in a public field.

### Step 3 — What schedule works?

* Days per week
* Preferred days and times
* Teaching mode

### Step 4 — Budget and preferences

* Monthly salary range
* Preferred university, if any
* Tutor gender preference, if any

Explain that preferences may affect the number of available applicants.

### Step 5 — Add context

* Short title
* Description
* Additional requirements

Offer optional prompts, such as:

“What should the tutor help the student improve?”

### Step 6 — Review and publish

Show a readable preview exactly as the public listing will appear.

Let users edit individual sections before publishing.

### Form rules

* Save progress when the user moves between steps.
* Clearly indicate required and optional fields.
* Use examples only when they genuinely help.
* Preserve entered values after validation errors.
* Validate on the server and provide actionable feedback.
* Ask for optional information only when its benefit is understandable.
* Allow drafts if the user needs to finish later.

The interface should feel like completing a small task, not filling out a government application.

# 14. Tutor onboarding: value before paperwork

Tutor onboarding should establish enough information to make the profile useful without demanding every possible detail immediately.

### Recommended stages

**Stage A — Account**

Name, email, phone if required, and password or supported sign-in method.

**Stage B — Academic background**

University, department, academic status, and study year where relevant.

**Stage C — Teaching**

Subjects, classes, curriculum, experience, and teaching approach.

**Stage D — Availability**

Areas, schedule, and expected tuition range.

**Stage E — Optional verification**

Explain the benefit and required evidence before asking the user to submit documents.

After the initial setup, show the tutor relevant opportunities even if some optional profile details remain incomplete.

Use profile completeness to guide improvement, not to shame users or block unrelated actions.

# 15. Dashboards that answer “What should I do next?”

Do not make the dashboard a collection of metrics that look impressive but do not help the user.

## Tutor dashboard

The first screen should answer:

* Are there new opportunities matching my preferences?
* What happened to my applications?
* Do I have unread messages?
* Is there one important profile action to complete?

Suggested hierarchy:

1. A brief personalized welcome.
2. Matching tuition opportunities.
3. Application status summary.
4. Recent messages.
5. One optional profile improvement.

## Guardian dashboard

The first screen should answer:

* Is my tuition listing published?
* Have tutors applied?
* What should I review next?
* Do I have new messages?

Suggested hierarchy:

1. Active listings.
2. New applications requiring attention.
3. Shortlisted tutors or application progress.
4. Messages.
5. Clear action to post another tuition.

Do not show empty chart widgets or arbitrary statistics when the user has little activity. New accounts should receive a helpful first-run experience instead.

# 16. Messaging and contact sharing

The product should make communication comfortable without pressuring users to reveal private details.

### Conversation design

* Clearly identify the other participant and the relevant tuition.
* Keep message history readable.
* Show sending, sent, failed, and retry states.
* Preserve message drafts where feasible.
* Make reporting and blocking or safety controls discoverable.
* Provide sensible pagination for long conversations.

### Contact-sharing consent

When a user chooses to share a phone number, explain what will be shared and with whom before confirming.

Use a confirmation such as:

“Share your phone number with this parent?”

Buttons: “Share number” and “Keep private.”

Never use a preselected consent checkbox for sensitive sharing. Record the consent event and enforce access control on the backend.

The interface must not imply that contact sharing is reversible if the recipient may already have seen or saved the information.

# 17. The component system

Create a small, coherent design system rather than inventing new styles on every screen.

### Core components

* `Button`
* `TextField`
* `PhoneField`
* `Select`
* `MultiSelect`
* `Checkbox`
* `RadioGroup`
* `FilterSheet`
* `FilterChip`
* `SearchBar`
* `TutorProfileHeader`
* `TutorResult`
* `TuitionListingSummary`
* `ApplicationStatus`
* `VerificationBadge`
* `ScheduleSummary`
* `SalaryRange`
* `EmptyState`
* `ErrorSummary`
* `Toast`
* `ConfirmDialog`
* `Pagination`
* `LoadingSkeleton`

### Button hierarchy

**Primary:** One main action per major decision area.

**Secondary:** A meaningful alternative, such as previewing before publishing.

**Tertiary:** Lower-priority actions, such as viewing more details.

**Destructive:** Actions such as closing or deleting, separated visually from ordinary actions.

Do not render every button as a filled green rectangle.

### Component states

Every interactive component must specify:

* Default
* Hover, where applicable
* Focus-visible
* Pressed
* Disabled
* Loading
* Success or selected
* Error, where applicable

Disabled controls must have an understandable explanation when the reason is not obvious.

# 18. Motion and micro-interactions

Motion should make the interface feel responsive, not performative.

### Use motion for

* Expanding a filter panel.
* Transitioning between form steps.
* Confirming a successful application.
* Updating application status.
* Opening menus and dialogs.
* Showing a message sent successfully.

### Timing guidelines

* Small state changes: approximately 120–180 ms.
* Menus and panels: approximately 180–240 ms.
* Larger transitions: approximately 200–300 ms.

These are initial design targets; actual timing should be tested on real devices.

Prefer simple opacity and transform transitions. Avoid exaggerated spring animations on every button, constant floating elements, animated gradient backgrounds, and celebration effects for routine actions.

Respect `prefers-reduced-motion`. Every important state change must remain understandable without animation.

# 19. Empty, loading, error, and success states

These states are part of the product, not polish to add later.

### Empty search

**No matching tuition found**

“Try a nearby area, adjust the budget, or remove a filter.”

Offer actions to adjust filters. Do not simply display a sad illustration.

### No applications yet

**No applications yet**

“When you find tuition that fits your subjects and schedule, your applications will appear here.”

### Network failure

**We couldn't load this page**

“Your internet connection may be interrupted. Try again.”

Preserve search filters and unsaved form values where possible.

### Validation error

“Enter a valid phone number, including the Bangladesh country code if needed.”

Explain the problem and the correction. Keep the user's other valid inputs.

### Successful action

**Tuition published**

“Your listing is now available to tutors.”

Offer “View listing” as the obvious next action.

Never show success before the server confirms the operation. Distinguish a failed request from an operation that may have succeeded but whose response was lost.

# 20. Accessibility and inclusive usability

Accessibility is a product quality requirement, not a final audit task.

Target **WCAG 2.2 AA** for the web interface.

Minimum requirements:

* Complete keyboard navigation.
* Visible focus indicators.
* Proper heading hierarchy and semantic HTML.
* Accessible names for icon-only buttons.
* Labels that remain visible when fields are filled.
* Error messages connected to their fields.
* Screen-reader announcements for important asynchronous changes.
* Sufficient color contrast.
* Touch targets that meet WCAG 2.2 minimum requirements; aim for approximately 44 × 44 CSS pixels where practical.
* No information communicated only through color.
* Layout support for text enlargement and browser zoom.
* Bangla font and text-wrapping tests.
* Reduced-motion support.

Use familiar input patterns. For dates, schedules, and locations, do not make users learn a custom interaction when a standard control is more understandable.

Do not rely exclusively on hover states, tiny icons, or drag-and-drop interactions.

# 21. Mobile-first behavior and performance

Many users will access the product from a mobile browser. The experience should remain useful on modest devices and inconsistent connections.

### Mobile requirements

* Search results must remain readable at narrow widths.
* Long filters should use sheets or dedicated screens.
* Forms should use appropriate mobile keyboards.
* Sticky action bars must not cover fields or messages.
* The browser back button must behave predictably.
* Search state should survive navigation where possible.
* Images should be responsive and appropriately compressed.
* Loading placeholders should match the content they replace.
* Avoid large decorative images that delay the main task.

Define performance budgets with the engineering team and measure Core Web Vitals using real-user data after launch. Do not treat an animation-heavy page as successful simply because it looks impressive on a fast development computer.

# 22. Trust, privacy, and safety by design

This marketplace connects people in a sensitive real-world context. Design decisions must account for that.

* Public profiles must not expose student ID evidence or private guardian details.
* Do not reveal exact home addresses in public listings.
* Make verification criteria explicit.
* Never use fake ratings, invented testimonials, or misleading trust claims.
* Keep contact details private until the implemented policy permits sharing.
* Give users a visible way to report suspicious listings or behavior.
* Provide clear explanations for suspended listings and accounts where disclosure is appropriate.
* Make consent specific, informed, and recorded.
* Avoid exposing personal data in notifications or public URLs.
* Ensure that users can access privacy and account settings without hunting through the interface.

If minors may use the service, the product team must establish appropriate age, guardian-consent, communication, and safeguarding requirements before launch. Do not assume that a profile verification badge alone makes an interaction safe.

# 23. Content design and interface language

Use simple, respectful, direct language.

Prefer:

* “Find a tutor”
* “Post a tuition”
* “Apply for this tuition”
* “Review applications”
* “Share phone number”
* “Keep contact details private”

Avoid:

* “Unlock your potential” as a substitute for explaining a feature.
* “Supercharge your learning journey.”
* “Congratulations! You're a rockstar!”
* “Oopsie!”
* Vague actions such as “Continue” when a more specific label is possible.

Use Bangla that sounds natural to local users when localization is introduced. Do not translate English UI labels word-for-word if the resulting Bangla sounds unnatural.

# 24. Design acceptance criteria

A screen is not complete simply because it matches a mockup.

Each core journey must be tested for usability, accessibility, correctness, and recovery.

### Core usability tests

1. A parent can find and understand a suitable tuition listing without registering.
2. A parent can create, review, and publish a tuition listing without losing entered information.
3. A tutor can find relevant opportunities and understand the requirements before applying.
4. A tutor can submit an application and later understand its status.
5. A parent can compare applicants without needing to inspect private documents.
6. Both parties understand when contact information is shared.
7. A user can recover from a validation error without re-entering the whole form.
8. A user can use the core journeys on mobile with keyboard and screen-reader support.
9. A Bangla-language layout, when enabled, remains readable and structurally sound.
10. A suspended or unauthorized user cannot complete restricted actions merely by navigating directly to a URL.

### Product metrics to monitor

Measure whether the design actually helps people:

* Search-to-listing-detail rate.
* Listing-detail-to-application rate.
* Listing creation completion rate.
* Tutor profile completion rate.
* Application review and response time.
* Percentage of users who abandon a form at each step.
* Search refinement rate after zero results.
* Contact-sharing consent rate.
* Support requests caused by confusion.
* Accessibility defects and performance metrics.

Do not optimize solely for clicks or time spent. A user who finds a suitable tutor quickly and leaves satisfied may represent a better outcome than a user who browses for an hour.

# 25. Recommended design and implementation workflow

Follow this sequence before building the full UI.

**Phase 1 — Validate the problem**

Interview a small mix of Bangladeshi parents and tutors. Ask how they currently find tuition, what information they need, what makes them suspicious, and where existing processes waste time.

**Phase 2 — Prototype the critical journeys**

Create interactive wireframes for:

* Homepage to tutor search.
* Homepage to tuition search.
* Tutor application.
* Parent listing creation.
* Parent reviewing applications.
* Contact-sharing consent.

**Phase 3 — Test before visual polish**

Observe real users completing the tasks. Look for hesitation, misunderstandings, missed controls, and unnecessary steps. Revise the information architecture before investing in elaborate visuals.

**Phase 4 — Establish design tokens and components**

Implement the typography, colors, spacing, component states, and responsive behavior as reusable tokens and components.

**Phase 5 — Build complete states**

Include loading, empty, error, success, disabled, unauthorized, and mobile states from the beginning.

**Phase 6 — Test with real data**

Use realistic Bangladeshi locations, university names, class levels, salary ranges in BDT, Bangla text, long names, and incomplete profiles. Do not validate the design only with short English placeholder text.

**Phase 7 — Release and improve**

Track usability and performance, review support requests, and conduct follow-up tests. Treat the design system as a living product asset.

# 26. Final design principles

The product should be recognizable through its restraint, not through visual noise.

1. **Human before decorative.** Every visual choice must improve comprehension, confidence, or task completion.
2. **Evidence before claims.** Verification must explain what was actually checked.
3. **Content before containers.** Use cards only when grouping content genuinely helps.
4. **Progress before pressure.** Help people complete tasks without artificial urgency.
5. **Context before complexity.** Show advanced options when they become relevant.
6. **Privacy before conversion.** Never sacrifice user control to increase contact-sharing rates.
7. **Real behavior before mockup perfection.** A beautiful screen that fails on mobile or during an error is not finished.
8. **Local fluency before superficial localization.** Bengali typography, familiar terminology, local schedules, and BDT formatting deserve deliberate design.
9. **Consistency without monotony.** Shared components should behave predictably, while different tasks receive layouts suited to their purpose.
10. **Trust earned through details.** Clear status, honest feedback, useful empty states, and recoverable mistakes matter more than a badge that says “trusted.”

## The intended outcome

When a parent opens the platform, they should quickly understand where to find a tutor and feel in control of their family's information.

When a tutor opens it, they should find genuine opportunities, understand what is expected, and be able to apply without unnecessary friction.

When either person makes a mistake, the interface should help them recover without embarrassment or lost work.

**The benchmark is not whether the product resembles a famous design. It is whether people can accomplish an important real-world task with less uncertainty, less effort, and greater confidence.**

That is the design standard this marketplace should aim to meet.
