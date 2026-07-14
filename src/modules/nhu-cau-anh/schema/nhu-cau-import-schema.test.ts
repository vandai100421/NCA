import { describe, expect, it } from 'vitest';
import { nhuCauImportRowSchema, parseImportDate } from './nhu-cau-import-schema';

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
  moTa: '',
};

const validDotXuat = {
  ...validCoDinh,
  loaiNhuCau: 'Đột xuất',
  thoiGianChup: '',
  thoiGianMongMuonTu: '2026-07-10 08:00',
  thoiGianMongMuonDen: '2026-07-12 18:00',
};

describe('nhuCauImportRowSchema', () => {
  describe('nhãn tiếng Việt & enum', () => {
    it('chấp nhận nhãn tiếng Việt cho loaiNhuCau/loaiAnhChup', () => {
      const parsed = nhuCauImportRowSchema.parse(validCoDinh);
      expect(parsed.loaiNhuCau).toBe('CO_DINH');
      expect(parsed.loaiAnhChup).toBe('QUANG_HOC');
    });

    it('chấp nhận mã enum trực tiếp', () => {
      const parsed = nhuCauImportRowSchema.parse({
        ...validCoDinh,
        loaiNhuCau: 'CO_DINH',
        loaiAnhChup: 'SAR',
      });
      expect(parsed.loaiNhuCau).toBe('CO_DINH');
      expect(parsed.loaiAnhChup).toBe('SAR');
    });

    it('chấp nhận nhãn không phân biệt hoa thường', () => {
      const parsed = nhuCauImportRowSchema.parse({
        ...validCoDinh,
        loaiNhuCau: 'cố định',
        loaiAnhChup: 'quang học',
      });
      expect(parsed.loaiNhuCau).toBe('CO_DINH');
      expect(parsed.loaiAnhChup).toBe('QUANG_HOC');
    });

    it('lỗi khi loaiNhuCau không hợp lệ', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validCoDinh,
        loaiNhuCau: 'Bất thường',
      });
      expect(result.success).toBe(false);
    });

    it('lỗi khi loaiAnhChup không hợp lệ', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validCoDinh,
        loaiAnhChup: 'Ảnh thường',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CO_DINH', () => {
    it('hợp lệ khi có thoiGianChup', () => {
      const parsed = nhuCauImportRowSchema.parse(validCoDinh);
      expect(parsed.thoiGianChup).toBeInstanceOf(Date);
      expect(parsed.thoiGianMongMuonTu).toBeUndefined();
    });

    it('lỗi khi thiếu thoiGianChup', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validCoDinh,
        thoiGianChup: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Thời gian chụp'))).toBe(true);
      }
    });
  });

  describe('DOT_XUAT', () => {
    it('hợp lệ khi đủ khoảng mong muốn', () => {
      const parsed = nhuCauImportRowSchema.parse(validDotXuat);
      expect(parsed.loaiNhuCau).toBe('DOT_XUAT');
      expect(parsed.thoiGianMongMuonTu).toBeInstanceOf(Date);
      expect(parsed.thoiGianMongMuonDen).toBeInstanceOf(Date);
      expect(parsed.thoiGianChup).toBeUndefined();
    });

    it('lỗi khi thiếu thoiGianMongMuonTu', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validDotXuat,
        thoiGianMongMuonTu: '',
      });
      expect(result.success).toBe(false);
    });

    it('lỗi khi den < tu', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validDotXuat,
        thoiGianMongMuonTu: '2026-07-12 18:00',
        thoiGianMongMuonDen: '2026-07-10 08:00',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('trường bắt buộc', () => {
    it('lỗi khi thiếu mucTieu', () => {
      const result = nhuCauImportRowSchema.safeParse({ ...validCoDinh, mucTieu: '' });
      expect(result.success).toBe(false);
    });

    it('lỗi khi thiếu nguon', () => {
      const result = nhuCauImportRowSchema.safeParse({ ...validCoDinh, nguon: '' });
      expect(result.success).toBe(false);
    });

    it('lỗi khi toaDoX rỗng', () => {
      const result = nhuCauImportRowSchema.safeParse({ ...validCoDinh, toaDoX: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Tọa độ X'))).toBe(true);
      }
    });

    it('lỗi khi toaDoY không phải số', () => {
      const result = nhuCauImportRowSchema.safeParse({ ...validCoDinh, toaDoY: 'abc' });
      expect(result.success).toBe(false);
    });

    it('toaDoX dạng số được chấp nhận', () => {
      const parsed = nhuCauImportRowSchema.parse({ ...validCoDinh, toaDoX: 105.85 });
      expect(parsed.toaDoX).toBe(105.85);
    });
  });

  describe('thoiGianDat', () => {
    it('tuỳ chọn, bỏ trống được chấp nhận', () => {
      const parsed = nhuCauImportRowSchema.parse({ ...validCoDinh, thoiGianDat: '' });
      expect(parsed.thoiGianDat).toBeUndefined();
    });

    it('chấp nhận Date object (từ exceljs)', () => {
      const d = new Date('2026-07-01T08:30:00');
      const parsed = nhuCauImportRowSchema.parse({ ...validCoDinh, thoiGianDat: d });
      expect(parsed.thoiGianDat).toBeInstanceOf(Date);
    });

    it('hợp lệ khi cung cấp chuỗi ISO', () => {
      const parsed = nhuCauImportRowSchema.parse({
        ...validCoDinh,
        thoiGianDat: '2026-07-01T08:30',
      });
      expect(parsed.thoiGianDat).toBeInstanceOf(Date);
    });
  });

  describe('chuỗi rỗng / null', () => {
    it('ô null được coi như bỏ trống', () => {
      const result = nhuCauImportRowSchema.safeParse({
        ...validCoDinh,
        thoiGianDat: null,
        moTa: null,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('parseImportDate', () => {
  it('ISO YYYY-MM-DDTHH:mm', () => {
    const d = parseImportDate('2026-07-04T10:00');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2026);
  });

  it('ISO với dấu cách YYYY-MM-DD HH:mm', () => {
    const d = parseImportDate('2026-07-04 10:00');
    expect(d).toBeInstanceOf(Date);
  });

  it('dd/mm/yyyy', () => {
    const d = parseImportDate('04/07/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(4);
  });

  it('dd/mm/yyyy HH:mm', () => {
    const d = parseImportDate('04/07/2026 10:30');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getHours()).toBe(10);
    expect(d?.getMinutes()).toBe(30);
  });

  it('dd-mm-yyyy', () => {
    const d = parseImportDate('04-07-2026');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getDate()).toBe(4);
  });

  it('chuỗi rỗng trả về null', () => {
    expect(parseImportDate('')).toBeNull();
    expect(parseImportDate('   ')).toBeNull();
  });

  it('chuỗi không hợp lệ trả về null', () => {
    expect(parseImportDate('khong-hop-le')).toBeNull();
  });
});
