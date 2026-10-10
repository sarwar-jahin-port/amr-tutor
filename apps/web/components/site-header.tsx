import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { AuthNav } from '@/features/auth/auth-nav';

const NAV_LINKS = [
  { href: '/tuition', label: 'Find tuition' },
  { href: '/tutors', label: 'Find tutors' },
  { href: '/how-it-works', label: 'How it works' },
];

/** Public navigation shared across marketing/browsing pages (ui-ux.md §7). */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="shrink-0 font-semibold tracking-tight text-ink">
          AMR Tutor
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <AuthNav />
      </Container>
    </header>
  );
}
