import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy — AMR Tutor',
  description: 'How AMR Tutor collects, uses, protects, and lets you delete your personal information.',
};

const UPDATED = '16 October 2026';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. What this policy covers',
    body: (
      <p>
        This policy explains what personal information AMR Tutor collects from tutors and guardians,
        why we collect it, who can see it, how long we keep it, and how you can access, correct, or
        delete it. It applies to the AMR Tutor website and the account you create on it. It does not
        apply to arrangements you make directly with another user once you have connected — once
        contact information is shared by mutual consent, what you do with it is between you and the
        other person.
      </p>
    ),
  },
  {
    heading: '2. Information we collect',
    body: (
      <>
        <p>
          We only ask for information we have a clear use for. We group it into three tiers, and each
          tier is visible to a different, narrower audience:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong className="text-ink">Public.</strong> Your display name, headline, subjects or
            classes you teach or need, general area (never an exact address), expected rate range, and
            the outcome of any verification (e.g. &ldquo;university affiliation verified&rdquo;) — never
            the evidence behind it. Anyone browsing the site, including visitors who haven&apos;t
            registered, can see this.
          </li>
          <li>
            <strong className="text-ink">Authenticated-private.</strong> Your application history,
            message content, draft listings, and scheduling notes. Visible only to you and the specific
            counterparty in an active application or conversation — for example, a guardian who received
            your application.
          </li>
          <li>
            <strong className="text-ink">Sensitive-private.</strong> Your phone number, email address,
            exact address, a guardian&apos;s emergency contact, and any verification evidence you upload
            (student ID, academic documents, national ID card). Visible only to you and the specific
            administrators or reviewers described in section 5 — never published, searched, or shown to
            other members.
          </li>
        </ul>
        <p>
          We also automatically receive standard technical information (such as IP address and browser
          type) when you use the site, for security and abuse prevention.
        </p>
      </>
    ),
  },
  {
    heading: '3. How we use your information',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>To create and operate your account and profile.</li>
        <li>To show tutors relevant tuition listings and guardians relevant applicants.</li>
        <li>To review university-affiliation and academic-credential verification requests.</li>
        <li>To review guardian identity-verification requests.</li>
        <li>To enable messaging between a tutor and a guardian who have an active application.</li>
        <li>To share contact details only after both sides explicitly consent.</li>
        <li>To investigate reports of suspicious listings, profiles, or behavior.</li>
        <li>To keep the platform secure and prevent fraud, spam, and automated abuse.</li>
      </ul>
    ),
  },
  {
    heading: '4. Contact sharing is always your choice',
    body: (
      <p>
        Your phone number and email stay private by default. We only reveal them to another specific
        user after you and that user have each separately and explicitly agreed to share contact
        details on a given application — this consent is recorded, never inferred from an application
        being accepted or a conversation continuing. Your exact address and a guardian&apos;s emergency
        contact are never shared this way; they are not part of contact sharing at all.
      </p>
    ),
  },
  {
    heading: '5. Who inside AMR Tutor can see sensitive information, and why',
    body: (
      <>
        <p>Administrative access is role-based and limited to what each role needs to do its job:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong className="text-ink">Verifiers</strong> can see a tutor&apos;s university-affiliation
            or academic-credential evidence only for a request assigned to them, so they can decide it.
          </li>
          <li>
            <strong className="text-ink">Moderators</strong> can see reports filed against a listing,
            profile, or conversation, so they can investigate and act on them.
          </li>
          <li>
            <strong className="text-ink">Administrators</strong> can review pending listings, resolve
            verification appeals, and change an account&apos;s status (for example, suspending it) under
            documented rules.
          </li>
        </ul>
        <p>
          Every action an administrator takes is written to an audit log. No elevated role gets automatic
          access to private messages or contact details beyond what that specific task requires.
        </p>
      </>
    ),
  },
  {
    heading: '6. Verification evidence',
    body: (
      <p>
        If you submit evidence for university-affiliation, academic-credential, or guardian
        identity-verification (such as a student ID, transcript, or national ID card), it is stored
        privately and used only to decide that request. Once a verification request reaches a final
        outcome — approved, rejected, or cancelled — we delete the underlying evidence file within 90
        days. We keep the outcome itself (for example, that a tutor&apos;s university affiliation was
        verified) indefinitely, because that is the part other users rely on; the document behind it is
        not.
      </p>
    ),
  },
  {
    heading: '7. How long we keep your data',
    body: (
      <p>
        We keep account and profile data for as long as your account is active. If you ask us to delete
        your account, we remove your personally identifying profile information and anonymize it. Where
        another user genuinely relies on a record you were part of — such as an application a guardian
        reviewed, or a conversation a tutor had — that history is retained in anonymized form rather than
        deleted outright, so the other person&apos;s own records stay intact. Verification evidence
        follows the 90-day window described in section 6 regardless of account status.
      </p>
    ),
  },
  {
    heading: '8. Cookies and tracking',
    body: (
      <p>
        AMR Tutor does not run third-party advertising or analytics trackers. We use a single essential
        cookie to keep you signed in between visits (an <code>HttpOnly</code> session cookie that a
        script on another site cannot read or send). We do not use that cookie, or any other, to track
        you across other websites.
      </p>
    ),
  },
  {
    heading: '9. Your choices and rights',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>You can review and update most of your profile information at any time from your account.</li>
        <li>You can pause a tutor profile or a listing without deleting it.</li>
        <li>You can withdraw a verification request before it is decided.</li>
        <li>
          You can request that we delete your account; we will anonymize your personal information as
          described in section 7.
        </li>
        <li>
          You can ask us what personal information we hold about you, or report a privacy concern, using
          the contact details in section 12.
        </li>
      </ul>
    ),
  },
  {
    heading: '10. Children and minors',
    body: (
      <p>
        AMR Tutor accounts are for adults — university-student tutors and adult parents or guardians.
        A guardian arranges tuition on behalf of a child without the child needing, or being asked, to
        create their own account, and we do not knowingly collect personal information directly from
        children through the platform. A guardian&apos;s emergency contact, where provided, is treated
        as sensitive-private information under section 2 and is never published or searchable.
      </p>
    ),
  },
  {
    heading: '11. Security',
    body: (
      <p>
        We restrict access to sensitive data by role, log administrative actions, and apply standard
        safeguards such as encrypted connections and access controls to the systems that store your
        information. No online service can guarantee perfect security, but we design the platform so
        that sensitive data is private by default and only reachable through an authorized, audited
        path.
      </p>
    ),
  },
  {
    heading: '12. Changes to this policy and how to reach us',
    body: (
      <p>
        If we make a material change to this policy, we will update the date at the top of this page.
        If you have a question about this policy or want to exercise any of the choices in section 9,
        contact us through the support channel linked in your account, or at{' '}
        <a href="mailto:privacy@amrtutor.com" className="text-primary hover:underline">
          privacy@amrtutor.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro={
        <p>
          AMR Tutor is a free, direct marketplace connecting tutors and guardians across Bangladesh.
          We only collect the information we need to run that marketplace, we keep sensitive information
          private by default, and we never sell your personal information.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
