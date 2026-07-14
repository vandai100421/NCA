import { z } from 'zod';

const loaiAnhChupEnum = z.enum(
  ['QUANG_HOC', 'HONG_NGOAI', 'SAR', 'DA_PHO', 'SIEU_PHO', 'NHIET', 'VIDEO'],
  { message: 'Loại ảnh chụp không hợp lệ' },
);

const numericString = (msg: string) =>
  z
    .string()
    .min(1, msg)
    .refine((v) => !Number.isNaN(Number(v)), { message: 'Phải là số' });

export const nhuCauFormSchema = z
  .object({
    mucTieuId: numericString('Mục tiêu là bắt buộc'),
    nguonId: numericString('Nguồn là bắt buộc'),
    loaiNhuCau: z.enum(['CO_DINH', 'DOT_XUAT'], { message: 'Loại nhu cầu không hợp lệ' }),
    diaBan: z.string().trim().min(1, 'Địa bàn là bắt buộc').max(500, 'Địa bàn quá 500 ký tự'),
    loaiAnhChup: loaiAnhChupEnum,
    toaDoX: numericString('Tọa độ X là bắt buộc'),
    toaDoY: numericString('Tọa độ Y là bắt buộc'),
    thoiGianDat: z.string().optional().or(z.literal('')),
    thoiGianChup: z.string().optional().or(z.literal('')),
    thoiGianMongMuonTu: z.string().optional().or(z.literal('')),
    thoiGianMongMuonDen: z.string().optional().or(z.literal('')),
    doPhanGiai: z
      .string()
      .trim()
      .min(1, 'Độ phân giải là bắt buộc')
      .max(50, 'Độ phân giải quá 50 ký tự'),
    moTa: z.string().trim().max(2000, 'Mô tả quá 2000 ký tự').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.loaiNhuCau === 'CO_DINH') {
      if (!data.thoiGianChup || data.thoiGianChup.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian chụp là bắt buộc khi cố định',
          path: ['thoiGianChup'],
        });
      }
    } else {
      if (!data.thoiGianMongMuonTu || data.thoiGianMongMuonTu.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian mong muốn từ là bắt buộc khi đột xuất',
          path: ['thoiGianMongMuonTu'],
        });
      }
      if (!data.thoiGianMongMuonDen || data.thoiGianMongMuonDen.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian mong muốn đến là bắt buộc khi đột xuất',
          path: ['thoiGianMongMuonDen'],
        });
      }
      if (
        data.thoiGianMongMuonTu &&
        data.thoiGianMongMuonDen &&
        new Date(data.thoiGianMongMuonDen) < new Date(data.thoiGianMongMuonTu)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thời gian đến phải sau thời gian từ',
          path: ['thoiGianMongMuonDen'],
        });
      }
    }
  });

export type NhuCauFormValues = z.infer<typeof nhuCauFormSchema>;
