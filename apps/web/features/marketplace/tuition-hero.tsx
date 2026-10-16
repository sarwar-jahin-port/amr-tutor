import { GraduationCap } from 'lucide-react';
import { Annotation, Sparkle } from '@/components/annotation';
import { Container } from '@/components/ui/container';

export function TuitionHero() {
  return (
    <div className="border-b border-border bg-canvas">
      <Container className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <span className="hidden shrink-0 items-center justify-center rounded-full bg-mint p-2 sm:flex">
            <GraduationCap className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Find tuition</h1>
            <p className="text-sm text-ink-secondary">
              Browse published tuition opportunities from guardians across Bangladesh.
            </p>
          </div>
        </div>

        <div className="relative hidden shrink-0 items-center lg:flex">
          <Sparkle className="absolute -right-3 -top-3 size-3.5 rotate-45 text-primary/40" />
          <Annotation rotate="-rotate-2" className="text-base leading-tight">
            Better learning opportunities
          </Annotation>
        </div>
      </Container>
    </div>
  );
}
