import { CircleCheck, GraduationCap, HandHeart, Search, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SiteHeader } from '@/components/site-header';
import { getListing, searchListings, searchTutors } from '@/features/marketplace/api';
import { TuitionOpportunityCard } from '@/features/marketplace/tuition-opportunity-card';
import { TutorSpotlightCard } from '@/features/marketplace/tutor-spotlight-card';
import type { ListingDetail } from '@/features/marketplace/types';
import { getApiHealth } from '@/lib/api-client';

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

  const recentListingSummaries = listings.status === 'ok' ? listings.data.slice(0, 3) : [];
  const recentListings = (
    await Promise.all(recentListingSummaries.map((listing) => getListing(listing.id)))
  )
    .map((result) => (result.status === 'ok' ? result.data : null))
    .filter((listing): listing is ListingDetail => listing !== null);

  const recentTutors = tutors.status === 'ok' ? tutors.data.slice(0, 3) : [];

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden bg-canvas">
          <Container className="grid gap-10 pt-8 pb-0 md:grid-cols-2 md:items-stretch md:py-24">
            <div className="flex flex-col gap-6">
              <div className="animate-fade-up relative inline-flex w-fit items-center">
                <svg
                  className="animate-wiggle absolute -left-6 -top-4 size-5 text-primary/50"
                  style={{ transformOrigin: '4px 10px' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 10L8 6" />
                  <path d="M4 17L9 15" />
                </svg>
                <Badge
                  variant="success"
                  className="-rotate-2 rounded-full border-none px-4 py-1.5 text-sm font-medium"
                >
                  Bangladesh&apos;s First
                </Badge>
                <svg
                  className="animate-bob absolute -right-7 -top-5 size-6 rotate-6 text-primary/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3 12C7 4 13 4 15 10C17 16 21 14 21 9" />
                </svg>
              </div>

              <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight text-ink [animation-delay:120ms] md:text-6xl">
                <span className="relative inline-block">
                  <span
                    className="animate-draw-line absolute inset-x-0.5 bottom-0.5 -z-10 h-4 rounded-full bg-primary/25 [animation-delay:650ms]"
                    aria-hidden="true"
                  />
                  0
                </span>{' '}
                Commission
                <br />
                <span className="relative inline-block">
                  <span
                    className="animate-draw-line absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-primary/25 [animation-delay:800ms]"
                    aria-hidden="true"
                  />
                  Tu
                </span>
                ition Platform
              </h1>

              <p className="animate-fade-up max-w-md text-lg text-ink-secondary [animation-delay:220ms]">
                Connect directly with guardians or tutors.{' '}
                <br className="hidden sm:block" />
                No middlemen, no commissions. Just tuition on your terms.
              </p>

              <div className="animate-fade-up flex flex-wrap gap-3 [animation-delay:320ms]">
                <Button asChild size="lg" className="transition-transform duration-fast hover:scale-[1.04] active:scale-[0.98]">
                  <Link href="/tutors">
                    <Search className="size-4" aria-hidden="true" />
                    Find a tutor
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="transition-transform duration-fast hover:scale-[1.04] active:scale-[0.98]"
                >
                  <Link href="/tuition">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    Find tuition
                  </Link>
                </Button>
              </div>
            </div>

            <div className="animate-scale-fade-in relative -mx-4 aspect-[4/3] sm:-mx-6 md:mx-0 md:-mr-8 md:aspect-auto md:h-full lg:-mr-12 xl:-mr-16 [animation-delay:100ms]">
              <Image
                src="/images/hero.png"
                alt="A guardian and a tutor shaking hands while a smiling student looks on"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="animate-ken-burns object-cover object-[50%_20%] md:object-[60%_30%]"
              />
            </div>
          </Container>
        </div>

        {/* Recent opportunities / tutors, only shown once real content exists */}
        {(recentListings.length > 0 || recentTutors.length > 0) && (
          <Container className="flex flex-col gap-8 py-8 md:gap-10 md:py-14">
            {recentListings.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold text-ink">Recent tuition opportunities</h2>
                  <Link href="/tuition" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {recentListings.map((listing) => (
                    <TuitionOpportunityCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            )}

            {recentTutors.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold text-ink">Tutors ready to teach</h2>
                  <Link href="/tutors" className="text-sm font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {recentTutors.map((tutor) => (
                    <TutorSpotlightCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
              </section>
            )}
          </Container>
        )}

        {/* Trust and safety */}
        <div className="border-t border-border bg-canvas">
          <Container className="flex flex-col gap-10 py-16">
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <span className="rounded-full bg-soft-green px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Why AMR Tutor
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                Built on trust, not commissions
              </h2>
              <p className="max-w-lg text-ink-secondary">
                The same promises every guardian and tutor can count on, every time.
              </p>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-3">
              {TRUST_POINTS.map(({ icon: Icon, title, description }, index) => (
                <Reveal key={title} delay={index * 120}>
                  <div className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all duration-base hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-soft-green text-primary transition-transform duration-base group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-ink">{title}</h3>
                    <p className="text-sm text-ink-secondary">{description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
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
