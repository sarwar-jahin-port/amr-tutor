import Link from 'next/link';
import { Annotation, DoodleUnderline } from '@/components/annotation';
import { SkylineIllustration } from '@/components/skyline-illustration';
import { Container } from '@/components/ui/container';

const FOOTER_LINKS = [
  { href: '#mission', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/tutors', label: 'Find a Tutor' },
  { href: '/tuition', label: 'Find Tuition' },
  { href: '/safety-guidelines', label: 'Safety Guidelines' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/how-it-works', label: 'Contact' },
];

/** Global footer rendered on every page: mission statement, footer nav, and skyline illustration. */
export function SiteFooter() {
  return (
    <footer id="mission" className="relative overflow-hidden">
      <Container className="flex flex-col gap-10 pb-0 pt-16 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Annotation rotate="-rotate-1" className="text-2xl text-ink">
            Better Connections
            <br />
            for a Brighter Future
          </Annotation>
          <DoodleUnderline className="w-28" />
        </div>

        <div className="flex flex-col gap-1 text-sm text-ink-secondary sm:text-right">
          <p>A trusted, free platform for tutors</p>
          <p>and guardians in Bangladesh.</p>
          <p className="font-handwritten mt-1 text-xl text-ink/70">Together ♡</p>
        </div>
      </Container>

      <Container className="flex flex-col gap-4 pb-10 pt-10 text-sm text-ink-secondary sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:border-t sm:border-border sm:pt-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="max-w-sm text-xs text-ink-secondary">
          AMR Tutor never charges a placement commission on tuition arranged through the
          platform.
        </p>
      </Container>

      <SkylineIllustration />
    </footer>
  );
}
