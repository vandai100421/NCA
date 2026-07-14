import { z } from 'zod';
import { LOAI_ANH_CHUP_LABELS, LOAI_NHU_CAU_LABELS } from '@/modules/shared/constants';
import type { LoaiAnhChup, LoaiNhuCau } from '@/infrastructure/prisma/generated/client';

export interface ImportColumn {
  header: string;
  key: string;
  width: number;
  required: boolean;
  note?: string;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  {
    header: 'Mục tiêu',
    key: 'mucTieu',
    width: 22,
    required: true,
    note: 'Tên mục tiêu (phải đã có trong hệ thống)',
  },
  {
    header: 'Nguồn',
    key: 'nguon',
    width: 22,
    required: true,
    note: 'Tên nguồn (phải đã có trong hệ thống)',
  },
  {
    header: 'Loại nhu cầu',
    key: 'loaiNhuCau',
    width: 14,
    required: true,
    note: '"Cố định" hoặc "Đột xuất"',
  },
  {
    header: 'Loại ảnh chụp',
    key: 'loaiAnhChup',
    width: 16,
    required: true,
    note: 'Quang học, Hồng ngoại, SAR, Đa phổ, Siêu phổ, Nhiệt, Video',
  },
  { header: 'Địa bàn', key: 'diaBan', width: 24, required: true },
  { header: 'Tọa độ X', key: 'toaDoX', width: 12, required: true, note: 'Kinh độ' },
  { header: 'Tọa độ Y', key: 'toaDoY', width: 12, required: true, note: 'Vĩ độ' },
  { header: 'Độ phân giải', key: 'doPhanGiai', width: 14, required: true, note: 'VD: 0.5m, 1m' },
  {
    header: 'Thời gian đặt',
    key: 'thoiGianDat',
    width: 18,
    required: false,
    note: 'Bỏ trống = thời điểm hiện tại',
  },
  {
    header: 'Thời gian chụp',
    key: 'thoiGianChup',
    width: 18,
    required: false,
    note: 'Bắt buộc khi "Cố định"',
  },
  {
    header: 'Mong muốn từ',
    key: 'thoiGianMongMuonTu',
    width: 18,
    required: false,
    note: 'Bắt buộc khi "Đột xuất"',
  },
  {
    header: 'Mong muốn đến',
    key: 'thoiGianMongMuonDen',
    width: 18,
    required: false,
    note: 'Bắt buộc khi "Đột xuất"',
  },
  { header: 'Mô tả', key: 'moTa', width: 30, required: false },
];

function asString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'string') return v;
    return '';
  }, schema);
}

function makeEnumField<T extends string>(
  labels: Record<T, string>,
  requiredMsg: string,
  invalidMsg: (v: string) => string,
) {
  const reverse = new Map<string, T>();
  for (const [enumVal, label] of Object.entries(labels) as [T, string][]) {
    reverse.set(label.toLowerCase(), enumVal);
    reverse.set(enumVal.toLowerCase(), enumVal);
  }
  return z.preprocess(
    (v) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      if (typeof v === 'string') return v;
      return '';
    },
    z
      .string()
      .trim()
      .min(1, requiredMsg)
      .transform((val, ctx): T => {
        const found = reverse.get(val.toLowerCase().trim());
        if (!found) {
          ctx.addIssue({ code: 'custom', message: invalidMsg(val) });
          return z.NEVER;
        }
        return found;
      }),
  );
}

const loaiNhuCauField = makeEnumField<LoaiNhuCau>(
  LOAI_NHU_CAU_LABELS,
  'Loại nhu cầu là bắt buộc',
  (v) => `Loại nhu cầu "${v}" không hợp lệ (dùng "Cố định" hoặc "Đột xuất")`,
);

const loaiAnhChupField = makeEnumField<LoaiAnhChup>(
  LOAI_ANH_CHUP_LABELS,
  'Loại ảnh chụp là bắt buộc',
  (v) => `Loại ảnh chụp "${v}" không hợp lệ`,
);

