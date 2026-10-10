import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'How it works — AMR Tutor',
};

const STEPS = [
  {
    title: '1. Search without signing up',
    description:
      'Browse published tuition opportunities or tutor profiles freely. You only need an account once you want to apply, publish a listing, or message someone.',
  },
  {
    title: '2. Connect directly',
    description:
      'A tutor applies to a tuition opportunity with their profile. A guardian reviews applicants and decides who to talk to — no middleman makes that decision for you.',
  },
  {
    title: '3. Agree on your own terms',
    description:
      'The platform never collects payments, charges a placement commission, or negotiates on your behalf. Tuition fees and schedules are agreed between you and the other person.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <Container as="main" narrow className="flex flex-col gap-10 py-14">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-ink">How it works</h1>
          <p className="text-lg text-ink-secondary">
            A free, direct way for guardians and tutors across Bangladesh to find each other — no
            commissions, no payments, no wallet.
          </p>
        </div>

        <ol className="flex flex-col gap-8">
          {STEPS.map((step) => (
            <li key={step.title} className="flex flex-col gap-2 border-l-2 border-primary/30 pl-6">
              <h2 className="text-xl font-semibold text-ink">{step.title}</h2>
              <p className="text-ink-secondary">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-ink">About verification</h2>
          <p className="text-sm text-ink-secondary">
            Student verification is optional. When a tutor is marked{' '}
            <span className="font-medium text-ink">Verified student</span>, it means their
            university affiliation has been checked — it does not prove teaching ability,
            reliability, or suitability for a particular child. A guardian should still use their
            own judgment when deciding who to work with.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/tutors">Find a tutor</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/tuition">Find tuition</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
