import { describe, expect, it } from 'vitest';
import { nhuCauSyncRowSchema } from './nhu-cau-import-schema';

const validCoDinh = {
  mucTieu: 'Cầu Giấy',
  nguon: 'Vệ tinh 1',
  loaiNhuCau: 'Cố định',
  loaiAnhChup: 'Quang học',
  diaBan: 'Hà Nội',
  toaDoX: '105.85',
  toaDoY: '21.03',
  doPhanGiai: '0.5m',
  thoiGianDat: '',
  thoiGianChup: '2026-07-04 10:00',
  thoiGianMongMuonTu: '',
  thoiGianMongMuonDen: '',
  trangThai: '',
  thoiGianTra: '',
  moTa: '',
};

describe('nhuCauSyncRowSchema', () => {
  describe('trangThai', () => {
    it('tuỳ chọn, rỗng được chấp nhận', () => {
      const parsed = nhuCauSyncRowSchema.parse(validCoDinh);
      expect(parsed.trangThai).toBeUndefined();
    });

    it('chấp nhận nhãn tiếng Việt', () => {
      const parsed = nhuCauSyncRowSchema.parse({
        ...validCoDinh,
        trangThai: 'Đã nhận',
        thoiGianTra: '2026-07-05 14:00',
      });
      expect(parsed.trangThai).toBe('DA_NHAN');
    });

    it('chấp nhận mã enum', () => {
      const parsed = nhuCauSyncRowSchema.parse({ ...validCoDinh, trangThai: 'DA_HUY' });
      expect(parsed.trangThai).toBe('DA_HUY');
    });

    it('chấp nhận nhãn không phân biệt hoa thường', () => {
      const parsed = nhuCauSyncRowSchema.parse({ ...validCoDinh, trangThai: 'đã đặt' });
      expect(parsed.trangThai).toBe('DA_DAT');
    });

    it('lỗi khi trangThai không hợp lệ', () => {
      const result = nhuCauSyncRowSchema.safeParse({
        ...validCoDinh,
        trangThai: 'Đang xử lý',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('thoiGianTra', () => {
    it('tuỳ chọn, rỗng được chấp nhận', () => {
      const parsed = nhuCauSyncRowSchema.parse(validCoDinh);
      expect(parsed.thoiGianTra).toBeUndefined();
    });

    it('hợp lệ khi cung cấp chuỗi ISO', () => {
      const parsed = nhuCauSyncRowSchema.parse({
        ...validCoDinh,
        trangThai: 'Đã nhận',
        thoiGianTra: '2026-07-05 14:00',
      });
      expect(parsed.thoiGianTra).toBeInstanceOf(Date);
    });

    it('cảnh báo khi DA_NHAN mà không có thoiGianTra', () => {
      const result = nhuCauSyncRowSchema.safeParse({
        ...validCoDinh,
        trangThai: 'Đã nhận',
        thoiGianTra: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Thời gian trả ảnh'))).toBe(true);
      }
    });
  });

  describe('kế thừa validation từ import row', () => {
    it('lỗi khi thiếu mucTieu', () => {
      const result = nhuCauSyncRowSchema.safeParse({ ...validCoDinh, mucTieu: '' });
      expect(result.success).toBe(false);
    });

    it('lỗi khi CO_DINH thiếu thoiGianChup', () => {
      const result = nhuCauSyncRowSchema.safeParse({
        ...validCoDinh,
        thoiGianChup: '',
      });
      expect(result.success).toBe(false);
    });

    it('hợp lệ đầy đủ với trạng thái + thoiGianTra', () => {
      const parsed = nhuCauSyncRowSchema.parse({
        ...validCoDinh,
        trangThai: 'Đã nhận',
        thoiGianTra: '2026-07-05 14:00',
      });
      expect(parsed.trangThai).toBe('DA_NHAN');
      expect(parsed.thoiGianTra).toBeInstanceOf(Date);
    });
  });
});
