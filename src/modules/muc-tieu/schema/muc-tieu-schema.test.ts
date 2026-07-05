import { describe, expect, it } from 'vitest';
import { createMucTieuSchema } from './muc-tieu-schema';

describe('createMucTieuSchema', () => {
  it('hợp lệ khi đủ ten', () => {
    const parsed = createMucTieuSchema.parse({ ten: 'Cầu Long Biên' });
    expect(parsed.ten).toBe('Cầu Long Biên');
  });

  it('trim ten', () => {
    const parsed = createMucTieuSchema.parse({ ten: '  Cầu Long Biên  ' });
    expect(parsed.ten).toBe('Cầu Long Biên');
  });

  it('lỗi khi thiếu ten', () => {
    const result = createMucTieuSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('lỗi khi ten rỗng', () => {
    const result = createMucTieuSchema.safeParse({ ten: '' });
    expect(result.success).toBe(false);
  });

  it('lỗi khi ten rỗng sau trim', () => {
    const result = createMucTieuSchema.safeParse({ ten: '   ' });
    expect(result.success).toBe(false);
  });

  it('lỗi khi ten quá 255 ký tự', () => {
    const result = createMucTieuSchema.safeParse({ ten: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('hợp lệ khi ten đúng 255 ký tự', () => {
    const result = createMucTieuSchema.safeParse({ ten: 'a'.repeat(255) });
    expect(result.success).toBe(true);
  });
});
