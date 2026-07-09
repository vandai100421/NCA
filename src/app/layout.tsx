import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AntdProviders } from '@/lib/antd-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NCA — Quản lý nhu cầu đặt ảnh',
  description: 'Hệ thống nội bộ quản lý nhu cầu đặt ảnh từ các nguồn vệ tinh, UAV, hàng không',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <AntdProviders>{children}</AntdProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
