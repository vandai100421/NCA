'use client';

import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

const NAV_ITEMS = [
  { key: '/', label: 'Tổng quan' },
  { key: '/nhu-cau-anh', label: 'Nhu cầu ảnh' },
  { key: '/nguon', label: 'Nguồn' },
  { key: '/muc-tieu', label: 'Mục tiêu' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const selectedKey = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`;

  return (
    <Sider theme="light" width={240} breakpoint="lg" collapsedWidth={0}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>NCA</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#8c8c8c' }}>Quản lý nhu cầu đặt ảnh</p>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={NAV_ITEMS}
        onClick={({ key }) => router.push(key)}
        style={{ borderInlineEnd: 'none' }}
      />
    </Sider>
  );
}
