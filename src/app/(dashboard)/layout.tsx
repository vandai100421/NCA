'use client';

import type { ReactNode } from 'react';
import { Layout } from 'antd';
import { Sidebar } from '@/components/layout/sidebar';
import { QueryProvider } from '@/lib/query-provider';

const { Content } = Layout;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout>
          <Content style={{ padding: '24px 32px', overflow: 'auto' }}>{children}</Content>
        </Layout>
      </Layout>
    </QueryProvider>
  );
}
