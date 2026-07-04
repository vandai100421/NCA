export type ErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'STATE_TRANSITION' | 'INTERNAL' | 'UNAUTHORIZED';

export interface ApiError {
  code: ErrorCode;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly field?: string;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number, field?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super('VALIDATION', message, 400, field);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} không tồn tại`, 404);
    this.name = 'NotFoundError';
  }
}

export class StateTransitionError extends AppError {
  constructor(from: string, to: string) {
    super('STATE_TRANSITION', `Không thể chuyển trạng thái từ "${from}" sang "${to}"`, 409);
    this.name = 'StateTransitionError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

export function apiError(error: ApiError, status: number): Response {
  return Response.json({ success: false, error } satisfies ApiResponse<never>, { status });
}

export function toApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}
