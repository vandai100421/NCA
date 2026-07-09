import { describe, expect, it } from 'vitest';
import { createNhuCauSchema, nhuCauListQuerySchema, transitionSchema } from './nhu-cau-anh-schema';

const validCommon = {
  mucTieuId: 1,
  nguonId: 1,
  diaBan: 'Hà Nội',
  loaiAnhChup: 'QUANG_HOC',
  toaDoX: 105.85,
  toaDoY: 21.03,
  doPhanGiai: '0.5m',
};

describe('createNhuCauSchema', () => {
  describe('CO_DINH', () => {
    it('hợp lệ khi đủ thoiGianChup', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
      };
      const parsed = createNhuCauSchema.parse(input);
      expect(parsed.loaiNhuCau).toBe('CO_DINH');
      expect(parsed.thoiGianChup).toBeInstanceOf(Date);
      expect(parsed.thoiGianMongMuonTu).toBeUndefined();
      expect(parsed.thoiGianMongMuonDen).toBeUndefined();
    });

    it('lỗi khi thiếu thoiGianChup', () => {
      const input = { ...validCommon, loaiNhuCau: 'CO_DINH' as const };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('lỗi khi cung cấp thoiGianMongMuonTu/Den ở nhánh CO_DINH', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
        thoiGianMongMuonTu: '2026-07-04T08:00',
        thoiGianMongMuonDen: '2026-07-04T12:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('DOT_XUAT', () => {
    it('hợp lệ khi đủ khoảng mong muốn', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'DOT_XUAT' as const,
        thoiGianMongMuonTu: '2026-07-04T08:00',
        thoiGianMongMuonDen: '2026-07-04T12:00',
      };
      const parsed = createNhuCauSchema.parse(input);
      expect(parsed.loaiNhuCau).toBe('DOT_XUAT');
      expect(parsed.thoiGianChup).toBeUndefined();
      expect(parsed.thoiGianMongMuonTu).toBeInstanceOf(Date);
      expect(parsed.thoiGianMongMuonDen).toBeInstanceOf(Date);
    });

    it('lỗi khi thiếu thoiGianMongMuonTu', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'DOT_XUAT' as const,
        thoiGianMongMuonDen: '2026-07-04T12:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('lỗi khi thiếu thoiGianMongMuonDen', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'DOT_XUAT' as const,
        thoiGianMongMuonTu: '2026-07-04T08:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('lỗi khi thoiGianMongMuonDen < thoiGianMongMuonTu', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'DOT_XUAT' as const,
        thoiGianMongMuonTu: '2026-07-04T12:00',
        thoiGianMongMuonDen: '2026-07-04T08:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Thời gian đến phải sau thời gian từ');
      }
    });

    it('hợp lệ khi thoiGianMongMuonDen = thoiGianMongMuonTu', () => {
      const input = {
        ...validCommon,
        loaiNhuCau: 'DOT_XUAT' as const,
        thoiGianMongMuonTu: '2026-07-04T10:00',
        thoiGianMongMuonDen: '2026-07-04T10:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('common field validation', () => {
    it('lỗi khi thiếu mucTieuId', () => {
      const { mucTieuId: _omit, ...rest } = validCommon;
      const input = { ...rest, loaiNhuCau: 'CO_DINH' as const, thoiGianChup: '2026-07-04T10:00' };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('lỗi khi diaBan rỗng', () => {
      const input = {
        ...validCommon,
        diaBan: '',
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('lỗi khi loaiAnhChup không hợp lệ', () => {
      const input = {
        ...validCommon,
        loaiAnhChup: 'KHONG_HOP_LE',
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
      };
      const result = createNhuCauSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('coerce chuỗi số sang number cho toaDoX/Y', () => {
      const input = {
        ...validCommon,
        toaDoX: '105.85',
        toaDoY: '21.03',
        mucTieuId: '1',
        nguonId: '1',
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
      };
      const parsed = createNhuCauSchema.parse(input);
      expect(parsed.toaDoX).toBe(105.85);
      expect(parsed.toaDoY).toBe(21.03);
      expect(parsed.mucTieuId).toBe(1);
    });

    it('moTa tuỳ chọn, rỗng được chấp nhận', () => {
      const input = {
        ...validCommon,
        moTa: '',
        loaiNhuCau: 'CO_DINH' as const,
        thoiGianChup: '2026-07-04T10:00',
      };
      const parsed = createNhuCauSchema.parse(input);
      expect(parsed.moTa).toBe('');
    });
  });
});

describe('transitionSchema', () => {
  it('hợp lệ với trạng thái mới + ghiChu', () => {
    const parsed = transitionSchema.parse({ trangThaiMoi: 'DA_NHAN', ghiChu: 'Đã nhận ảnh' });
    expect(parsed.trangThaiMoi).toBe('DA_NHAN');
    expect(parsed.ghiChu).toBe('Đã nhận ảnh');
  });

  it('hợp lệ không có ghiChu', () => {
    const parsed = transitionSchema.parse({ trangThaiMoi: 'DA_HUY' });
    expect(parsed.trangThaiMoi).toBe('DA_HUY');
  });

  it('lỗi khi thiếu trangThaiMoi', () => {
    const result = transitionSchema.safeParse({ ghiChu: 'abc' });
    expect(result.success).toBe(false);
  });

  it('lỗi khi trangThaiMoi không hợp lệ', () => {
    const result = transitionSchema.safeParse({ trangThaiMoi: 'KHONG_HOP_LE' });
    expect(result.success).toBe(false);
  });
});

describe('nhuCauListQuerySchema', () => {
  it('mặc định page=1, pageSize=10', () => {
    const parsed = nhuCauListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });

  it('coerce chuỗi sang số cho page/pageSize', () => {
    const parsed = nhuCauListQuerySchema.parse({ page: '2', pageSize: '20' });
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(20);
  });

  it('lỗi khi pageSize > 100', () => {
    const result = nhuCauListQuerySchema.safeParse({ pageSize: '200' });
    expect(result.success).toBe(false);
  });

  it('chấp nhận filter trangThai hợp lệ', () => {
    const parsed = nhuCauListQuerySchema.parse({ trangThai: 'DA_DAT' });
    expect(parsed.trangThai).toBe('DA_DAT');
  });

  it('chấp nhận search', () => {
    const parsed = nhuCauListQuerySchema.parse({ search: 'Hà Nội' });
    expect(parsed.search).toBe('Hà Nội');
  });

  it('trim search', () => {
    const parsed = nhuCauListQuerySchema.parse({ search: '  Hà Nội  ' });
    expect(parsed.search).toBe('Hà Nội');
  });
});
