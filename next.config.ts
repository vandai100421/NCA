import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/': ['node_modules/better-sqlite3/build/Release/**/*', 'node_modules/@prisma/engines/**/*'],
  },
};

export default nextConfig;
