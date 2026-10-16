import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Container } from '@/components/ui/container';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}

/** Shared reading-column layout for the policy pages linked from the site footer. */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main>
        <Container as="article" narrow className="flex flex-col gap-10 py-12 sm:py-16">
          <header className="flex flex-col gap-3 border-b border-border pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
            <p className="text-sm text-ink-secondary">Last updated: {updated}</p>
            <div className="max-w-prose leading-relaxed text-ink-secondary">{intro}</div>
          </header>

          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-ink">{section.heading}</h2>
                <div className="flex max-w-prose flex-col gap-3 leading-relaxed text-ink-secondary">{section.body}</div>
              </section>
            ))}
          </div>
        </Container>
      </main>
    </>
  );
}
