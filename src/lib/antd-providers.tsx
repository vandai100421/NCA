'use client';

import type { ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

export function AntdProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
