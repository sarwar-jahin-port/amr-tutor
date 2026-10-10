import { CircleCheck, HandHeart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { searchListings, searchTutors } from '@/features/marketplace/api';
import { getApiHealth } from '@/lib/api-client';

const STEPS = [
  {
    title: 'Search without signing up',
    description: 'Browse tutors or tuition opportunities freely — no account needed to look around.',
  },
  {
    title: 'Connect directly',
    description: "Apply to a tuition opportunity or view a tutor's profile once you find the right fit.",
  },
  {
    title: 'Agree on your own terms',
    description: 'No commissions, no payments collected, and no middleman fees — ever.',
  },
];

const TRUST_POINTS = [
  {
    icon: HandHeart,
    title: 'Free for everyone',
    description: 'No commissions, no subscription, no hidden fees for tutors or guardians.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by default',
    description: 'Phone numbers and emails stay private until both sides agree to share them.',
  },
  {
    icon: CircleCheck,
    title: 'Verification, explained honestly',
    description: "We tell you exactly what's been checked about a tutor — and what hasn't.",
  },
];

export default async function HomePage() {
  const [health, listings, tutors] = await Promise.all([
    getApiHealth(),
    searchListings({ page: 1 }),
    searchTutors({ page: 1 }),
  ]);

  const recentListings = listings.status === 'ok' ? listings.data.slice(0, 3) : [];
  const recentTutors = tutors.status === 'ok' ? tutors.data.slice(0, 3) : [];

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <Container className="grid gap-10 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Good teaching starts with the right connection.
            </h1>
            <p className="max-w-md text-lg text-ink-secondary">
              Find a home tutor or discover tuition opportunities. Connect directly, without a
              tuition-matching commission.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/tutors">Find a tutor</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/tuition">Find tuition</Link>
              </Button>
            </div>
          </div>

          {/* The "learning line": a functional signature element, not decoration (ui-ux.md §3). */}
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="mb-6 text-sm font-medium text-ink-secondary">A tuition opportunity, at a glance</p>
            <ol className="flex flex-col gap-0">
              {['Class 9', 'Mathematics', '3 days/week', 'Nearby area'].map((step, index, arr) => (
                <li key={step} className="relative flex items-center gap-4 pb-6 last:pb-0">
                  {index < arr.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[7px] top-4 h-full w-px bg-primary/30"
                    />
                  )}
                  <span className="relative z-10 size-[15px] shrink-0 rounded-full border-2 border-primary bg-surface" />
                  <span className="text-lg font-medium text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>

        {/* Three-step explanation */}
        <div className="border-y border-border bg-canvas">
          <Container className="grid gap-8 py-14 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                <h2 className="text-lg font-semibold text-ink">{step.title}</h2>
                <p className="text-sm text-ink-secondary">{step.description}</p>
              </div>
            ))}
          </Container>
        </div>

        {/* Recent opportunities / tutors, only shown once real content exists */}
        {(recentListings.length > 0 || recentTutors.length > 0) && (
          <Container className="flex flex-col gap-10 py-14">
            {recentListings.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-ink">Recent tuition opportunities</h2>
                  <Link href="/tuition" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {recentListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/tuition/${listing.id}`}
                      className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
                    >
                      <p className="font-semibold text-ink">{listing.title}</p>
                      <p className="text-sm text-ink-secondary">
                        {listing.area} · {listing.classLevel}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {recentTutors.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-ink">Tutors ready to teach</h2>
                  <Link href="/tutors" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {recentTutors.map((tutor) => (
                    <Link
                      key={tutor.id}
                      href={`/tutors/${tutor.id}`}
                      className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5 transition-colors duration-fast hover:border-primary"
                    >
                      <p className="font-semibold text-ink">{tutor.fullName}</p>
                      <p className="text-sm text-ink-secondary">{tutor.university.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </Container>
        )}

        {/* Trust and safety */}
        <div className="border-t border-border bg-canvas">
          <Container className="grid gap-8 py-14 sm:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-2">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                <p className="text-sm text-ink-secondary">{description}</p>
              </div>
            ))}
          </Container>
        </div>

        <Container className="flex justify-center py-6">
          <Badge variant={health ? 'success' : 'danger'}>
            API status: {health ? `online (${health.uptimeSeconds}s uptime)` : 'unreachable'}
          </Badge>
        </Container>
      </main>
    </>
  );
}
