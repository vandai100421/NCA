'use client';

import { Empty } from 'antd';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={description ?? title ?? 'Không có dữ liệu'}
      style={{ margin: '24px 0' }}
    >
      {action}
    </Empty>
  );
}
