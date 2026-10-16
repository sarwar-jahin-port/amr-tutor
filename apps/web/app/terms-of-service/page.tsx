import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service — AMR Tutor',
  description: 'The terms that govern use of the AMR Tutor tutor-guardian marketplace.',
};

const UPDATED = '16 October 2026';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Agreement to these terms',
    body: (
      <p>
        These terms govern your use of AMR Tutor. By creating an account or otherwise using the
        platform, you agree to them. If you do not agree, please do not use AMR Tutor.
      </p>
    ),
  },
  {
    heading: "2. What AMR Tutor is — and isn't",
    body: (
      <>
        <p>
          AMR Tutor is a free, direct-connection marketplace that helps university-student tutors and
          parents or guardians in Bangladesh find and evaluate each other. We do not charge a placement
          commission, we do not take a cut of any tuition fee, and we do not process payments between
          tutors and guardians.
        </p>
        <p>AMR Tutor is not a tutoring agency, is not your employer, and is not a party to any tuition arrangement. Specifically, we do not:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Employ, supervise, or set the pay of any tutor.</li>
          <li>Negotiate fees, schedules, or terms on anyone&apos;s behalf.</li>
          <li>Guarantee a tutor&apos;s competence, conduct, reliability, or academic results.</li>
          <li>Guarantee the safety of any in-person meeting or tuition arrangement.</li>
        </ul>
        <p>
          Tutors and guardians independently agree on fees, schedules, and all other terms of any
          tuition arrangement, and are solely responsible for that arrangement.
        </p>
      </>
    ),
  },
  {
    heading: '3. Who can use AMR Tutor',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>You must be an adult capable of entering a binding agreement under Bangladeshi law.</li>
        <li>
          You register as a <strong className="text-ink">Tutor</strong>, a{' '}
          <strong className="text-ink">Guardian</strong>, or both.
        </li>
        <li>The information you provide about yourself must be accurate and kept up to date.</li>
        <li>One account per person. You are responsible for all activity under your account.</li>
      </ul>
    ),
  },
  {
    heading: '4. Listings and applications',
    body: (
      <p>
        A guardian who publishes a tuition listing submits it for admin review before it becomes
        publicly visible; we may reject a listing that is incomplete, misleading, or violates these
        terms. A tutor who applies to a listing represents that the qualifications and information in
        their profile are truthful. Accepting an application, requesting contact, or exchanging messages
        on AMR Tutor does not create any obligation between AMR Tutor and either party — the resulting
        tuition arrangement, if any, is strictly between the tutor and the guardian.
      </p>
    ),
  },
  {
    heading: '5. Verification',
    body: (
      <p>
        AMR Tutor offers optional verification of phone control, university affiliation, and academic
        credentials for tutors, and identity verification for guardians, based on evidence the user
        submits. A verification outcome reflects only what was reviewed — it is not a guarantee of a
        tutor&apos;s teaching ability, a guardian&apos;s intentions, or anyone&apos;s personal safety. Do
        not rely on a verification badge alone when deciding whether to meet or work with someone; see
        our <a href="/safety-guidelines" className="text-primary hover:underline">Safety Guidelines</a>.
      </p>
    ),
  },
  {
    heading: '6. Fees and payment',
    body: (
      <p>
        Creating a profile, publishing a listing, applying, and messaging on AMR Tutor are free and will
        remain free of any placement commission. AMR Tutor never requests payment to unlock an
        application, a message, or contact details, and never asks you to pay AMR Tutor for a tuition
        fee on another user&apos;s behalf. Any tuition fee is agreed directly between tutor and guardian
        and paid directly between them, outside the platform.
      </p>
    ),
  },
  {
    heading: '7. Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Provide false identity, academic, or verification information, or impersonate anyone.</li>
          <li>Publish a listing or profile that is fraudulent, discriminatory, or misleading.</li>
          <li>Harass, threaten, or discriminate against another user.</li>
          <li>Request or demand payment, a deposit, or gifts as a condition of continuing contact.</li>
          <li>Use the platform to recruit for anything other than genuine home tuition.</li>
          <li>
            Scrape, data-mine, or use automated tools to create accounts, listings, or applications.
          </li>
          <li>Attempt to bypass verification review, moderation, or account-status restrictions.</li>
          <li>Share another user&apos;s private information without their consent.</li>
        </ul>
      </>
    ),
  },
  {
    heading: '8. Reporting and moderation',
    body: (
      <p>
        You can report a listing, profile, or conversation you believe is suspicious or violates these
        terms using the report option on that page. A moderator or administrator reviews each report and
        may warn, restrict, or suspend an account, or remove content, under our internal review process.
        We will give a reason for a suspension or removal where doing so doesn&apos;t compromise the
        review of an active report.
      </p>
    ),
  },
  {
    heading: '9. Content you submit',
    body: (
      <p>
        You retain ownership of the profile information, listing content, and messages you submit, but
        you grant AMR Tutor the license needed to host, display, and transmit it as part of operating
        the platform — for example, showing your public profile in search results, or delivering your
        message to its recipient. You are responsible for the accuracy and legality of what you submit.
      </p>
    ),
  },
  {
    heading: '10. Disclaimers',
    body: (
      <p>
        AMR Tutor is provided &ldquo;as is.&rdquo; We do not guarantee that the platform will be
        uninterrupted or error-free, that any listing or profile is accurate, or that any tutoring
        arrangement will be safe or successful. To the fullest extent permitted by law, AMR Tutor
        disclaims warranties of any kind, express or implied, regarding the platform or any interaction
        it facilitates between users.
      </p>
    ),
  },
  {
    heading: '11. Limitation of liability',
    body: (
      <p>
        To the fullest extent permitted by law, AMR Tutor and its operators are not liable for any
        indirect, incidental, or consequential damages arising from your use of the platform, or from
        any tuition arrangement, meeting, or dispute between a tutor and a guardian. You are solely
        responsible for exercising judgment and reasonable care — including the precautions in our{' '}
        <a href="/safety-guidelines" className="text-primary hover:underline">Safety Guidelines</a> —
        in any interaction arranged through AMR Tutor.
      </p>
    ),
  },
  {
    heading: '12. Suspension and termination',
    body: (
      <p>
        You may stop using AMR Tutor and request deletion of your account at any time. We may suspend or
        terminate an account that violates these terms, under the moderation process described in
        section 8. See our{' '}
        <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> for what
        happens to your data when an account is deleted.
      </p>
    ),
  },
  {
    heading: '13. Governing law',
    body: (
      <p>
        These terms are governed by the laws of Bangladesh, without regard to conflict-of-law
        principles.
      </p>
    ),
  },
  {
    heading: '14. Changes to these terms',
    body: (
      <p>
        We may update these terms as the platform evolves. If we make a material change, we will update
        the date at the top of this page. Continuing to use AMR Tutor after a change takes effect means
        you accept the updated terms.
      </p>
    ),
  },
  {
    heading: '15. Contact',
    body: (
      <p>
        Questions about these terms can be sent to{' '}
        <a href="mailto:support@amrtutor.com" className="text-primary hover:underline">
          support@amrtutor.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={UPDATED}
      intro={
        <p>
          These terms explain what you can expect from AMR Tutor, what we expect from you, and the
          limits of what a free, direct tutor-guardian marketplace can promise.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
