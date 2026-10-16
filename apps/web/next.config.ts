import { config as loadEnv } from 'dotenv';
import type { NextConfig } from 'next';
import path from 'node:path';

// Single source of truth for env vars is the monorepo-root .env, same as apps/api.
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
