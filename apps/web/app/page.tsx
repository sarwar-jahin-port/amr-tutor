import { getApiHealth } from '@/lib/api-client';

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AMR Tutor</h1>
      <p className="text-stone-600">
        A free marketplace connecting parents and home tutors across Bangladesh.
      </p>
      <p
        className={
          health
            ? 'rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-800'
            : 'rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-800'
        }
      >
        API status: {health ? `online (${health.uptimeSeconds}s uptime)` : 'unreachable'}
      </p>
    </main>
  );
}
