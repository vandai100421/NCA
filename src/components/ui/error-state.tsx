import * as React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps extends React.ComponentProps<'div'> {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Lỗi tải dữ liệu',
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-4 mr-2" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
