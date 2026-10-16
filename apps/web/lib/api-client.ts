import { env } from './env';

export interface ApiHealth {
  status: 'ok';
  uptimeSeconds: number;
}

export async function getApiHealth(): Promise<ApiHealth | null> {
  try {
    const response = await fetch(`${env.apiUrl}/health`, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ApiHealth;
  } catch {
    return null;
  }
}
