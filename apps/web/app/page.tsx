import { GraduationCap, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AudienceSections } from '@/components/audience-sections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SiteHeader } from '@/components/site-header';
import { WhyAmrTutorSection } from '@/components/why-amr-tutor-section';
import { getListing, getTutor, searchListings, searchTutors } from '@/features/marketplace/api';
import { TuitionOpportunityCard } from '@/features/marketplace/tuition-opportunity-card';
import { TutorProfileCard } from '@/features/marketplace/tutor-profile-card';
import type { ListingDetail, TutorProfile } from '@/features/marketplace/types';

export default async function HomePage() {
  const [listings, tutors] = await Promise.all([
    searchListings({ page: 1 }),
    searchTutors({ page: 1 }),
  ]);

  const recentListingSummaries = listings.status === 'ok' ? listings.data.slice(0, 3) : [];
  const recentListings = (
    await Promise.all(recentListingSummaries.map((listing) => getListing(listing.id)))
  )
    .map((result) => (result.status === 'ok' ? result.data : null))
    .filter((listing): listing is ListingDetail => listing !== null);

  const recentTutorSummaries = tutors.status === 'ok' ? tutors.data.slice(0, 3) : [];
  const recentTutors = (await Promise.all(recentTutorSummaries.map((tutor) => getTutor(tutor.id))))
    .map((result) => (result.status === 'ok' ? result.data : null))
    .filter((tutor): tutor is TutorProfile => tutor !== null);

  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden bg-canvas">
          <Container className="grid gap-10 pt-8 pb-0 md:grid-cols-2 md:items-stretch md:pt-14">
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

            <div className="animate-scale-fade-in relative -mx-4 aspect-[1439/1093] self-center sm:-mx-6 md:mx-0 md:-mr-8 lg:-mr-12 xl:-mr-16 [animation-delay:100ms]">
              <Image
                src="/images/hero2.png"
                alt="A guardian and a tutor shaking hands while a smiling student looks on"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="animate-ken-burns object-contain"
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentTutors.map((tutor) => (
                    <TutorProfileCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>
              </section>
            )}
          </Container>
        )}

        <AudienceSections />

        {/* Trust and safety */}
        <WhyAmrTutorSection />
      </main>
    </>
  );
}
