'use client';

import { Spin } from 'antd';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Đang tải...' }: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 0',
      }}
    >
      <Spin size="large" />
      <span style={{ color: '#8c8c8c' }}>{message}</span>
    </div>
  );
}
