import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Safety Guidelines — AMR Tutor',
  description: 'Practical guidance for tutors and guardians connecting safely on AMR Tutor.',
};

const UPDATED = '16 October 2026';

const SECTIONS: LegalSection[] = [
  {
    heading: "1. What verification does and doesn't tell you",
    body: (
      <>
        <p>AMR Tutor shows up to three separate verification indicators on a tutor&apos;s profile. Each one is honest about what it actually checked:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong className="text-ink">Phone verified</strong> — the tutor controls the phone number
            on their account. It says nothing about their qualifications or conduct.
          </li>
          <li>
            <strong className="text-ink">University affiliation verified</strong> — a reviewer checked
            evidence of current or recent enrollment at the stated university. It does not confirm
            teaching ability.
          </li>
          <li>
            <strong className="text-ink">Academic credentials reviewed</strong> — a reviewer checked
            evidence behind a specific claimed qualification. It does not guarantee the tutor&apos;s
            behavior in your home.
          </li>
        </ul>
        <p>
          A guardian&apos;s identity verification works the same way: it confirms a reviewer checked a
          government-issued ID, nothing more. Treat every badge as one useful data point, not proof that
          an interaction will be safe.
        </p>
      </>
    ),
  },
  {
    heading: '2. Before you connect',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>Read the full profile or listing, not just the headline — check subjects, location, and schedule actually match what you need.</li>
        <li>Keep the first few messages on AMR Tutor rather than moving to another app immediately — it keeps a record you can refer back to if something goes wrong.</li>
        <li>Be cautious of anyone who pressures you to decide quickly, to meet immediately, or to move off-platform before you&apos;ve exchanged basic information.</li>
        <li>For a guardian: ask a prospective tutor about their experience and availability before agreeing to a first session.</li>
        <li>For a tutor: ask enough about the family and the student&apos;s needs to confirm this is a genuine tuition request.</li>
      </ul>
    ),
  },
  {
    heading: '3. Sharing contact information',
    body: (
      <p>
        Your phone number and email are never shown to another user until you both explicitly agree to
        share them on that specific application. Only agree once you&apos;re reasonably confident the
        other person is who they say they are. You never need to share your exact home address through
        the platform — a listing only needs a general area, and a first meeting is safest somewhere
        neutral (see section 4).
      </p>
    ),
  },
  {
    heading: '4. Meeting for the first time',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>Hold the first session, or at least the first meeting, somewhere a family member or guardian is present rather than a tutor and student alone in an unfamiliar setting.</li>
        <li>A guardian should be present for, or nearby during, a tutor&apos;s initial visits, especially when the student is a minor.</li>
        <li>Confirm the person who arrives matches who you&apos;ve been messaging — ask to see the ID that matches their verified name if anything feels off.</li>
        <li>Tell a friend or family member when and where you&apos;re meeting someone from the platform for the first time.</li>
        <li>Trust your instincts. It is always reasonable to end a meeting, decline a session, or stop responding if something feels wrong.</li>
      </ul>
    ),
  },
  {
    heading: '5. Money',
    body: (
      <p>
        AMR Tutor never charges a placement commission and never processes any tuition payment —
        fees are agreed directly between tutor and guardian and paid directly between them. Be
        suspicious of anyone who asks you to pay a deposit, a registration fee, or any amount to AMR
        Tutor itself, or who asks a tutor to pay to &ldquo;confirm&rdquo; a tuition placement. That is
        not how this platform works, and is a common scam pattern.
      </p>
    ),
  },
  {
    heading: '6. Protecting the student',
    body: (
      <p>
        Tutoring usually involves a child or teenage student who is not the one making platform
        decisions. The guardian who publishes a listing or reviews applicants is responsible for
        supervising early sessions, setting ground rules for where and when tutoring happens, and
        checking in with the student about how sessions are going — rather than relying on a
        verification badge as a substitute for that oversight.
      </p>
    ),
  },
  {
    heading: '7. Recognizing suspicious behavior',
    body: (
      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>A profile or listing with inconsistent, implausible, or copied-sounding details.</li>
        <li>Pressure to move off-platform, share contact details, or meet in person unusually quickly.</li>
        <li>Any request for payment, a deposit, or gifts before a tuition arrangement has even started.</li>
        <li>Refusal to answer basic questions about qualifications, the student, or the household.</li>
        <li>Requests for sensitive personal or financial information unrelated to tutoring.</li>
      </ul>
    ),
  },
  {
    heading: '8. Reporting a problem',
    body: (
      <p>
        Use the report option on a profile, listing, or conversation if you see any of the above, or
        anything else that concerns you. A moderator reviews every report and can restrict or suspend
        an account. Reporting something doesn&apos;t end the conversation for you automatically — if you
        feel unsafe, stop responding and leave the conversation on your own terms first, then report it.
        If you believe you or someone else is in immediate danger, contact local emergency services
        before anything else.
      </p>
    ),
  },
];

export default function SafetyGuidelinesPage() {
  return (
    <LegalPage
      title="Safety Guidelines"
      updated={UPDATED}
      intro={
        <p>
          AMR Tutor helps tutors and guardians find each other, but it can&apos;t supervise what happens
          once you connect. These guidelines cover the practical steps that keep that connection safe —
          please read them alongside our{' '}
          <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a> and{' '}
          <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
