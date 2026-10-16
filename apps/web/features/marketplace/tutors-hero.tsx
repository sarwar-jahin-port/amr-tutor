import { UserSearch } from 'lucide-react';
import { Sparkle } from '@/components/annotation';
import { Container } from '@/components/ui/container';

export function TutorsHero() {
  return (
    <div className="border-b border-border bg-canvas">
      <Container className="flex items-center gap-3 py-3">
        <span className="relative hidden shrink-0 items-center justify-center rounded-full bg-mint p-2 sm:flex">
          <Sparkle className="absolute -right-2 -top-2 size-3.5 rotate-45 text-primary/40" />
          <UserSearch className="size-5 text-primary" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Find a tutor</h1>
          <p className="text-sm text-ink-secondary">Browse university students available to teach near you.</p>
        </div>
      </Container>
    </div>
  );
}
