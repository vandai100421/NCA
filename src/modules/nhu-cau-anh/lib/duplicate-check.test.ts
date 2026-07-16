import { describe, expect, it } from 'vitest';
import { buildNhuCauKey } from './duplicate-check';

describe('buildNhuCauKey', () => {
  const base = {
    mucTieuId: 1,
    nguonId: 2,
    diaBan: 'Hà Nội',
    loaiNhuCau: 'CO_DINH' as const,
  };

  it('dùng thoiGianChup cho CO_DINH', () => {
    const t = new Date('2026-07-04T10:00:00Z');
    const k1 = buildNhuCauKey({ ...base, thoiGianChup: t });
    const k2 = buildNhuCauKey({ ...base, thoiGianChup: new Date('2026-07-04T10:00:00Z') });
    expect(k1).toBe(k2);
  });

  it('dùng thoiGianMongMuonTu cho DOT_XUAT (bỏ qua thoiGianChup)', () => {
    const tu = new Date('2026-07-10T08:00:00Z');
    const k1 = buildNhuCauKey({
      ...base,
      loaiNhuCau: 'DOT_XUAT',
      thoiGianMongMuonTu: tu,
      thoiGianChup: new Date('2099-01-01T00:00:00Z'),
    });
    const k2 = buildNhuCauKey({
      ...base,
      loaiNhuCau: 'DOT_XUAT',
      thoiGianMongMuonTu: tu,
    });
    expect(k1).toBe(k2);
  });

  it('khác mucTieuId → key khác', () => {
    expect(buildNhuCauKey({ ...base, thoiGianChup: new Date('2026-01-01') })).not.toBe(
      buildNhuCauKey({ ...base, mucTieuId: 99, thoiGianChup: new Date('2026-01-01') }),
    );
  });

  it('khác thời gian → key khác', () => {
    expect(buildNhuCauKey({ ...base, thoiGianChup: new Date('2026-01-01T00:00:00Z') })).not.toBe(
      buildNhuCauKey({ ...base, thoiGianChup: new Date('2026-02-01T00:00:00Z') }),
    );
  });

  it('diaBan khác chữ hoa/thường → key trùng', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(buildNhuCauKey({ ...base, diaBan: 'Hà Nội', thoiGianChup: t })).toBe(
      buildNhuCauKey({ ...base, diaBan: 'hà nội', thoiGianChup: t }),
    );
  });

  it('diaBan khác khoảng trắng → key trùng', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(buildNhuCauKey({ ...base, diaBan: '  Hà Nội  ', thoiGianChup: t })).toBe(
      buildNhuCauKey({ ...base, diaBan: 'Hà Nội', thoiGianChup: t }),
    );
  });

  it('thoiGianChup undefined cho CO_DINH → key vẫn dựng được', () => {
    expect(() => buildNhuCauKey({ ...base, thoiGianChup: undefined })).not.toThrow();
  });
});
