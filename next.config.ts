import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['exceljs'],
  outputFileTracingIncludes: {
    '/': ['node_modules/better-sqlite3/build/Release/**/*', 'node_modules/@prisma/engines/**/*'],
  },
  allowedDevOrigins: ['192.168.100.90'],
};

export default nextConfig;
