import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { NextConfig } from 'next';

const rootEnvironmentPath = resolve(process.cwd(), '../../.env');

if (existsSync(rootEnvironmentPath)) {
  process.loadEnvFile(rootEnvironmentPath);
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@learning-os/configuration', '@learning-os/ui'],
};

export default nextConfig;
