import { CircleCheck, Percent, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Annotation, DoodleArrow, DoodleUnderline, Sparkle } from '@/components/annotation';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';

function BadgeIcon({ icon }: { icon: ReactNode }) {
  return (
    <span className="relative flex size-12 items-center justify-center rounded-2xl bg-surface text-primary shadow-elevated ring-1 ring-border">
      {icon}
      <Sparkle className="absolute -left-4 -top-4 size-5 -rotate-12 text-primary/40" />
    </span>
  );
}

function CardIllustration({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain p-2"
        sizes="(min-width: 1024px) 33vw, 100vw"
      />
    </div>
  );
}

const TRUST_CARDS = [
  {
    badge: (
      <span className="relative">
        <Percent className="size-5" aria-hidden="true" />
        <span className="absolute inset-0 -m-1 rotate-45 border-t-2 border-primary" aria-hidden="true" />
      </span>
    ),
    illustration: (
      <CardIllustration src="/images/why1.png" alt="A smiling student tutor carrying a backpack and textbooks" />
    ),
    title: 'Free for everyone',
    description: 'No commissions, no hidden fees. Tutors and guardians connect directly — without any middlemen.',
    annotation: (
      <div className="flex items-end gap-2">
        <Annotation rotate="-rotate-3">
          100% free
          <br />
          to use!
        </Annotation>
        <DoodleArrow className="mb-1 -scale-x-100 text-primary/50" />
      </div>
    ),
  },
  {
    badge: <ShieldCheck className="size-5" aria-hidden="true" />,
    illustration: (
      <CardIllustration
        src="/images/why2.png"
        alt="A phone showing a private profile protected by a lock icon"
      />
    ),
    title: 'Privacy by default',
    description: 'Phone numbers and emails stay private until both sides agree to share them.',
    annotation: (
      <div className="flex flex-col items-start gap-1">
        <Annotation rotate="-rotate-1">
          Your privacy, <span aria-hidden="true">♡</span>
          <br />
          our priority
        </Annotation>
        <DoodleUnderline className="ml-1" />
      </div>
    ),
  },
  {
    badge: <CircleCheck className="size-5" aria-hidden="true" />,
    illustration: (
      <CardIllustration
        src="/images/why3.png"
        alt="A verification checklist with a magnifying glass reviewing a tutor profile"
      />
    ),
    title: 'Verification, explained honestly',
    description: "We tell you exactly what's been checked about a tutor — and what hasn't.",
    annotation: (
      <div className="flex items-end gap-2">
        <Annotation rotate="rotate-2">
          Real checks.
          <br />
          Clear info.
        </Annotation>
        <DoodleArrow className="mb-1 -scale-x-100 text-primary/50" />
      </div>
    ),
  },
];

export function WhyAmrTutorSection() {
  return (
    <div className="border-t border-border bg-canvas">
      <Container className="flex flex-col gap-12 py-16 md:py-20">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <div className="relative inline-flex items-center gap-2">
            <Sparkle className="size-4 -rotate-45 text-primary/40" />
            <span className="rounded-full bg-soft-green px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Why AMR Tutor
            </span>
            <Sparkle className="size-4 rotate-[135deg] text-primary/40" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Built on trust, <span className="text-primary">not commissions</span>
          </h2>
          <p className="max-w-lg text-ink-secondary">
            The same promises every guardian and tutor can count on, every time.
          </p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {TRUST_CARDS.map(({ badge, illustration, title, description, annotation }, index) => (
            <Reveal key={title} delay={index * 120}>
              <div className="group flex h-full flex-col gap-5 rounded-3xl border border-border bg-surface p-6 transition-all duration-base hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated">
                <div className="h-48 w-full overflow-hidden rounded-2xl bg-soft-green/40">
                  {illustration}
                </div>

                <div className="flex flex-col gap-2">
                  <BadgeIcon icon={badge} />
                  <h3 className="text-lg font-semibold text-ink">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">{description}</p>
                </div>

                <div className="mt-auto pt-2">{annotation}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
