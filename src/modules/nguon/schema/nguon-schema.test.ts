import { describe, expect, it } from 'vitest';
import { createNguonSchema } from './nguon-schema';

const validNguon = {
  nguon: 'vệ tinh' as const,
  tenNguon: 'VNREDSat-1',
  thoiGianSuDung: '2020 - nay',
  tinhTrang: 'HOAT_DONG' as const,
};

describe('createNguonSchema', () => {
  it('hợp lệ khi đủ trường bắt buộc', () => {
    const parsed = createNguonSchema.parse(validNguon);
    expect(parsed.tenNguon).toBe('VNREDSat-1');
    expect(parsed.nguon).toBe('vệ tinh');
    expect(parsed.tinhTrang).toBe('HOAT_DONG');
  });

  it('hợp lệ khi có danhGia', () => {
    const parsed = createNguonSchema.parse({ ...validNguon, danhGia: 'Chất lượng tốt' });
    expect(parsed.danhGia).toBe('Chất lượng tốt');
  });

  it('hợp lệ khi danhGia rỗng', () => {
    const parsed = createNguonSchema.parse({ ...validNguon, danhGia: '' });
    expect(parsed.danhGia).toBe('');
  });

  it('lỗi khi thiếu tenNguon', () => {
    const { tenNguon: _omit, ...rest } = validNguon;
    const result = createNguonSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('lỗi khi tenNguon rỗng', () => {
    const result = createNguonSchema.safeParse({ ...validNguon, tenNguon: '' });
    expect(result.success).toBe(false);
  });

  it('lỗi khi thiếu thoiGianSuDung', () => {
    const { thoiGianSuDung: _omit, ...rest } = validNguon;
    const result = createNguonSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('lỗi khi nguon không hợp lệ', () => {
    const result = createNguonSchema.safeParse({ ...validNguon, nguon: 'không hợp lệ' });
    expect(result.success).toBe(false);
  });

  it('lỗi khi tinhTrang không hợp lệ', () => {
    const result = createNguonSchema.safeParse({ ...validNguon, tinhTrang: 'SAI' });
    expect(result.success).toBe(false);
  });

  it('chấp nhận các loại nguon hợp lệ', () => {
    for (const nguon of ['vệ tinh', 'UAV', 'hàng không'] as const) {
      const result = createNguonSchema.safeParse({ ...validNguon, nguon });
      expect(result.success).toBe(true);
    }
  });

  it('chấp nhận các tinhTrang hợp lệ', () => {
    for (const tinhTrang of ['HOAT_DONG', 'BAO_TRI', 'NGUNG_HOAT_DONG'] as const) {
      const result = createNguonSchema.safeParse({ ...validNguon, tinhTrang });
      expect(result.success).toBe(true);
    }
  });

  it('lỗi khi danhGia quá 2000 ký tự', () => {
    const result = createNguonSchema.safeParse({ ...validNguon, danhGia: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});
