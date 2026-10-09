import { getApiHealth } from '@/lib/api-client';
import { AuthNav } from '@/features/auth/auth-nav';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <>
      <header className="border-b border-border">
        <Container className="flex items-center justify-between py-4">
          <span className="font-semibold tracking-tight text-ink">AMR Tutor</span>
          <AuthNav />
        </Container>
      </header>
      <Container
        as="main"
        narrow
        className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center"
      >
        <h1 className="text-4xl font-semibold tracking-tight text-ink">AMR Tutor</h1>
        <p className="text-ink-secondary">
          A free marketplace connecting parents and home tutors across Bangladesh.
        </p>
        <Badge variant={health ? 'success' : 'danger'}>
          API status: {health ? `online (${health.uptimeSeconds}s uptime)` : 'unreachable'}
        </Badge>
      </Container>
    </>
  );
}
