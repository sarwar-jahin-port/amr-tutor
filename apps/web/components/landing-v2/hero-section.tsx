import { GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { LANDING_V2_IMAGES } from './assets';

export function HeroSection() {
  return (
    <Container className="grid gap-12 pt-6 pb-16 md:grid-cols-[42fr_58fr] md:items-center md:gap-10 md:py-20">
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
          <Button
            asChild
            size="lg"
            className="transition-transform duration-fast hover:scale-[1.04] active:scale-[0.98]"
          >
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

      <ImagePlaceholder
        alt={LANDING_V2_IMAGES.hero.alt}
        src={LANDING_V2_IMAGES.hero.src}
        aspectRatio="1439 / 1093"
        priority
      />
    </Container>
  );
}
