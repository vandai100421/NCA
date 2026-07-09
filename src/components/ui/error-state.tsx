'use client';

import { Button, Result } from 'antd';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Lỗi tải dữ liệu', onRetry }: ErrorStateProps) {
  return (
    <Result
      status="error"
      title="Đã có lỗi xảy ra"
      subTitle={message}
      extra={onRetry ? <Button onClick={onRetry}>Thử lại</Button> : undefined}
    />
  );
}
