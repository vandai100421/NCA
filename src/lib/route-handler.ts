import { ZodError } from 'zod';
import { apiError, type ApiError, type ErrorCode } from '@/lib/errors';
import { AppError } from '@/lib/errors';

const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  STATE_TRANSITION: 409,
  INTERNAL: 500,
  UNAUTHORIZED: 401,
};

function zodFirst(e: ZodError): ApiError {
  const first = e.issues[0];
  return {
    code: 'VALIDATION',
    message: first?.message ?? 'Dữ liệu không hợp lệ',
    field: first?.path[0]?.toString(),
  };
}

export function handleRouteError(e: unknown): Response {
  if (e instanceof ZodError) {
    return apiError(zodFirst(e), 400);
  }
  if (e instanceof AppError) {
    return apiError(
      { code: e.code, message: e.message, ...(e.field ? { field: e.field } : {}) },
      ERROR_STATUS[e.code],
    );
  }
  console.error('Route error:', e);
  return apiError({ code: 'INTERNAL', message: 'Lỗi server' }, 500);
}

export function parseId(idStr: string): number {
  const numId = Number(idStr);
  if (Number.isNaN(numId)) {
    throw new (class extends AppError {
      constructor() {
        super('VALIDATION', 'ID không hợp lệ', 400);
        this.name = 'ValidationError';
      }
    })();
  }
  return numId;
}