export function parseImportDate(v: string | number): Date | null {
  if (typeof v === 'number') {
    if (v > 0 && v < 200000) {
      const ms = Math.round((v - 25569) * 86400000);
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  const s = v.trim();
  if (s.length === 0) return null;
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const d = new Date(s.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) {
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    const hh = m[4];
    const mi = m[5];
    if (dd && mm && yyyy) {
      const d = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        hh ? Number(hh) : 0,
        mi ? Number(mi) : 0,
      );
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const numberCell = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return v.trim();
    return '';
  },
  z.union([z.number(), z.string()]),
);

const dateCell = z
  .preprocess(
    (v): Date | string | number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (v instanceof Date) return v;
      if (typeof v === 'string') {
        const t = v.trim();
        return t.length === 0 ? undefined : t;
      }
      if (typeof v === 'number') return v;
      return undefined;
    },
    z.union([z.date(), z.string(), z.number()]).optional(),
  )
  .transform((v, ctx): Date | undefined => {
    if (v === undefined) return undefined;
    if (v instanceof Date) {
      if (Number.isNaN(v.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Ngày giờ không hợp lệ' });
        return z.NEVER;
      }
      return v;
    }
    const d = parseImportDate(v);
    if (!d) {
      ctx.addIssue({ code: 'custom', message: `Ngày giờ "${v}" không hợp lệ` });
      return z.NEVER;
    }
    return d;
  });

export const nhuCauImportRowSchema = z
  .object({
    mucTieu: asString(
      z.string().trim().min(1, 'Mục tiêu là bắt buộc').max(500, 'Mục tiêu quá 500 ký tự'),
    ),
    nguon: asString(z.string().trim().min(1, 'Nguồn là bắt buộc').max(500, 'Nguồn quá 500 ký tự')),
    loaiNhuCau: loaiNhuCauField,
    loaiAnhChup: loaiAnhChupField,
    diaBan: asString(
      z.string().trim().min(1, 'Địa bàn là bắt buộc').max(500, 'Địa bàn quá 500 ký tự'),
    ),
    toaDoX: numberCell.transform((v, ctx) => {
      if (typeof v === 'string') {
        if (v.length === 0) {
          ctx.addIssue({ code: 'custom', message: 'Tọa độ X là bắt buộc' });
          return z.NEVER;
        }
        if (Number.isNaN(Number(v))) {
          ctx.addIssue({ code: 'custom', message: 'Tọa độ X phải là số' });
          return z.NEVER;
        }
        return Number(v);
      }
      return v;
    }),
    toaDoY: numberCell.transform((v, ctx) => {
      if (typeof v === 'string') {
        if (v.length === 0) {
          ctx.addIssue({ code: 'custom', message: 'Tọa độ Y là bắt buộc' });
          return z.NEVER;
        }
        if (Number.isNaN(Number(v))) {
          ctx.addIssue({ code: 'custom', message: 'Tọa độ Y phải là số' });
          return z.NEVER;
        }
        return Number(v);
      }
      return v;
    }),
    doPhanGiai: asString(
      z.string().trim().min(1, 'Độ phân giải là bắt buộc').max(50, 'Độ phân giải quá 50 ký tự'),
    ),
    thoiGianDat: dateCell,
    thoiGianChup: dateCell,
    thoiGianMongMuonTu: dateCell,
    thoiGianMongMuonDen: dateCell,
    moTa: asString(z.string().trim().max(2000, 'Mô tả quá 2000 ký tự')),
  })
  .superRefine((data, ctx) => {
    if (data.loaiNhuCau === 'CO_DINH') {
      if (!data.thoiGianChup) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian chụp là bắt buộc khi loại nhu cầu "Cố định"',
          path: ['thoiGianChup'],
        });
      }
    } else {
      if (!data.thoiGianMongMuonTu) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian mong muốn từ là bắt buộc khi loại nhu cầu "Đột xuất"',
          path: ['thoiGianMongMuonTu'],
        });
      }
      if (!data.thoiGianMongMuonDen) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian mong muốn đến là bắt buộc khi loại nhu cầu "Đột xuất"',
          path: ['thoiGianMongMuonDen'],
        });
      }
      if (
        data.thoiGianMongMuonTu &&
        data.thoiGianMongMuonDen &&
        data.thoiGianMongMuonDen < data.thoiGianMongMuonTu
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian mong muốn đến phải sau thời gian từ',
          path: ['thoiGianMongMuonDen'],
        });
      }
    }
  });

export type NhuCauImportRow = z.infer<typeof nhuCauImportRowSchema>;

export interface NhuCauImportRowResult {
  row: number;
  status: 'success' | 'error';
  message?: string;
  id?: number;
  data: Record<string, unknown>;
}

export interface NhuCauImportResult {
  total: number;
  created: number;
  failed: number;
  results: NhuCauImportRowResult[];
}
